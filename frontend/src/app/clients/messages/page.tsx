'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MessagesSkeleton from '@/components/MessagesSkeleton'
import { getApiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { User, Paperclip, Trash2, Download, X, MoreVertical, EyeOff, ArrowLeft, Send, Search, Filter, Users, MessageCircle, Smile } from 'lucide-react'
import { io } from 'socket.io-client'

type Conversation = {
	partnerId: string
	partnerName: string
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
}

// Helper functions for avatar display
const getInitials = (name: string) => {
	return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getAvatarColor = (index: number) => {
	const colors = ['bg-pink-400', 'bg-blue-500', 'bg-purple-400', 'bg-orange-400', 'bg-green-400', 'bg-red-500', 'bg-gray-600', 'bg-indigo-400', 'bg-teal-400']
	return colors[index % colors.length]
}

function CoachMessagesContent() {
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
	const [showUnreadOnly, setShowUnreadOnly] = useState(false)
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
	const [openConversationDropdown, setOpenConversationDropdown] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const scrollerRef = useRef<HTMLDivElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const conversationDropdownRef = useRef<HTMLDivElement>(null)

	const loadConversations = async (preserveManualConversations = false) => {
		try {
			const res = await fetch(`${API_URL}/api/coach/conversations`, {
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
			const res = await fetch(`${API_URL}/api/coach/messages?${params.toString()}`, {
				headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
			})
			const data = await res.json()
			if (data.success) {
				// Filter out messages that are hidden for this coach user
				const coachId = user?.id
				const filteredMessages = (data.data as Message[]).filter(m => {
					// Show message if it's not hidden for this coach
					return !coachId || !m.hidden_for_users || !m.hidden_for_users.includes(coachId)
				})

				setMessages(filteredMessages)

				// Mark any unread incoming messages as read
				const unread = filteredMessages.filter(m => m.recipient_id === coachId && !m.read_at)
				if (unread.length > 0) {
					await Promise.all(
						unread.map(m => fetch(`${API_URL}/api/coach/messages/${m.id}/read`, {
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

	// Function to initiate conversation with a specific client
	const initiateConversationWith = async (userId: string, userName?: string) => {
		try {
			// First, check if conversation already exists in current state
			const existingConversation = conversations.find(c => c.partnerId === userId)
			if (existingConversation) {
				setActivePartnerId(userId)
				setShowMobileChat(true) // Show the chat on mobile
				return
			}

			// Set active partner immediately for better UX
			setActivePartnerId(userId)
			setShowMobileChat(true) // Show the chat on mobile
			setMessages([])

			// Check backend first to see if conversation already exists
			if (userName) {
				try {
					const response = await fetch(`${API_URL}/api/coach/conversations`, {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${localStorage.getItem('token')}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							partnerId: userId
						})
					})

					if (!response.ok) {
						console.error('Backend conversation check failed:', response.status, response.statusText)
						throw new Error(`HTTP ${response.status}`)
					}

					const result = await response.json()

					if (result.success) {
						// If conversation exists in backend, reload conversations to get it
						if (result.conversationExists) {
							await loadConversations(true) // Preserve manual conversations
							setActivePartnerId(userId)
							setShowMobileChat(true)
						} else {
							// Conversation doesn't exist, create it in state
							createConversationInState(userId, userName)
						}
					}
				} catch (error) {
					console.error('Error checking conversation in backend:', error)
					// If backend check fails, create conversation in state anyway
					createConversationInState(userId, userName)
				}
			}

		} catch (error) {
			console.error('Error initiating conversation:', error)
		}
	}

	// Helper function to create conversation in state
	const createConversationInState = (userId: string, userName: string) => {
		const newConversation: Conversation = {
			partnerId: userId,
			partnerName: userName,
			partnerPhoto: null,
			lastBody: '',
			lastAt: new Date().toISOString(),
			unreadCount: 0,
			totalMessages: 0
		}

		// Add to conversations list immediately and persistently
		setConversations(prev => {
			const exists = prev.find(c => c.partnerId === userId)
			if (!exists) {
				return [newConversation, ...prev]
			}
			return prev
		})
	}

	// Filter conversations based on search
	useEffect(() => {
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

	useEffect(() => {
		;(async () => {
			setLoading(true)

			// Check if we have URL parameters for conversation initiation
			const conversationWith = searchParams.get('conversation_with')
			const partnerName = searchParams.get('partner_name')

			if (conversationWith && partnerName) {
				// If we have URL parameters, create the conversation first
				await initiateConversationWith(
					conversationWith,
					decodeURIComponent(partnerName)
				)
				// Then load conversations with preservation
				await loadConversations(true)

				// Activate the conversation and show mobile chat
				setActivePartnerId(conversationWith)
				setShowMobileChat(true)
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

	// Click outside to close dropdown and keyboard support
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setOpenDropdownId(null)
			}
			if (conversationDropdownRef.current && !conversationDropdownRef.current.contains(event.target as Node)) {
				setOpenConversationDropdown(null)
			}
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpenDropdownId(null)
				setOpenConversationDropdown(null)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	const activePartner = useMemo(() => {
		if (!activePartnerId) return null
		const found = conversations.find(c => c.partnerId === activePartnerId)
		if (found) return found

		// If no conversation found but we have activePartnerId, create a temporary display name
		return {
			partnerId: activePartnerId,
			partnerName: 'Loading...',
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
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const errorText = await response.text()
				console.error('Hide message HTTP error:', response.status, errorText)
				alert(`Failed to hide message: ${response.status} ${errorText}`)
				return
			}

			const result = await response.json()

			if (result.success) {
				// Remove message from local state immediately
				setMessages(prev => prev.filter(m => m.id !== messageId))
				// Also refresh conversations to update last message if needed
				loadConversations(true)
			} else {
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
		<div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
				{initialLoad ? (
				<MessagesSkeleton />
				) : (
					<>
						{/* Page Title */}
						<div className="px-4 py-3">
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
						</div>
						<div className="flex flex-1 min-h-0 overflow-hidden gap-4">
					{/* Sidebar */}
					<div className={`${showMobileChat ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 h-full min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col rounded-lg`}>
						{/* Header */}
						<div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
							<h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Chats</h1>
						</div>

						{/* Search */}
						<div className="p-4 flex-shrink-0">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
								<input
									type="text"
									placeholder="Search..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
								/>
							</div>
						</div>

						{/* Contacts List */}
						<div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
							{filteredConversations.map((c, index) => {
								const initials = getInitials(c.partnerName)
								const avatarColor = getAvatarColor(index)

								return (
									<div
										key={c.partnerId}
										className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 relative group rounded-md transition-all duration-200 ${
											activePartnerId === c.partnerId ? 'bg-gray-100 dark:bg-gray-700' : ''
										}`}
									>
										<div
											onClick={() => {
												setActivePartnerId(c.partnerId)
												setShowMobileChat(true)
											}}
											className="flex items-center flex-1 min-w-0"
										>
											<div className="relative flex-shrink-0">
												{c.partnerPhoto ? (
													<img
														src={c.partnerPhoto}
														alt={c.partnerName}
														className="w-12 h-12 rounded-full object-cover"
													/>
												) : (
													<div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold`}>
														{initials}
													</div>
												)}
												{/* Online indicator */}
												<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
											</div>
											<div className="ml-3 flex-1 min-w-0">
												<div className="flex items-center justify-between mb-1">
													<h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.partnerName}</h3>
													<span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
														{new Date(c.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</span>
												</div>
												<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.lastBody || 'No messages'}</p>
											</div>
											{c.unreadCount > 0 && (
												<span className="ml-2 flex-shrink-0 inline-flex items-center justify-center text-xs bg-red-600 text-white rounded-full h-5 w-5">{c.unreadCount}</span>
											)}
										</div>

										{/* Conversation options dropdown */}
										<div
											ref={openConversationDropdown === c.partnerId ? conversationDropdownRef : null}
											className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
										>
											<div className="relative">
												<button
													onClick={(e) => {
														e.preventDefault()
														e.stopPropagation()
														setOpenConversationDropdown(openConversationDropdown === c.partnerId ? null : c.partnerId)
													}}
													className={`p-2 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95 ${
														openConversationDropdown === c.partnerId
															? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
															: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
													}`}
												>
													<MoreVertical size={16} />
												</button>

												{openConversationDropdown === c.partnerId && (
													<>
														{/* Backdrop */}
														<div className="fixed inset-0 z-40" onClick={() => setOpenConversationDropdown(null)} />

														{/* Dropdown menu */}
														<div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md border border-gray-200 dark:border-gray-700 z-50 min-w-[220px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
															{/* Header gradient */}
															<div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-3 py-2">
																<div className="flex items-center gap-2">
																	<div className="flex items-center justify-center w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
																		<Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
																	</div>
																	<div className="min-w-0">
																		<h3 className="text-xs font-semibold text-gray-900 dark:text-white">Conversation Actions</h3>
																	</div>
																</div>
															</div>

															<div className="py-1">
																<button
																	onClick={(e) => {
																		e.stopPropagation()
																		setOpenConversationDropdown(null)
																		deleteConversation(c.partnerId)
																	}}
																	className="w-full text-left px-3 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-all duration-150"
																>
																	<div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
																		<Trash2 size={14} />
																	</div>
																	<div className="flex-1 min-w-0">
																		<div className="font-medium">Delete conversation</div>
																		<div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Removes all messages permanently</div>
																	</div>
																</button>
															</div>
														</div>
													</>
												)}
											</div>
										</div>
									</div>
								)
							})}
							{filteredConversations.length === 0 && (
								<div className="p-6 text-center text-gray-500 dark:text-gray-400">
									<MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
									<p>No conversations found</p>
									{searchTerm && (
										<p className="text-sm mt-1">Try adjusting your search</p>
									)}
								</div>
							)}
						</div>
					</div>

				{/* Chat Area */}
				<div className={`${showMobileChat ? 'fixed inset-0 z-50 sm:relative sm:inset-auto' : 'hidden sm:flex'} flex-1 bg-white dark:bg-gray-800 flex flex-col min-h-0 h-full`}>
					{/* Chat Header */}
					<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between flex-shrink-0 rounded-lg">
						<div className="flex items-center gap-3">
							{/* Back button for mobile */}
							<button
								onClick={() => setShowMobileChat(false)}
								className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
							>
								<ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
							</button>
							{activePartner && (
								<>
									<div className="relative">
										{activePartner.partnerPhoto ? (
											<img
												src={activePartner.partnerPhoto}
												alt={activePartner.partnerName}
												className="w-12 h-12 rounded-full object-cover"
											/>
										) : (
											<div className={`w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold`}>
												{getInitials(activePartner.partnerName)}
											</div>
										)}
										<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
									</div>
									<div>
										<h2 className="text-lg font-semibold text-gray-900 dark:text-white">{activePartner.partnerName}</h2>
										<span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
											Client
										</span>
									</div>
								</>
							)}
							{!activePartner && (
								<h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select a conversation</h2>
							)}
						</div>
					</div>
					{/* Messages */}
					<div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-800 min-h-0">
						{!activePartnerId && (
							<div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
								<div className="text-center">
									<MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
									<p className="text-lg font-medium mb-2">Select a conversation</p>
									<p className="text-sm">Choose a conversation from the list to start messaging</p>
								</div>
							</div>
						)}
						{activePartnerId && messages.map((m, msgIndex) => {
							const isMine = m.sender_id === (user?.id || '')
							const hasAttachment = m.attachment_url && m.attachment_name && !m.deleted_for_everyone
							const isDeleted = m.deleted_for_everyone
							const senderName = isMine ? 'You' : activePartner?.partnerName || 'Unknown'

							return (
								<div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
									<div className={`max-w-md ${isMine ? 'order-2' : 'order-1'} group relative`}>
										{!isMine && (
											<div className="flex items-center mb-1">
												<div className={`w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold mr-2`}>
													{getInitials(senderName)}
												</div>
											</div>
										)}
										<div className={`${isMine ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'} rounded-2xl px-4 py-3 ${isDeleted ? 'italic opacity-70' : ''}`}>
											{m.body && <p className="text-sm">{m.body}</p>}
											{hasAttachment && (
												<div className={`mt-2 p-2 rounded border ${isMine ? 'border-blue-400 bg-blue-600' : 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600'}`}>
													<div className="flex items-center gap-2">
														<Paperclip size={16} />
														<span className="truncate text-sm">{m.attachment_name}</span>
														<a
															href={m.attachment_url || '#'}
															download={m.attachment_name || undefined}
															className="p-1 hover:opacity-80"
															title="Download"
															target="_blank"
															rel="noopener noreferrer"
														>
															<Download size={14} />
														</a>
													</div>
													{m.attachment_size && (
														<div className="text-xs mt-1 opacity-75">
															{(m.attachment_size / 1024 / 1024).toFixed(2)} MB
														</div>
													)}
												</div>
											)}
										</div>

										{/* Message options dropdown */}
										{!isDeleted && (
											<div
												ref={openDropdownId === m.id ? dropdownRef : null}
												className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
											>
												<div className="relative">
													<button
														onClick={(e) => {
															e.preventDefault()
															e.stopPropagation()
															setOpenDropdownId(openDropdownId === m.id ? null : m.id)
														}}
														className={`p-2 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95 ${
															openDropdownId === m.id
																? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
																: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
														}`}
													>
														<MoreVertical size={16} />
													</button>

													{openDropdownId === m.id && (
														<>
															{/* Backdrop */}
															<div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />

															{/* Dropdown menu */}
															<div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm sm:shadow-md border border-gray-200 dark:border-gray-700 z-50 min-w-[220px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
																{/* Header gradient */}
																<div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-gray-700 dark:to-gray-750 border-b border-gray-200 dark:border-gray-600 px-3 py-2">
																	<div className="flex items-center gap-2">
																		<div className="flex items-center justify-center w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
																			<Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
																		</div>
																		<div className="min-w-0">
																			<h3 className="text-xs font-semibold text-gray-900 dark:text-white">Message Actions</h3>
																		</div>
																	</div>
																</div>

																<div className="py-1">
																	{isMine && (
																		<>
																			<button
																				onClick={(e) => {
																					e.stopPropagation()
																					setOpenDropdownId(null)
																					deleteMessageForEveryone(m.id)
																				}}
																				className="w-full text-left px-3 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 transition-all duration-150"
																			>
																				<div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
																					<Trash2 size={14} />
																				</div>
																				<div className="flex-1 min-w-0">
																					<div className="font-medium">Delete for everyone</div>
																					<div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Removes message permanently</div>
																				</div>
																			</button>

																			<div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-3"></div>
																		</>
																	)}

																	<button
																		onClick={(e) => {
																			e.stopPropagation()
																			setOpenDropdownId(null)
																			hideMessageForMe(m.id)
																		}}
																		className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-3 transition-all duration-150"
																	>
																		<div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
																			<EyeOff size={14} />
																		</div>
																		<div className="flex-1 min-w-0">
																			<div className="font-medium">Delete for me</div>
																			<div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Only hides from your view</div>
																		</div>
																	</button>
																</div>
															</div>
														</>
													)}
												</div>
											</div>
										)}

										<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
											{senderName}, {new Date(m.created_at).toLocaleString()}
											{isMine && m.read_at && <span className="text-blue-600 ml-2">• Seen</span>}
										</p>
									</div>
								</div>
							)
						})}
					</div>
					{/* Input Area */}
					<div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 rounded-lg">
						{selectedFile && (
							<div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Paperclip size={16} className="text-gray-600 dark:text-gray-400" />
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
						<div className="flex items-center space-x-2">
							<button
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
								disabled={!activePartnerId}
							>
								<Smile size={24} />
							</button>
							<input
								type="text"
								placeholder={activePartnerId ? "Type a message" : "Select a conversation to start messaging"}
								value={text}
								onChange={(e) => setText(e.target.value)}
								disabled={!activePartnerId}
								className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault()
										handleSend()
									}
								}}
							/>
							<input
								ref={fileInputRef}
								type="file"
								onChange={handleFileSelect}
								className="hidden"
								accept="image/*,application/pdf,.doc,.docx,.txt,.csv,audio/*,video/*,.zip"
							/>
							<button
								onClick={() => fileInputRef.current?.click()}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
								disabled={!activePartnerId}
								title={activePartnerId ? "Attach file" : "Select a conversation first"}
							>
								<Paperclip size={24} />
							</button>
							<button
								onClick={handleSend}
								disabled={!activePartnerId || sending || uploading || (!text.trim() && !selectedFile)}
								className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Send size={20} />
							</button>
						</div>
					</div>
				</div>
				</div>
				</>
			)}
		</div>
	)
}

export default function CoachMessagesPage() {
	return <CoachMessagesContent />
}
