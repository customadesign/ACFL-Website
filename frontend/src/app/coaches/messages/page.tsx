'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import CoachPageWrapper from '@/components/CoachPageWrapper'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Paperclip, Trash2, Download, X, MoreVertical, EyeOff } from 'lucide-react'
import { io } from 'socket.io-client'

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
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
  attachment_type?: string | null
  deleted_for_everyone?: boolean
  deleted_at?: string | null
  hidden_for_users?: string[]
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Socket.IO Realtime
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  useEffect(() => {
    if (!user?.id) return
    const socket = io(API_URL, {
      transports: ['websocket'],
      auth: { token: `Bearer ${localStorage.getItem('token')}` }
    })
    socketRef.current = socket

    socket.on('message:new', async (msg: Message) => {
      const partnerId = activePartnerId
      const involvesActive = partnerId && (msg.sender_id === partnerId || msg.recipient_id === partnerId)
      if (involvesActive) {
        setMessages(prev => [...prev, msg])
        if (msg.recipient_id === (user?.id || '') && !msg.read_at) {
          socket.emit('message:read', { messageIds: [msg.id] })
        }
        loadConversations()
        setTimeout(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }), 0)
      } else {
        loadConversations()
      }
    })

    socket.on('message:read', ({ id, read_at }: { id: string; read_at: string }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read_at } as Message : m))
    })

    socket.on('conversation:deleted', ({ deletedBy, partnerId }: { deletedBy: string; partnerId: string }) => {
      // Remove the conversation from the list
      setConversations(prev => prev.filter(c => c.partnerId !== partnerId))
      
      // If the deleted conversation was active, clear it
      if (activePartnerId === partnerId) {
        setActivePartnerId(null)
        setMessages([])
      }
    })

    socket.on('message:deleted_everyone', ({ messageId, deletedBy }: { messageId: string; deletedBy: string }) => {
      // Update the message to show it was deleted
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, body: 'This message was deleted', deleted_for_everyone: true, deleted_at: new Date().toISOString() }
          : m
      ))
    })

    return () => {
      socketRef.current?.close()
      socketRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activePartnerId])

  const activePartner = useMemo(
    () => conversations.find(c => c.partnerId === activePartnerId),
    [conversations, activePartnerId]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('attachment', file)

    const response = await fetch(`${API_URL}/api/coach/upload-attachment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || 'Upload failed')
    }

    return result.data
  }

  const deleteConversation = async (partnerId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/coach/conversations/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()
      if (result.success) {
        // Remove conversation from list and clear messages if it was active
        setConversations(prev => prev.filter(c => c.partnerId !== partnerId))
        if (activePartnerId === partnerId) {
          setActivePartnerId(null)
          setMessages([])
        }
      } else {
        alert(result.message || 'Failed to delete conversation')
      }
    } catch (error) {
      console.error('Delete conversation error:', error)
      alert('Failed to delete conversation')
    }
  }

  const deleteMessageForEveryone = async (messageId: string) => {
    if (!confirm('Delete this message for everyone? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/coach/messages/${messageId}/everyone`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()
      if (!result.success) {
        alert(result.message || 'Failed to delete message')
      }
    } catch (error) {
      console.error('Delete message error:', error)
      alert('Failed to delete message')
    }
  }

  const hideMessageForMe = async (messageId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/coach/messages/${messageId}/hide`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()
      if (result.success) {
        // Remove message from local state
        setMessages(prev => prev.filter(m => m.id !== messageId))
      } else {
        alert(result.message || 'Failed to hide message')
      }
    } catch (error) {
      console.error('Hide message error:', error)
      alert('Failed to hide message')
    }
  }

  const handleSend = async () => {
    if (!activePartnerId || (!text.trim() && !selectedFile)) return
    
    try {
      setSending(true)
      let attachment = null

      // Upload file if selected
      if (selectedFile) {
        setUploading(true)
        try {
          attachment = await uploadFile(selectedFile)
        } catch (error) {
          alert('Failed to upload file: ' + (error as Error).message)
          return
        } finally {
          setUploading(false)
        }
      }

      // Send message with or without attachment
      socketRef.current?.emit('message:send', { 
        recipientId: activePartnerId, 
        body: text.trim() || '',
        attachment
      })
      
      setText('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
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
              <div key={c.partnerId} className="relative group">
                <button
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
                <button
                  onClick={() => deleteConversation(c.partnerId)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500 hover:text-red-700"
                  title="Delete conversation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 border rounded-lg bg-white flex flex-col overflow-hidden h-[70vh]">
          <div className="p-3 border-b">
            <div className="font-semibold">{activePartner?.partnerName || 'Select a conversation'}</div>
          </div>
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {!activePartnerId && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
            {activePartnerId && messages.map(m => {
              const isMine = m.sender_id === (user?.id || '')
              const hasAttachment = m.attachment_url && m.attachment_name && !m.deleted_for_everyone
              const isDeleted = m.deleted_for_everyone
              return (
                <div key={m.id} className={`max-w-[75%] ${isMine ? 'ml-auto' : ''} group relative`}>
                  <div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${
                    isDeleted 
                      ? 'bg-gray-100 text-gray-500 italic' 
                      : isMine 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-900'
                  }`}>
                    {m.body && <div>{m.body}</div>}
                    {hasAttachment && (
                      <div className={`mt-2 p-2 rounded border ${isMine ? 'border-blue-400 bg-blue-500' : 'border-gray-300 bg-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} />
                          <span className="truncate">{m.attachment_name}</span>
                          <a
                            href={m.attachment_url}
                            download={m.attachment_name}
                            className={`p-1 hover:opacity-80 ${isMine ? 'text-blue-100' : 'text-gray-600'}`}
                            title="Download"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                        {m.attachment_size && (
                          <div className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                            {(m.attachment_size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Message options dropdown */}
                  {!isDeleted && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            const dropdown = e.currentTarget.nextElementSibling as HTMLElement
                            dropdown.classList.toggle('hidden')
                          }}
                          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical size={14} />
                        </button>
                        <div className="hidden absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          {isMine && (
                            <button
                              onClick={() => deleteMessageForEveryone(m.id)}
                              className="w-full text-left px-3 py-1 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={12} />
                              Delete for everyone
                            </button>
                          )}
                          <button
                            onClick={() => hideMessageForMe(m.id)}
                            className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                          >
                            <EyeOff size={12} />
                            Delete for me
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
          <div className="p-3 border-t">
            {selectedFile && (
              <div className="mb-2 p-2 bg-gray-100 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip size={16} />
                  <span className="text-sm">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt,.csv,audio/*,video/*,.zip"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title={activePartnerId ? "Attach file" : "Select a conversation first"}
                disabled={!activePartnerId}
              >
                <Paperclip size={20} />
              </button>
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={activePartnerId ? "Type a message..." : "Select a conversation to start messaging"}
                className="flex-1"
                disabled={!activePartnerId}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button 
                onClick={handleSend} 
                disabled={!activePartnerId || sending || uploading || (!text.trim() && !selectedFile)} 
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CoachPageWrapper>
  )
}


