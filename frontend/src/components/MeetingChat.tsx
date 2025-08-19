'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  MessageSquare, 
  Send, 
  X, 
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { dbHelpers, supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/api'
import { io } from 'socket.io-client'

interface MeetingChatProps {
  meetingId: string
  participantName: string
  isVisible: boolean
  onToggle: () => void
}

interface ChatMessage {
  id: string
  meeting_id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
  expires_at: string
}

export default function MeetingChat({ 
  meetingId, 
  participantName, 
  isVisible, 
  onToggle 
}: MeetingChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isScrolledUp, setIsScrolledUp] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<ReturnType<typeof io> | null>(null)
  
  const API_URL = getApiUrl()

  // Load existing messages (if Supabase is configured for persistence)
  useEffect(() => {
    if (meetingId && isSupabaseConfigured) {
      loadMessages()
    }
  }, [meetingId])

  // Enhanced Supabase subscription for real-time chat
  useEffect(() => {
    if (!meetingId || !isSupabaseConfigured) return

    setIsConnected(false)

    const channel = dbHelpers.subscribeMeetingChat(meetingId, (payload) => {
      setIsConnected(true) // Connected when we start receiving updates
      
      if (payload.eventType === 'INSERT') {
        const newMsg = payload.new as ChatMessage
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        
        // If chat is not visible and message is from another user, increment unread count
        if (!isVisible && newMsg.sender_id !== user?.id) {
          setUnreadCount(prev => prev + 1)
        }
      }
    })

    // Set connected status
    setTimeout(() => setIsConnected(true), 1000)

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
      setIsConnected(false)
    }
  }, [meetingId, isVisible, user?.id])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !isScrolledUp) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Reset unread count when chat becomes visible
  useEffect(() => {
    if (isVisible) {
      setUnreadCount(0)
    }
  }, [isVisible])

  // Handle scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsScrolledUp(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const loadMessages = async () => {
    try {
      if (!isSupabaseConfigured) return
      const data = await dbHelpers.getMeetingChatMessages(meetingId)
      setMessages(data || [])
    } catch (error) {
      console.error('Failed to load meeting chat messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !user?.id || !isSupabaseConfigured) return

    setSending(true)
    try {
      // Send message via Supabase - this will trigger the real-time subscription
      await dbHelpers.sendMeetingChatMessage(
        meetingId,
        user.id,
        participantName,
        newMessage.trim()
      )
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send meeting chat message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsScrolledUp(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isMyMessage = (senderId: string) => senderId === user?.id

  // Component works with or without Supabase (WebSocket provides real-time, Supabase provides persistence)
  // If Supabase is not configured, messages will be temporary (lost on refresh)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={onToggle}
        className="rounded-full h-12 w-12 p-0 mb-2 shadow-lg relative"
        variant={isVisible ? "default" : "outline"}
      >
        <MessageSquare size={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>

      {/* Chat Panel */}
      {isVisible && (
        <Card className="w-80 h-96 flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-600" />
              <h3 className="text-sm font-medium">Meeting Chat</h3>
              {/* Connection status indicator */}
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} title={isConnected ? 'Connected' : 'Disconnected'} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              <X size={14} />
            </Button>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50"
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    isMyMessage(message.sender_id) 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-900 border'
                  } rounded-lg px-3 py-2 shadow-sm`}>
                    {!isMyMessage(message.sender_id) && (
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {message.sender_name}
                      </div>
                    )}
                    <div className="text-sm">{message.message}</div>
                    <div className={`text-xs mt-1 ${
                      isMyMessage(message.sender_id) ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {isScrolledUp && (
            <div className="absolute bottom-16 right-6">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full h-8 w-8 p-0 shadow-lg"
                onClick={scrollToBottom}
              >
                <ChevronDown size={14} />
              </Button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 text-sm"
                disabled={sending}
                maxLength={500}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="px-3"
              >
                <Send size={14} />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {isSupabaseConfigured 
                ? "Messages auto-delete after 24 hours" 
                : "Messages are temporary for this session"
              }
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}