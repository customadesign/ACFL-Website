'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, User, Clock, Star, Search, Filter, RefreshCw } from "lucide-react"
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  session_id?: string
  subject: string
  content: string
  is_read: boolean
  message_type: string
  priority: string
  created_at: string
  sender: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
  receiver: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
}

interface Conversation {
  partnerId: string
  partner: {
    first_name: string
    last_name: string
    email: string
    role: string
  }
  lastMessage: Message
  unreadCount: number
  totalMessages: number
}

function MessagesContent() {
  const { user, logout, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [lastConversationsFetch, setLastConversationsFetch] = useState<number>(0)
  const [messagesCache, setMessagesCache] = useState<Record<string, { messages: Message[], timestamp: number }>>({})

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  
  // Cache duration: 1 minute for conversations, 30 seconds for messages
  const CONVERSATIONS_CACHE_DURATION = 1 * 60 * 1000
  const MESSAGES_CACHE_DURATION = 30 * 1000

  const loadConversations = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    
    // Check if we have cached data and it's still valid
    if (!forceRefresh && conversations.length > 0 && (now - lastConversationsFetch) < CONVERSATIONS_CACHE_DURATION) {
      return
    }

    // Don't start loading if already loading
    if (loading && !forceRefresh) {
      return
    }

    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/client/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setConversations(response.data.data)
        setLastConversationsFetch(now)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [lastConversationsFetch, API_URL])

  const loadMessages = useCallback(async (partnerId: string, forceRefresh = false) => {
    const now = Date.now()
    const cached = messagesCache[partnerId]
    
    // Check if we have cached messages and they're still valid
    if (!forceRefresh && cached && (now - cached.timestamp) < MESSAGES_CACHE_DURATION) {
      setMessages(cached.messages)
      setMessagesLoading(false)
      return
    }

    try {
      setMessagesLoading(true)
      const response = await axios.get(`${API_URL}/api/client/messages`, {
        params: { conversation_with: partnerId },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setMessages(response.data.data)
        // Update cache
        setMessagesCache(prev => ({
          ...prev,
          [partnerId]: { messages: response.data.data, timestamp: now }
        }))
        // Mark messages as read
        response.data.data.forEach((message: Message) => {
          if (message.receiver_id === user?.id && !message.is_read) {
            markAsRead(message.id)
          }
        })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setError('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }, [API_URL, user?.id])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation, loadMessages])

  const markAsRead = async (messageId: string) => {
    try {
      await axios.put(`${API_URL}/api/client/messages/${messageId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    try {
      setSendingMessage(true)
      const response = await axios.post(`${API_URL}/api/client/send-message`, {
        receiverId: selectedConversation,
        subject: 'Message',
        content: newMessage.trim(),
        messageType: 'general'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.data.success) {
        setNewMessage('')
        // Force refresh messages and conversations to update unread counts
        await loadMessages(selectedConversation, true)
        await loadConversations(true)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getSelectedPartner = () => {
    return conversations.find(c => c.partnerId === selectedConversation)?.partner
  }

  const getMessageSenderName = (message: Message) => {
    if (message.sender_id === user?.id) {
      return 'You'
    }
    
    // Try to get name from message sender data
    if (message.sender?.first_name && message.sender?.last_name) {
      return `${message.sender.first_name} ${message.sender.last_name}`
    }
    
    // Fallback to conversation partner name
    const partner = conversations.find(c => c.partnerId === message.sender_id)?.partner
    if (partner?.first_name && partner?.last_name) {
      return `${partner.first_name} ${partner.last_name}`
    }
    
    return 'Unknown User'
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
                alt="ACT Coaching For Life Logo"
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-semibold text-gray-900">ACT Coaching For Life</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>Welcome, {user?.firstName || 'Client'}</span>
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/dashboard">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Dashboard
              </button>
            </Link>
            <Link href="/search-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Search Coaches
              </button>
            </Link>
            <Link href="/saved-coaches">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Saved Coaches
              </button>
            </Link>
            <Link href="/appointments">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Appointments
              </button>
            </Link>
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm whitespace-nowrap">
              Messages
            </button>
            <Link href="/profile">
              <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm whitespace-nowrap">
                Profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Messages Interface */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                    <p className="text-sm text-gray-600">
                      {conversations.reduce((total, conv) => total + conv.unreadCount, 0)} unread messages
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadConversations(true)}
                    disabled={loading}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600">
                      Start messaging with your coaches from the appointments page.
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.partnerId}
                      onClick={() => setSelectedConversation(conversation.partnerId)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                        selectedConversation === conversation.partnerId
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-1">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <p className="text-sm font-medium text-gray-900">
                              {conversation.partner.first_name} {conversation.partner.last_name}
                            </p>
                            {conversation.partner.role === 'coach' && (
                              <Star className="w-3 h-3 text-yellow-400 ml-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                        <div className="ml-2 flex flex-col items-end">
                          <p className="text-xs text-gray-500 mb-1">
                            {formatDate(conversation.lastMessage.created_at)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages View */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Message Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {getSelectedPartner()?.first_name} {getSelectedPartner()?.last_name}
                      </h3>
                      {getSelectedPartner()?.role === 'coach' && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Coach
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600">No messages in this conversation yet.</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              message.sender_id === user?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-xs mb-1 opacity-75">
                              {getMessageSenderName(message)}
                            </p>
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-xs ${
                                message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatDate(message.created_at)}
                              </p>
                              {message.priority !== 'normal' && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  message.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  message.priority === 'urgent' ? 'bg-red-200 text-red-900' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {message.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send Message */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-3 items-end">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        rows={2}
                        maxLength={1000}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">Choose a conversation from the left to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      <MessagesContent />
    </ProtectedRoute>
  )
}