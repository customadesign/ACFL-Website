-- Add foreign key constraints to messages table for proper relationships
-- This will allow Supabase to perform joins correctly

-- First, let's add foreign key constraints to the messages table
-- Note: We can't add direct foreign keys to sender_id/recipient_id since they can reference either clients or coaches
-- Instead, we'll create a more flexible approach

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id, created_at);

-- Create a function to get user info from either clients or coaches table
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT
) AS $$
BEGIN
  -- Try clients table first
  RETURN QUERY
  SELECT c.id, c.first_name, c.last_name, c.email, 'client'::TEXT as role
  FROM public.clients c
  WHERE c.id = user_id;
  
  -- If no client found, try coaches table
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT co.id, co.first_name, co.last_name, co.email, 'coach'::TEXT as role
    FROM public.coaches co
    WHERE co.id = user_id;
  END IF;
  
  -- If still not found, try users table (for admin/staff)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT u.id, u.first_name, u.last_name, u.email, u.role
    FROM public.users u
    WHERE u.id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view for messages with user information
CREATE OR REPLACE VIEW public.messages_with_users AS
SELECT 
  m.*,
  sender_info.first_name as sender_first_name,
  sender_info.last_name as sender_last_name,
  sender_info.email as sender_email,
  sender_info.role as sender_role,
  recipient_info.first_name as recipient_first_name,
  recipient_info.last_name as recipient_last_name,
  recipient_info.email as recipient_email,
  recipient_info.role as recipient_role
FROM public.messages m
LEFT JOIN public.get_user_info(m.sender_id) sender_info ON true
LEFT JOIN public.get_user_info(m.recipient_id) recipient_info ON true;

-- Grant permissions
GRANT SELECT ON public.messages_with_users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info(UUID) TO anon, authenticated;