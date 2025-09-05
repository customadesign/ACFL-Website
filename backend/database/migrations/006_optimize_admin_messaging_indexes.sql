-- Migration: Optimize admin messaging indexes
-- This migration adds indexes specifically for admin messaging performance

-- Index for admin conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_admin_conversations 
ON public.messages (sender_id, recipient_id, created_at DESC);

-- Index for unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages (recipient_id, read_at) 
WHERE read_at IS NULL;

-- Index for non-deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_not_deleted 
ON public.messages (sender_id, recipient_id, created_at) 
WHERE NOT deleted_for_everyone;

-- Index for messages with attachments
CREATE INDEX IF NOT EXISTS idx_messages_attachments 
ON public.messages (attachment_url) 
WHERE attachment_url IS NOT NULL;

-- Index for hidden messages array
CREATE INDEX IF NOT EXISTS idx_messages_hidden_users 
ON public.messages USING GIN (hidden_for_users);

-- Function to get conversation summary for admin
CREATE OR REPLACE FUNCTION public.get_admin_conversation_summary(admin_id UUID)
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  partner_role TEXT,
  last_body TEXT,
  last_at TIMESTAMPTZ,
  unread_count BIGINT,
  total_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    SELECT DISTINCT
      CASE 
        WHEN m.sender_id = admin_id THEN m.recipient_id 
        ELSE m.sender_id 
      END as pid
    FROM public.messages m
    WHERE (m.sender_id = admin_id OR m.recipient_id = admin_id)
      AND NOT m.deleted_for_everyone
      AND NOT (admin_id = ANY(m.hidden_for_users))
  ),
  partner_info AS (
    SELECT 
      cp.pid,
      COALESCE(c.first_name || ' ' || c.last_name, co.first_name || ' ' || co.last_name, 'Unknown User') as name,
      CASE 
        WHEN c.id IS NOT NULL THEN 'client'
        WHEN co.id IS NOT NULL THEN 'coach'
        ELSE 'unknown'
      END as role
    FROM conversation_partners cp
    LEFT JOIN public.clients c ON c.id = cp.pid
    LEFT JOIN public.coaches co ON co.id = cp.pid
  ),
  message_stats AS (
    SELECT 
      CASE 
        WHEN m.sender_id = admin_id THEN m.recipient_id 
        ELSE m.sender_id 
      END as pid,
      MAX(m.created_at) as last_message_time,
      COUNT(*) as total_count,
      COUNT(CASE WHEN m.recipient_id = admin_id AND m.read_at IS NULL THEN 1 END) as unread_count,
      (array_agg(m.body ORDER BY m.created_at DESC))[1] as last_message_body
    FROM public.messages m
    WHERE (m.sender_id = admin_id OR m.recipient_id = admin_id)
      AND NOT m.deleted_for_everyone
      AND NOT (admin_id = ANY(m.hidden_for_users))
    GROUP BY pid
  )
  SELECT 
    pi.pid,
    pi.name,
    pi.role,
    ms.last_message_body,
    ms.last_message_time,
    ms.unread_count,
    ms.total_count
  FROM partner_info pi
  JOIN message_stats ms ON ms.pid = pi.pid
  ORDER BY ms.last_message_time DESC;
END;
$$ LANGUAGE plpgsql;