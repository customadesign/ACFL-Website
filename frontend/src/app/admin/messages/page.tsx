
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MessagesSkeleton from '@/components/MessagesSkeleton'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { User, Paperclip, Trash2, Download, X, MoreVertical, EyeOff, ArrowLeft, Send, Search, Filter, Users, MessageCircle } from 'lucide-react'
import { io } from 'socket.io-client'

type Conversation = {
	partnerId: string
	partnerName: string
	partnerRole: 'client' | 'coach'
	partnerPhoto?: string | null
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
	sender_role?: 'client' | 'coach' | 'admin'
	recipient_role?: 'client' | 'coach' | 'admin'
}

function AdminMessagesContent() {
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
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)
	const [showMobileChat, setShowMobileChat] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'coach'>('all')
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const scrollerRef = useRef<HTMLDivElement>(null)

	const loadConversations = async (preserveManualConversations = false) => {
		try {
			const res = await fetch(`${API_URL}/api/admin/conversations`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
			})
			const data = await res.json()
			if (data.success) {
				if (preserveManualConversations) {
					// Merge backend conversations with existing manual ones
					setConversations(prev => {
						const backendConversations = data.data || []
						const manualConversations = prev.filter(c =>
							!backendConversations.some((bc: Conversation) => bc.partnerId === c.partnerId)
						)
						return [...manualConversations, ...backendConversations]
					})
				} else {
					setConversations(data.data)
				}
				if (!activePartnerId && data.data.length > 0) setActivePartnerId(data.data[0].partnerId)
				if (initialLoad) {
					setInitialLoad(false)
				}
			}
		} catch (error) {
			console.error('Error loading conversations:', error)
		}
	}

	const loadMessages = async (partnerId: string) => {
		try {
			const params = new URLSearchParams({ conversation_with: partnerId })
			const res = await fetch(`${API_URL}/api/admin/messages?${params.toString()}`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
			})
			const data = await res.json()
			if (data.success) {
				// Filter out messages that are hidden for this admin user
				const adminId = user?.id
				const filteredMessages = (data.data as Message[]).filter(m => {
					// Show message if it's not hidden for this admin
					return !adminId || !m.hidden_for_users || !m.hidden_for_users.includes(adminId)
				})
				
				setMessages(filteredMessages)
				console.log('Loaded messages:', filteredMessages.length, 'Total from backend:', data.data.length)
				
				// Mark any unread incoming messages as read
				const unread = filteredMessages.filter(m => m.recipient_id === adminId && !m.read_at)
				if (unread.length > 0) {
					await Promise.all(
						unread.map(m => fetch(`${API_URL}/api/admin/messages/${m.id}/read`, {
							method: 'PUT',
							headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
						}))
					)
					// Refresh conversations to drop unread badges
					loadConversations(true) // Preserve manual conversations
				}
			}
		} catch (error) {
			console.error('Error loading messages:', error)
		}
	}

	// Function to initiate conversation with a specific user
	const initiateConversationWith = async (userId: string, userName?: string, userRole?: 'client' | 'coach') => {
		try {
			console.log('Initiating conversation with:', { userId, userName, userRole })
			
			// First, check if conversation already exists in current state
			const existingConversation = conversations.find(c => c.partnerId === userId)
			if (existingConversation) {
				console.log('Conversation already exists in state, activating it')
				setActivePartnerId(userId)
				setShowMobileChat(true) // Show the chat on mobile
				return
			}

			// Set active partner immediately for better UX
			setActivePartnerId(userId)
			setShowMobileChat(true) // Show the chat on mobile
			setMessages([])

			// Check backend first to see if conversation already exists
			if (userName && userRole) {
				try {
					console.log('Checking if conversation exists in backend...')
					const response = await fetch(`${API_URL}/api/admin/conversations`, {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('token')}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							partnerId: userId,
							partnerRole: userRole
						})
					})

					if (!response.ok) {
						console.error('Backend conversation check failed:', response.status, response.statusText)
						throw new Error(`HTTP ${response.status}`)
					}

					const result = await response.json()
					console.log('Backend conversation result:', result)

					if (result.success) {
						// If conversation exists in backend, reload conversations to get it
						if (result.conversationExists) {
							console.log('Conversation exists in backend, reloading conversations...')
							await loadConversations(true) // Preserve manual conversations
							// After reloading, the conversation should be in the list
							console.log('Conversation exists in backend, should be loaded now')
							setActivePartnerId(userId)
							setShowMobileChat(true)
						} else {
							// Conversation doesn't exist, create it in state
							console.log('Conversation does not exist in backend, creating in state')
							createConversationInState(userId, userName, userRole)
						}
					}
				} catch (error) {
					console.error('Error checking conversation in backend:', error)
					// If backend check fails, create conversation in state anyway
					console.log('Backend check failed, creating conversation in state')
					createConversationInState(userId, userName, userRole)
				}
			}
			
		} catch (error) {
			console.error('Error initiating conversation:', error)
		}
	}

	// Helper function to create conversation in state
	const createConversationInState = (userId: string, userName: string, userRole: 'client' | 'coach') => {
		const newConversation: Conversation = {
			partnerId: userId,
			partnerName: userName,
			partnerRole: userRole,
			partnerPhoto: null,
			lastBody: '',
			lastAt: new Date().toISOString(),
			unreadCount: 0,
			totalMessages: 0
		}
		
		console.log('Adding new conversation to state:', newConversation)
		
		// Add to conversations list immediately and persistently
		setConversations(prev => {
			const exists = prev.find(c => c.partnerId === userId)
			if (!exists) {
				console.log('Adding conversation to list')
				return [newConversation, ...prev]
			}
			console.log('Conversation already exists in state')
			return prev
		})
	}

	// Filter conversations based on search and filters
	useEffect(() => {
		let filtered = conversations

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(c => 
				c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				c.lastBody.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		// Apply role filter
		if (roleFilter !== 'all') {
			filtered = filtered.filter(c => c.partnerRole === roleFilter)
		}

		// Apply unread filter
		if (showUnreadOnly) {
			filtered = filtered.filter(c => c.unreadCount > 0)
		}

		setFilteredConversations(filtered)
	}, [conversations, searchTerm, roleFilter, showUnreadOnly])

	useEffect(() => {
		;(async () => {
			setLoading(true)
			
			// Check if we have URL parameters for conversation initiation
			const conversationWith = searchParams.get('conversation_with')
			const partnerName = searchParams.get('partner_name')
			const partnerRole = searchParams.get('partner_role') as 'client' | 'coach'
			
			if (conversationWith && partnerName && partnerRole) {
				// If we have URL parameters, create the conversation first
				console.log('Creating conversation from URL params:', { conversationWith, partnerName, partnerRole })
				await initiateConversationWith(
					conversationWith,
					decodeURIComponent(partnerName),
					partnerRole
				)
				// Then load conversations with preservation
				await loadConversations(true)
				
				// Activate the conversation and show mobile chat
				setActivePartnerId(conversationWith)
				setShowMobileChat(true)
				console.log('Activated conversation for:', conversationWith)
			} else {
				// Normal load without URL parameters
				await loadConversations()
			}
			
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

	// Refresh when window regains focus
	useEffect(() => {
		const onFocus = () => {
			loadConversations(true) // Preserve manual conversations
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
				loadConversations(true) // Preserve manual conversations
				setTimeout(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }), 0)
			} else {
				loadConversations(true) // Preserve manual conversations
			}
		})

		socket.on('message:read', ({ id, read_at }: { id: string; read_at: string }) => {
			setMessages(prev => prev.map(m => m.id === id ? { ...m, read_at } as Message : m))
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
			partnerRole: 'client' as const,
			partnerPhoto: null,
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

		const response = await fetch(`${API_URL}/api/admin/upload-attachment`, {
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
			const response = await fetch(`${API_URL}/api/admin/conversations/${partnerId}`, {
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
			const response = await fetch(`${API_URL}/api/admin/messages/${messageId}/everyone`, {
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
			console.log('Hiding message:', messageId)
			
			const response = await fetch(`${API_URL}/api/admin/messages/${messageId}/hide`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			})

			console.log('Hide message response status:', response.status)
			
			if (!response.ok) {
				const errorText = await response.text()
				console.error('Hide message HTTP error:', response.status, errorText)
				alert(`Failed to hide message: ${response.status} ${errorText}`)
				return
			}

			const result = await response.json()
			console.log('Hide message result:', result)
			
			if (result.success) {
				// Remove message from local state immediately
				setMessages(prev => {
					const filtered = prev.filter(m => m.id !== messageId)
					console.log('Messages after hiding:', filtered.length)
					return filtered
				})
				// Also refresh conversations to update last message if needed
				loadConversations(true)
			} else {
				console.error('Hide message failed:', result)
				alert(result.error || result.message || 'Failed to hide message')
			}
		} catch (error) {
			console.error('Hide message error:', error)
			alert('Failed to hide message: ' + (error as Error).message)
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
				loadConversations(true) // Preserve manual conversations
			}, 1000)
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="flex flex-col h-screen sm:h-auto w-full">
			{/* Page Header - Hidden on mobile when in chat view */}
			<div className={`mb-4 sm:mb-8 px-4 pt-4 sm:px-0 sm:pt-0 ${showMobileChat ? 'hidden sm:block' : ''}`}>
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Admin Messages</h1>
				<p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">Monitor and manage all platform communications</p>
			</div>

			{/* Filters and Search */}
			<div className={`mb-4 px-4 sm:px-0 ${showMobileChat ? 'hidden sm:block' : ''}`}>
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
					{/* Search */}
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							placeholder="Search conversations..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 dark:text-white"
						/>
					</div>
					
					{/* Role Filter */}
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value as 'all' | 'client' | 'coach')}
						className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
					>
						<option value="all">All Users</option>
						<option value="client">Clients</option>
						<option value="coach">Coaches</option>
					</select>

					{/* Unread Filter */}
					<Button
						variant={showUnreadOnly ? "default" : "outline"}
						onClick={() => setShowUnreadOnly(!showUnreadOnly)}
						className={`flex items-center gap-2 ${
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
			<div className="flex-1 flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4 overflow-hidden">
					{/* Conversations List - Mobile: Full screen, Desktop: 1/3 width */}
					<div className={`${showMobileChat ? 'hidden sm:block' : 'flex-1 sm:flex-none'} sm:border sm:dark:border-gray-700 sm:rounded-lg bg-white dark:bg-gray-800 overflow-hidden flex flex-col sm:h-[500px]`}>
						<div className="p-3 sm:border-b sm:dark:border-gray-700 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
							<span>Conversations ({filteredConversations.length})</span>
							<Users className="w-4 h-4 text-gray-500" />
						</div>
						<div className="flex-1 overflow-y-auto">
							{filteredConversations.map(c => (
								<div key={c.partnerId} className="relative group">
									<button
										onClick={() => {
											setActivePartnerId(c.partnerId)
											setShowMobileChat(true)
										}}
										className={`w-full text-left px-4 py-4 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 touch-manipulation ${activePartnerId === c.partnerId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
									>
										{/* Profile Photo */}
										<div className="flex-shrink-0">
											{c.partnerPhoto ? (
												<img
													src={c.partnerPhoto}
													alt={c.partnerName}
													className="w-10 h-10 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
												/>
											) : (
												<div className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
													<User className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
												</div>
											)}
										</div>
										
										{/* Content */}
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2 mb-1">
												<div className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{c.partnerName}</div>
												<span className={`text-xs px-2 py-0.5 rounded-full ${
													c.partnerRole === 'client' 
														? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
														: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
												}`}>
													{c.partnerRole}
												</span>
											</div>
											<div className="text-xs sm:text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastBody || 'No messages yet'}</div>
										</div>
										
										{/* Unread Badge */}
										{c.unreadCount > 0 && (
											<span className="flex-shrink-0 inline-flex items-center justify-center text-xs bg-red-600 text-white rounded-full h-5 w-5">{c.unreadCount}</span>
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
									{(searchTerm || roleFilter !== 'all' || showUnreadOnly) && (
										<p className="text-sm mt-1">Try adjusting your filters</p>
									)}
								</div>
							)}
						</div>
					</div>

				{/* Chat Area - Mobile: Full screen when active, Desktop: 2/3 width */}
				<div className={`${showMobileChat ? 'fixed inset-0 z-50 sm:relative sm:inset-auto' : 'hidden sm:flex'} md:col-span-2 sm:border sm:dark:border-gray-700 sm:rounded-lg bg-white dark:bg-gray-800 flex flex-col overflow-hidden`}>
					<div className="p-3 sm:border-b sm:dark:border-gray-700 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
						{/* Back button for mobile */}
						<button
							onClick={() => setShowMobileChat(false)}
							className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full touch-manipulation"
						>
							<ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
						</button>
						<div className="flex items-center gap-2">
							<div className="font-semibold text-gray-900 dark:text-white">
								{activePartner?.partnerName || 'Select a conversation'}
							</div>
							{activePartner && (
								<span className={`text-xs px-2 py-0.5 rounded-full ${
									activePartner.partnerRole === 'client' 
										? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
										: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
								}`}>
									{activePartner.partnerRole}
								</span>
							)}
						</div>
					</div>
						<div ref={scrollerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-2 bg-gray-50 dark:bg-gray-900 min-h-0">
						{!activePartnerId && (
							<div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
								<div className="text-center">
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
									<div key={m.id} className={`max-w-[75%] ${isMine ? 'ml-auto' : ''} group relative w-fit`}>
										<div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${
											isDeleted 
												? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 italic' 
												: isMine 
													? 'bg-blue-600 text-white' 
													: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
										}`}>
											{m.body && <div>{m.body}</div>}
											{hasAttachment && (
												<div className={`mt-2 p-2 rounded border ${isMine ? 'border-blue-400 bg-blue-500' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600'}`}>
													<div className="flex items-center gap-2">
														<Paperclip size={16} />
														<span className="truncate">{m.attachment_name}</span>
														<a
															href={m.attachment_url || '#'}
															download={m.attachment_name || undefined}
															className={`p-1 hover:opacity-80 ${isMine ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}
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
														<button
															onClick={() => deleteMessageForEveryone(m.id)}
															className="w-full text-left px-3 py-1 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
														>
															<Trash2 size={12} />
															Delete for everyone
														</button>
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
								<div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Paperclip size={16} />
										<span className="text-sm text-gray-900 dark:text-gray-100">{selectedFile.name}</span>
										<span className="text-xs text-gray-500 dark:text-gray-400">
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
							<div className="flex gap-2 items-end">
								<input
									ref={fileInputRef}
									type="file"
									onChange={handleFileSelect}
									className="hidden"
									accept="image/*,application/pdf,.doc,.docx,.txt,.csv,audio/*,video/*,.zip"
								/>
								<button
									onClick={() => fileInputRef.current?.click()}
									className="p-3 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
									title={activePartnerId ? "Attach file" : "Select a conversation first"}
									disabled={!activePartnerId}
								>
									<Paperclip size={20} />
								</button>
								<Input
									value={text}
									onChange={e => setText(e.target.value)}
									placeholder={activePartnerId ? "Type a message..." : "Select a conversation to start messaging"}
									className="flex-1 dark:text-white dark:placeholder-gray-400 text-base sm:text-sm py-3 sm:py-2"
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
									className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white px-6 sm:px-4 py-3 sm:py-2 touch-manipulation"
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

export default function AdminMessagesPage() {
	return <AdminMessagesContent />
}