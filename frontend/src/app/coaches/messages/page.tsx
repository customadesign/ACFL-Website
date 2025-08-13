'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import CoachPageWrapper from '@/components/CoachPageWrapper'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import supabase, { isSupabaseConfigured } from '@/lib/supabase'

type Conversation = {
  partnerId: string
  partnerName: string
  lastBody: string
  lastAt: string
  unreadCount: number
  totalMessages: number
}

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  created_at: string
  read_at?: string | null
}

export default function CoachMessagesPage() {
  const API_URL = getApiUrl()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const scrollerRef = useRef<HTMLDivElement>(null)

  const loadConversations = async () => {
    const res = await fetch(`${API_URL}/api/coach/conversations`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    if (data.success) {
      setConversations(data.data)
      if (!activePartnerId && data.data.length > 0) setActivePartnerId(data.data[0].partnerId)
    }
  }

  const loadMessages = async (partnerId: string) => {
    const params = new URLSearchParams({ conversation_with: partnerId })
    const res = await fetch(`${API_URL}/api/coach/messages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    if (data.success) {
      setMessages(data.data)
      // Mark any unread incoming messages as read
      const unread = (data.data as Message[]).filter(m => m.recipient_id === (user?.id || '') && !m.read_at)
      if (unread.length > 0) {
        await Promise.all(
          unread.map(m => fetch(`${API_URL}/api/coach/messages/${m.id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }))
        )
      }
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      await loadConversations()
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activePartnerId) {
      loadMessages(activePartnerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartnerId])

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])


  // Refresh when tab gains focus
  useEffect(() => {
    const onFocus = () => {
      loadConversations()
      if (activePartnerId) loadMessages(activePartnerId)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [activePartnerId])

  // Supabase Realtime: subscribe to messages for this coach
  useEffect(() => {
    if (!user?.id) return

    const handleIncoming = async (payload: any) => {
      const msg = JSON.parse(JSON.stringify(payload.new)) as Message
      const partnerId = activePartnerId
      const involvesActive = partnerId && (msg.sender_id === partnerId || msg.recipient_id === partnerId)
      if (involvesActive) {
        await loadMessages(partnerId)
        if (msg.recipient_id === user.id && !msg.read_at) {
          await fetch(`${API_URL}/api/coach/messages/${msg.id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        }
      } else {
        loadConversations()
      }
    }

    if (!isSupabaseConfigured || !supabase) return
    const channel = supabase
      .channel(`coach-messages-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, handleIncoming)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, handleIncoming)
      // Seen updates (read_at set)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, (payload: any) => {
        const updated = JSON.parse(JSON.stringify(payload.new)) as Message
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m))
      })
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activePartnerId])

  const activePartner = useMemo(
    () => conversations.find(c => c.partnerId === activePartnerId),
    [conversations, activePartnerId]
  )

  const handleSend = async () => {
    if (!activePartnerId || !text.trim()) return
    try {
      setSending(true)
      const res = await fetch(`${API_URL}/api/coach/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipient_id: activePartnerId, body: text.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setText('')
        await loadMessages(activePartnerId)
        await loadConversations()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <CoachPageWrapper title="Messages" description="Chat with your clients">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg bg-white overflow-hidden h-[70vh] flex flex-col">
          <div className="p-3 border-b font-semibold">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(c => (
              <button
                key={c.partnerId}
                onClick={() => setActivePartnerId(c.partnerId)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${activePartnerId === c.partnerId ? 'bg-blue-50' : ''}`}
              >
                <div>
                  <div className="font-medium">{c.partnerName}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{c.lastBody || 'No messages yet'}</div>
                </div>
                {c.unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center text-xs bg-blue-600 text-white rounded-full h-5 w-5">{c.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 border rounded-lg bg-white flex flex-col overflow-hidden h-[70vh]">
          <div className="p-3 border-b">
            <div className="font-semibold">{activePartner?.partnerName || 'Select a conversation'}</div>
          </div>
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {messages.map(m => {
              const isMine = m.sender_id === (user?.id || '')
              return (
                <div key={m.id} className={`max-w-[75%] ${isMine ? 'ml-auto' : ''}`}>
                  <div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}>{m.body}</div>
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                    {isMine && m.read_at && (
                      <span className="text-blue-600">Seen</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-3 border-t flex gap-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button onClick={handleSend} disabled={sending || !text.trim()} className="bg-blue-600 hover:bg-blue-700">Send</Button>
          </div>
        </div>
      </div>
    </CoachPageWrapper>
  )
}


