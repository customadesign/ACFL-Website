'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import MessagesSkeleton from '@/components/MessagesSkeleton'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { User, Paperclip, Trash2, Download, X, MoreVertical, EyeOff, ArrowLeft, Send, Search, Filter, MessageCircle } from 'lucide-react'
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

function MessagesContent() {
	const API_URL = getApiUrl()
	const { user, logout } = useAuth()
	const searchParams = useSearchParams()
	const [conversations, setConversations] = useState<Conversation[]>([])
	const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
	const [activePartnerId, setActivePartnerId] = useState<string | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [loading, setLoading] = useState(true)
	const [initialLoad, setInitialLoad] = useState(true)
	const [sending, setSending] = useState(false)
	const [text, setText] = useState('')

	// Filter states
	const [searchTerm, setSearchTerm] = useState('')
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)
	const [showMobileChat, setShowMobileChat] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
const scrollerRef = useRef<HTMLDivElement>(null)

	const loadConversations = async () => {
		const res = await fetch(`${API_URL}/api/client/conversations`, {
			headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
		})
		const data = await res.json()
		if (data.success) {
			setConversations(data.data)
			if (!activePartnerId && data.data.length > 0) setActivePartnerId(data.data[0].partnerId)
			if (initialLoad) {
				setInitialLoad(false)
			}
		}
	}

	const loadMessages = async (partnerId: string) => {
		const params = new URLSearchParams({ conversation_with: partnerId })
		const res = await fetch(`${API_URL}/api/client/messages?${params.toString()}`, {
			headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
		})
		const data = await res.json()
		if (data.success) {
			setMessages(data.data)
			// Mark any unread incoming messages as read
			const unread = (data.data as Message[]).filter(m => m.recipient_id === (user?.id || '') && !m.read_at)
			if (unread.length > 0) {
				await Promise.all(
					unread.map(m => fetch(`${API_URL}/api/client/messages/${m.id}/read`, {
						method: 'PUT',
						headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
					}))
				)
				// Refresh conversations to drop unread badges
				loadConversations()
			}
		}
	}

	// Function to initiate conversation with a specific coach
	const initiateConversationWith = async (coachId: string, coachName?: string) => {
		try {
			// First, check if conversation already exists
			const existingConversation = conversations.find(c => c.partnerId === coachId)
			if (existingConversation) {
				setActivePartnerId(coachId)
				return
			}

			// Create placeholder conversation with provided name immediately
			if (coachName) {
				const placeholderConversation: Conversation = {
					partnerId: coachId,
					partnerName: coachName,
					lastBody: '',
					lastAt: new Date().toISOString(),
					unreadCount: 0,
					totalMessages: 0
				}
				
				// Add to conversations list if not already there
				setConversations(prev => {
					const exists = prev.find(c => c.partnerId === coachId)
					if (!exists) {
						return [placeholderConversation, ...prev]
					}
					return prev
				})
			}
			
			setActivePartnerId(coachId)
			setMessages([])

			// The conversation will be created in the backend when the first message is sent
			// For now, the placeholder conversation allows immediate messaging
			
			// Also reload conversations to get any existing ones
			await loadConversations()
			
		} catch (error) {
			console.error('Error initiating conversation:', error)
		}
	}

	useEffect(() => {
		;(async () => {
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

	// Handle conversation_with URL parameter
	useEffect(() => {
		const conversationWith = searchParams.get('conversation_with')
		const partnerName = searchParams.get('partner_name')
		if (conversationWith && !loading) {
			initiateConversationWith(conversationWith, partnerName ? decodeURIComponent(partnerName) : undefined)
		}
	}, [searchParams, loading])

	// Filter conversations
	useMemo(() => {
		let filtered = conversations

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(c =>
				c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				c.lastBody.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		// Apply unread filter
		if (showUnreadOnly) {
			filtered = filtered.filter(c => c.unreadCount > 0)
		}

		setFilteredConversations(filtered)
	}, [conversations, searchTerm, showUnreadOnly])

	// Refresh when window regains focus
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

    socket.on('connect', () => {
      // Connected
    })

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

    // Removed conversation:deleted listener - conversations are now soft-deleted per-user
    // The conversation list will be filtered server-side to exclude hidden conversations

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

	useEffect(() => {
		scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' })
	}, [messages])

	const activePartner = useMemo(() => {
		if (!activePartnerId) return null
		const found = conversations.find(c => c.partnerId === activePartnerId)
		if (found) return found
		
		// If no conversation found but we have activePartnerId, create a temporary display name
		return {
			partnerId: activePartnerId,
			partnerName: 'Loading...',
			lastBody: '',
			lastAt: new Date().toISOString(),
			unreadCount: 0,
			totalMessages: 0
		}
	}, [conversations, activePartnerId])

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

		const response = await fetch(`${API_URL}/api/client/upload-attachment`, {
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
			const response = await fetch(`${API_URL}/api/client/conversations/${partnerId}`, {
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
			const response = await fetch(`${API_URL}/api/client/messages/${messageId}/everyone`, {
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
			const response = await fetch(`${API_URL}/api/client/messages/${messageId}/hide`, {
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

			// Refresh conversations after sending to ensure conversation appears
			setTimeout(() => {
				loadConversations()
			}, 1000)
		} finally {
			setSending(false)
		}
	}


	return (
		<div className="flex flex-col h-screen sm:h-auto w-full overflow-x-hidden">
			{/* Page Header - Hidden on mobile when in chat view */}
			<div className={`mb-4 sm:mb-8 px-4 pt-4 sm:px-0 sm:pt-0 ${showMobileChat ? 'hidden sm:block' : ''}`}>
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">My Messages</h1>
				<p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">Send and receive messages with your coach</p>
			</div>

			{/* Filters and Search */}
			<div className={`mb-4 px-4 sm:px-0 ${showMobileChat ? 'hidden sm:block' : ''}`}>
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
					{/* Search */}
					<div className="relative flex-1 min-w-0">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							placeholder="Search conversations..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 dark:text-white w-full"
						/>
					</div>

					{/* Unread Filter */}
					<Button
						variant={showUnreadOnly ? "default" : "outline"}
						onClick={() => setShowUnreadOnly(!showUnreadOnly)}
						className={`flex items-center gap-2 flex-shrink-0 ${
							showUnreadOnly
								? 'dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700'
								: 'dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
						}`}
					>
						<MessageCircle className="w-4 h-4" />
						Unread Only
					</Button>
				</div>
			</div>

			{/* Main Content */}
			{initialLoad ? (
				<MessagesSkeleton />
			) : (
			<div className="flex-1 flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4 overflow-hidden px-4 sm:px-0">
					{/* Conversations List - Mobile: Full screen, Desktop: 1/3 width */}
					<div className={`${showMobileChat ? 'hidden sm:block' : 'flex-1 sm:flex-none'} sm:border sm:dark:border-gray-700 sm:rounded-lg bg-white dark:bg-gray-800 overflow-hidden flex flex-col sm:h-[500px] w-full max-w-full`}>
						<div className="p-3 sm:border-b sm:dark:border-gray-700 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
							<span>Conversations ({filteredConversations.length})</span>
							<MessageCircle className="w-4 h-4 text-gray-500" />
						</div>
						<div className="flex-1 overflow-y-auto overflow-x-hidden">
							{filteredConversations.map(c => (
								<div key={c.partnerId} className="relative group">
									<button
										onClick={() => {
											setActivePartnerId(c.partnerId)
											setShowMobileChat(true)
										}}
										className={`w-full text-left px-4 py-4 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between touch-manipulation ${activePartnerId === c.partnerId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
									>
										<div className="min-w-0 flex-1 overflow-hidden pr-2">
											<div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{c.partnerName}</div>
											<div className="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastBody || 'No messages yet'}</div>
										</div>
										{c.unreadCount > 0 && (
											<span className="ml-2 flex-shrink-0 inline-flex items-center justify-center text-xs bg-blue-600 text-white rounded-full h-5 w-5 min-w-[20px]">{c.unreadCount}</span>
										)}
									</button>
									<button
										onClick={(e) => {
											e.stopPropagation()
											deleteConversation(c.partnerId)
										}}
										className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 sm:p-1 text-red-500 hover:text-red-700 touch-manipulation"
										title="Delete conversation"
									>
										<Trash2 size={18} className="sm:w-4 sm:h-4" />
									</button>
								</div>
							))}
							{filteredConversations.length === 0 && (
								<div className="p-8 text-center text-gray-500 dark:text-gray-400">
									<MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
									<p>No conversations found</p>
									{(searchTerm || showUnreadOnly) && (
										<p className="text-sm mt-1">Try adjusting your filters</p>
									)}
								</div>
							)}
						</div>
					</div>

				{/* Chat Area - Mobile: Full screen when active, Desktop: 2/3 width */}
				<div className={`${showMobileChat ? 'fixed inset-0 z-50 sm:relative sm:inset-auto' : 'hidden sm:flex'} md:col-span-2 sm:border sm:dark:border-gray-700 sm:rounded-lg bg-white dark:bg-gray-800 flex flex-col overflow-hidden w-full max-w-full`}>
					<div className="p-3 sm:border-b sm:dark:border-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
						{/* Back button for mobile */}
						<button
							onClick={() => setShowMobileChat(false)}
							className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full touch-manipulation flex-shrink-0"
						>
							<ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
						</button>
						<div className="font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">{activePartner?.partnerName || 'Select a conversation'}</div>
					</div>
						<div ref={scrollerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-2 bg-gray-50 dark:bg-gray-900 min-h-0">
						{!activePartnerId && (
							<div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
								<div className="text-center px-4">
									<MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
									<p className="text-lg font-medium mb-2">Select a conversation</p>
									<p className="text-sm">Choose a conversation from the list to start messaging</p>
								</div>
							</div>
						)}
						{activePartnerId && messages.map(m => {
								const isMine = m.sender_id === (user?.id || '')
								const hasAttachment = m.attachment_url && m.attachment_name && !m.deleted_for_everyone
								const isDeleted = m.deleted_for_everyone
								return (
									<div key={m.id} className={`max-w-[85%] sm:max-w-[75%] ${isMine ? 'ml-auto' : ''} group relative`}>
										<div className={`px-3 py-2 rounded-lg text-sm shadow-sm break-words ${
											isDeleted
												? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic'
												: isMine
													? 'bg-blue-600 text-white'
													: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
										}`}>
											{m.body && <div className="break-words overflow-wrap-anywhere">{m.body}</div>}
											{hasAttachment && (
												<div className={`mt-2 p-2 rounded border ${isMine ? 'border-blue-400 bg-blue-500' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600'}`}>
													<div className="flex items-center gap-2 min-w-0">
														<Paperclip size={16} className="flex-shrink-0" />
														<span className="truncate flex-1 min-w-0">{m.attachment_name}</span>
														<a
															href={m.attachment_url || '#'}
															download={m.attachment_name || undefined}
															className={`p-1 hover:opacity-80 flex-shrink-0 ${isMine ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}
															title="Download"
															target="_blank"
															rel="noopener noreferrer"
														>
															<Download size={14} />
														</a>
													</div>
													{m.attachment_size && (
														<div className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
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
														className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
													>
														<MoreVertical size={14} />
													</button>
													<div className="hidden absolute right-0 top-6 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
														{isMine && (
															<button
																onClick={() => deleteMessageForEveryone(m.id)}
																className="w-full text-left px-3 py-1 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
															>
																<Trash2 size={12} />
																Delete for everyone
															</button>
														)}
														<button
															onClick={() => hideMessageForMe(m.id)}
															className="w-full text-left px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
														>
															<EyeOff size={12} />
															Delete for me
														</button>
													</div>
												</div>
											</div>
										)}
										
									<div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
										<span>{new Date(m.created_at).toLocaleString()}</span>
										{isMine && m.read_at && (
											<span className="text-blue-600">Seen</span>
										)}
									</div>
									</div>
								)
							})}
						</div>
						<div className="p-3 sm:p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
							{selectedFile && (
								<div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between min-w-0">
									<div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
										<Paperclip size={16} className="flex-shrink-0" />
										<span className="text-sm text-gray-900 dark:text-gray-100 truncate">{selectedFile.name}</span>
										<span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
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
										className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
									>
										<X size={16} />
									</button>
								</div>
							)}
							<div className="flex gap-2 items-end min-w-0">
								<input
									ref={fileInputRef}
									type="file"
									onChange={handleFileSelect}
									className="hidden"
									accept="image/*,application/pdf,.doc,.docx,.txt,.csv,audio/*,video/*,.zip"
								/>
								<button
									onClick={() => fileInputRef.current?.click()}
									className="p-3 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0"
									title={activePartnerId ? "Attach file" : "Select a conversation first"}
									disabled={!activePartnerId}
								>
									<Paperclip size={20} />
								</button>
								<Input
									value={text}
									onChange={e => setText(e.target.value)}
									placeholder={activePartnerId ? "Type a message..." : "Select a conversation to start messaging"}
									className="flex-1 min-w-0 dark:text-white dark:placeholder-gray-400 text-base sm:text-sm py-3 sm:py-2"
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
									className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white px-6 sm:px-4 py-3 sm:py-2 touch-manipulation flex-shrink-0"
								>
									<Send className="w-5 h-5 sm:hidden" />
									<span className="hidden sm:inline">{uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}</span>
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
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


