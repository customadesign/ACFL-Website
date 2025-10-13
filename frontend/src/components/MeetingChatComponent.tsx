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
import { usePubSub } from '@videosdk.live/react-sdk'

interface MeetingChatProps {
  meetingId: string
  participantName: string
  isVisible: boolean
  onToggle: () => void
  isScreenSharing?: boolean
  isEmbedded?: boolean  // New prop for embedded sidebar mode
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

export default function MeetingChatComponent({
  meetingId,
  participantName,
  isVisible,
  onToggle,
  isScreenSharing = false,
  isEmbedded = false
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

  // VideoSDK PubSub for real-time chat
  const { publish, messages: pubSubMessages } = usePubSub('CHAT', {
    onMessageReceived: (data: any) => {
      console.log('Received PubSub message:', data)

      // VideoSDK sends the message with payload structure
      // data.message contains the actual message we sent
      // data.senderId contains who sent it
      // data.senderName contains the sender's display name

      let messageContent = ''
      let senderId = ''
      let senderName = ''

      // If data.message exists, it's the actual payload we sent
      if (data.message) {
        // Parse our custom payload from data.message
        if (typeof data.message === 'string') {
          try {
            const parsed = JSON.parse(data.message)
            messageContent = parsed.message || ''
            senderId = parsed.senderId || data.senderId || 'unknown'
            senderName = parsed.senderName || data.senderName || 'Unknown'
          } catch (e) {
            // If parsing fails, treat it as plain text
            messageContent = data.message
            senderId = data.senderId || 'unknown'
            senderName = data.senderName || 'Unknown'
          }
        } else {
          messageContent = data.message.message || data.message
          senderId = data.message.senderId || data.senderId || 'unknown'
          senderName = data.message.senderName || data.senderName || 'Unknown'
        }
      } else {
        // Fallback for different message structure
        messageContent = data.text || data.content || ''
        senderId = data.senderId || 'unknown'
        senderName = data.senderName || 'Unknown'
      }

      if (!messageContent) {
        console.warn('Received empty message:', data)
        return
      }

      // Handle incoming message from VideoSDK PubSub
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meeting_id: meetingId,
        sender_id: senderId,
        sender_name: senderName,
        message: messageContent,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      // Add message to state, avoiding duplicates
      const currentUserId = user?.id || 'guest'

      setMessages(prev => {
        // Skip if we just sent this exact message (it's already added locally)
        if (senderId === currentUserId && prev.find(m =>
          m.message === messageContent &&
          m.sender_id === currentUserId &&
          Math.abs(new Date(m.created_at).getTime() - Date.now()) < 1000
        )) {
          return prev
        }

        // Avoid any other duplicates
        if (prev.find(m =>
          m.message === messageContent &&
          m.sender_name === senderName &&
          Math.abs(new Date(m.created_at).getTime() - new Date(chatMessage.created_at).getTime()) < 2000
        )) {
          return prev
        }

        return [...prev, chatMessage]
      })

      // If message is from another user, play notification sound and increment unread count
      if (senderId !== currentUserId) {
        // Play notification sound for new messages from others
        try {
          const audio = new Audio('/sounds/message.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {
            // Fallback to Web Audio API if file doesn't exist
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();

              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);

              oscillator.frequency.value = 800;
              oscillator.type = 'sine';

              gainNode.gain.setValueAtTime(0, audioContext.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.05);
              gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.2);
            } catch (error) {
              console.log('Could not play chat notification sound');
            }
          });
        } catch (error) {
          console.log('Could not play chat notification sound');
        }

        if (!isVisible) {
          setUnreadCount(prev => prev + 1)
        }
      }

      setIsConnected(true)
    }
  })

  // Load existing messages (if Supabase is configured for persistence)
  useEffect(() => {
    if (meetingId && isSupabaseConfigured) {
      loadMessages()
    }
  }, [meetingId])

  // VideoSDK PubSub connection status
  useEffect(() => {
    // Set connected status based on VideoSDK PubSub
    if (meetingId) {
      // VideoSDK PubSub connects automatically when the meeting is active
      setTimeout(() => setIsConnected(true), 500)
    }

    return () => {
      setIsConnected(false)
    }
  }, [meetingId])

  // Optional Supabase subscription for message persistence
  useEffect(() => {
    if (!meetingId || !isSupabaseConfigured) return

    const channel = dbHelpers.subscribeMeetingChat(meetingId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMsg = payload.new as ChatMessage

        // Only add from Supabase if we haven't already received it via PubSub
        setMessages(prev => {
          if (prev.find(m =>
            m.message === newMsg.message &&
            m.sender_name === newMsg.sender_name &&
            Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000
          )) return prev
          return [...prev, newMsg]
        })
      }
    })

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [meetingId])

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
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const messagePayload = {
        senderId: user?.id || 'guest',
        senderName: participantName,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      }

      // Send via VideoSDK PubSub for instant real-time delivery
      console.log('Sending message via PubSub:', messagePayload)
      publish(JSON.stringify(messagePayload), { persist: false })

      // Also save to Supabase if configured for persistence
      if (user?.id && isSupabaseConfigured) {
        dbHelpers.sendMeetingChatMessage(
          meetingId,
          user.id,
          participantName,
          newMessage.trim()
        ).catch(error => {
          console.error('Failed to persist message:', error)
        })
      }

      // Add message to local state immediately for sender
      const localMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meeting_id: meetingId,
        sender_id: user?.id || 'guest',
        sender_name: participantName,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      setMessages(prev => [...prev, localMessage])
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

  const isMyMessage = (senderId: string) => {
    if (!user?.id) return senderId === 'guest' && senderId === (user?.id || 'guest')
    return senderId === user?.id
  }

  // Component uses VideoSDK PubSub for instant real-time messaging
  // Supabase provides optional persistence when configured

  // Render embedded sidebar version
  if (isEmbedded && isVisible) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-800">Chat</h3>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} title={isConnected ? 'Connected' : 'Disconnected'} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50"
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-12">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-400" />
              <p>No messages yet.</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isMyMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${
                  isMyMessage(message.sender_id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border shadow-sm'
                } rounded-lg px-3 py-2`}>
                  {!isMyMessage(message.sender_id) && (
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      {message.sender_name}
                    </div>
                  )}
                  <div className="text-sm break-words leading-relaxed">{message.message}</div>
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
          <div className="absolute bottom-24 right-6">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full h-10 w-10 p-0 shadow-lg bg-white border"
              onClick={scrollToBottom}
            >
              <ChevronDown size={16} />
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 text-sm border-gray-300 focus:border-blue-500"
              disabled={sending}
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="px-4 bg-blue-600 hover:bg-blue-700"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {isConnected
              ? "Connected"
              : "Connecting..."
            }
          </div>
        </div>
      </div>
    )
  }

  // Render floating/overlay version for mobile and non-embedded modes
  return (
    <div className={`fixed ${
      isEmbedded ? 'hidden' :
      isScreenSharing ? 'bottom-20 md:bottom-20' : 'bottom-20'
    } right-2 sm:right-4 z-[20001]`}>
      {/* Chat Toggle Button - Only show when not embedded */}
      {!isEmbedded && (
        <Button
          onClick={onToggle}
          className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 mb-2 shadow-lg relative"
          variant={isVisible ? "default" : "outline"}
        >
          <MessageSquare size={16} className="sm:size-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </Button>
      )}

      {/* Chat Panel */}
      {isVisible && !isEmbedded && (
        <>
          {/* Mobile: Full screen overlay */}
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[20000] sm:hidden pb-safe">
            <Card className="w-full h-[80vh] max-h-[80vh] flex flex-col shadow-xl rounded-t-xl rounded-b-none border-t">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Meeting Chat</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} title={isConnected ? 'Connected' : 'Disconnected'} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-8 w-8 p-0"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 p-4 pb-6 overflow-y-auto space-y-3 bg-gray-50"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-12">
                    <MessageSquare size={32} className="mx-auto mb-3 text-gray-400" />
                    <p>No messages yet.</p>
                    <p className="text-xs mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isMyMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${
                        isMyMessage(message.sender_id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border shadow-sm'
                      } rounded-lg px-3 py-2`}>
                        {!isMyMessage(message.sender_id) && (
                          <div className="text-xs font-medium text-blue-600 mb-1">
                            {message.sender_name}
                          </div>
                        )}
                        <div className="text-sm break-words leading-relaxed">{message.message}</div>
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
                <div className="absolute bottom-28 right-6">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full h-10 w-10 p-0 shadow-lg"
                    onClick={scrollToBottom}
                  >
                    <ChevronDown size={16} />
                  </Button>
                </div>
              )}

              {/* Input */}
              <div className="p-4 pb-6 border-t bg-white safe-bottom">
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
                    className="px-4"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {isConnected
                    ? "Real-time chat powered by VideoSDK"
                    : "Connecting to chat..."
                  }
                </div>
              </div>
            </Card>
          </div>

          {/* Desktop: Floating panel */}
          <Card className="hidden sm:flex w-80 h-96 flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-gray-600" />
                <h3 className="text-sm font-medium">Meeting Chat</h3>
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
                  <MessageSquare size={24} className="mx-auto mb-2 text-gray-400" />
                  <p>No messages yet.</p>
                  <p className="text-xs mt-1">Start the conversation!</p>
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
                        : 'bg-white text-gray-900 border shadow-sm'
                    } rounded-lg px-3 py-2`}>
                      {!isMyMessage(message.sender_id) && (
                        <div className="text-xs font-medium text-blue-600 mb-1">
                          {message.sender_name}
                        </div>
                      )}
                      <div className="text-sm break-words">{message.message}</div>
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
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={14} />}
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {isConnected
                  ? "Real-time chat powered by VideoSDK"
                  : "Connecting to chat..."
                }
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}