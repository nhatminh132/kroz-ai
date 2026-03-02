import React, { useState, useEffect } from 'react'

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>
    <path d="M8 12h8"/>
    <path d="M12 8v8"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.34-4.34"/>
  </svg>
)

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <path d="M18.133 7.723q.435.06.867.128m-.867-.128l-.906 9.68c-.037.434-.254.84-.607 1.136a2.02 2.02 0 0 1-1.297.461H8.677c-.48 0-.944-.164-1.297-.46a1.67 1.67 0 0 1-.607-1.138l-.906-9.679m12.266 0a45 45 0 0 0-2.951-.305m-9.315.305q-.435.06-.867.127m.867-.127a45 45 0 0 1 2.951-.305m6.364 0a45.5 45.5 0 0 0-6.364 0m6.364 0c0-2.114-1.455-3.07-3.182-3.07S8.818 5.44 8.818 7.418M10.5 15.5L10 11m4 0l-.5 4.5"></path>
  </svg>
)
import { supabase } from '../lib/supabaseClient'
import HelpModal from './HelpModal'
import SettingsModal from './SettingsModal'
import PersonalizeModal from './PersonalizeModal'
import RedeemCodeModal from './RedeemCodeModal'

// Add custom scrollbar styles
const sidebarStyles = `
  .sidebar-container ::-webkit-scrollbar {
    width: 6px;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .sidebar-container:hover ::-webkit-scrollbar {
    opacity: 1;
  }
  
  .sidebar-container ::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .sidebar-container ::-webkit-scrollbar-thumb {
    background: #505151;
    border-radius: 3px;
  }
  
  .sidebar-container:hover ::-webkit-scrollbar-thumb {
    background: #5c5d5d;
  }
  
  .sidebar-container ::-webkit-scrollbar-thumb:hover {
    background: #6a6b6b;
  }
`

export default function SidebarChatGPT({ 
  userId, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  isMinimized, 
  onToggleMinimize,
  onSearchExpanded,
  userEmail, 
  uploadsLeft, 
  onToggleGallery,
  isGuest = false,
  refreshTrigger
}) {
  // Guest mode - show only auth buttons
  if (isGuest) {
    const handleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      })
      if (error) {
        console.error('Login error:', error)
        alert('Login failed: ' + error.message)
      }
    }

    return (
      <div className={`bg-[#121212] h-screen flex flex-col transition-all duration-300 ${isMinimized ? 'w-0' : 'w-64'} border-r border-[#3f3f3f]`}>
        {!isMinimized && (
          <>
            {/* Logo at top */}
            <div className="p-4 border-b border-[#3f3f3f]">
              <div className="flex items-center gap-3">
                <img 
                  src="https://i.ibb.co/tTx52RYs/Kroz-logo-minimal-white.png" 
                  alt="Kroz logo minimal white" 
                  className="w-10 h-10 rounded-full"
                />
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cascadia Mono, monospace', letterSpacing: '1px' }}>Kroz</h2>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Welcome!</h3>
                <p className="text-sm text-gray-400">Sign in to unlock all features</p>
              </div>

              <button
                onClick={handleLogin}
                className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Sign In
              </button>

              <button
                onClick={handleLogin}
                className="w-full px-4 py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors"
              >
                Sign Up
              </button>

              <div className="mt-8 pt-8 border-t border-gray-700 w-full">
                <div className="text-xs text-gray-500 space-y-2">
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Unlimited AI access
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Save chat history
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    All AI models
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpandedLocal, setIsSearchExpandedLocal] = useState(false)
  
  // Notify parent when search expands/collapses
  useEffect(() => {
    if (onSearchExpanded) {
      onSearchExpanded(isSearchExpandedLocal)
    }
  }, [isSearchExpandedLocal, onSearchExpanded])
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({ display_name: '', username: '' })
  const [showPersonalize, setShowPersonalize] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showRedeemCode, setShowRedeemCode] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [chatToDelete, setChatToDelete] = useState(null)
  const [personality, setPersonality] = useState(() => {
    return localStorage.getItem('aiPersonality') || 'default'
  })

  useEffect(() => {
    fetchChats()
    fetchFolders()
    loadProfile()
    
    const subscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        }, 
        () => {
          console.log('🔄 Conversation change detected, refreshing...')
          fetchChats()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])

  // Refresh chats when a new chat is created
  useEffect(() => {
    if (refreshTrigger) {
      console.log('🔄 New chat detected, refreshing sidebar...')
      fetchChats()
    }
  }, [refreshTrigger])

  // Listen for custom refresh events (for title updates)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Custom refresh event received, updating sidebar...')
      fetchChats()
    }
    window.addEventListener('refreshSidebar', handleRefresh)
    return () => window.removeEventListener('refreshSidebar', handleRefresh)
  }, [])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          username: data.username || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name
        })
        .eq('id', userId)

      if (error) throw error
      
      setShowProfileModal(false)
      alert('Profile updated successfully!')
      
      // Reload the page to update the welcome message
      window.location.reload()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile: ' + error.message)
    }
  }

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setChats(data || [])
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFolders = async () => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const handleRenameChat = async (chatId, newTitle) => {
    if (!newTitle.trim()) {
      alert('Please enter a valid title')
      return
    }
    
    if (newTitle.trim().length > 100) {
      alert('Title is too long (max 100 characters)')
      return
    }
    
    try {
      const trimmedTitle = newTitle.trim()
      const { error } = await supabase
        .from('conversations')
        .update({ title: trimmedTitle })
        .eq('id', chatId)

      if (error) throw error

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: trimmedTitle } : chat
      ))
      setEditingChatId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error renaming chat:', error)
      alert('Failed to rename conversation. Please try again.')
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', chatId)

      if (error) throw error
      
      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId))
      
      // If we deleted the current chat, start a new one
      if (currentChatId === chatId) {
        onNewChat()
      }
      
      setChatToDelete(null)
    } catch (error) {
      console.error('Error deleting chat:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  const handleTogglePin = async (chatId, e) => {
    e.stopPropagation()
    
    try {
      const chat = chats.find(c => c.id === chatId)
      const newPinState = !chat.is_pinned
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: newPinState })
        .eq('id', chatId)

      if (error) throw error
      
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, is_pinned: newPinState } : c
      ))
    } catch (error) {
      console.error('Error toggling pin:', error)
      alert('Failed to pin/unpin conversation.')
    }
  }

  const handleToggleArchive = async (chatId, e) => {
    e.stopPropagation()
    
    try {
      const chat = chats.find(c => c.id === chatId)
      const newArchiveState = !chat.is_archived
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: newArchiveState })
        .eq('id', chatId)

      if (error) throw error
      
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, is_archived: newArchiveState } : c
      ))
    } catch (error) {
      console.error('Error toggling archive:', error)
      alert('Failed to archive/unarchive conversation.')
    }
  }

  const renderChatItem = (chat, index) => {
    // Calculate if dropdown should open upward
    const shouldOpenUp = index > filteredChats.length - 3
    
    // Check for unread messages (chat updated after last view and not current chat)
    const lastViewedKey = `lastViewed_${chat.id}`
    const lastViewed = localStorage.getItem(lastViewedKey)
    const chatUpdated = new Date(chat.updated_at).getTime()
    const lastViewedTime = lastViewed ? parseInt(lastViewed) : 0
    const hasUnread = chatUpdated > lastViewedTime && chat.id !== currentChatId
    
    return (
      <div 
        key={chat.id} 
        className={`relative group rounded-lg mb-1 transition ${currentChatId === chat.id ? 'bg-[#2e2f2f]' : 'hover:bg-[#2e2f2f]'}`}
        onContextMenu={(e) => {
          e.preventDefault()
          const menuWidth = 180
          const menuHeight = 200
          const padding = 8
          const maxX = window.innerWidth - menuWidth - padding
          const maxY = window.innerHeight - menuHeight - padding
          const x = Math.min(e.clientX, maxX)
          const y = Math.min(e.clientY, maxY)
          setContextMenu({ chatId: chat.id, chatTitle: chat.title, x, y })
        }}
      >
        <button onClick={() => {
          onSelectChat(chat)
          // Mark as viewed when clicked
          localStorage.setItem(`lastViewed_${chat.id}`, Date.now().toString())
        }} className="w-full text-left px-3 py-2">
          <div className="text-sm text-white truncate pr-20 flex items-center gap-2">
            {hasUnread && (
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" title="Unread messages"></span>
            )}
            {chat.is_pinned && (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="text-gray-400 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M6 10.6V4a1 1 0 0 1 0-2h12a1 1 0 1 1 0 2v6.6c.932 1.02 1.432 2.034 1.699 2.834c.146.438.22.81.26 1.08a4 4 0 0 1 .04.43v.034l.001.013v.008s-.005-.131 0 .001a1 1 0 0 1-1 1h-6v5a1 1 0 1 1-2 0v-5H5a1 1 0 0 1-1-1v-.022a2 2 0 0 1 .006-.134a5 5 0 0 1 .035-.33c.04-.27.114-.642.26-1.08c.267-.8.767-1.814 1.699-2.835zM16 4H8v7a1 1 0 0 1-.293.707c-.847.847-1.271 1.678-1.486 2.293H17.78c-.215-.615-.64-1.446-1.486-2.293A1 1 0 0 1 16 11z"/>
              </svg>
            )}
            <span className="truncate">{chat.title}</span>
          </div>
        </button>
        
        {/* Menu button */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenMenuId(openMenuId === chat.id ? null : chat.id)
            }}
            className="p-1.5 hover:bg-[#2e2f2f] rounded transition-colors"
            title="More options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400 hover:text-white transition-colors" viewBox="0 0 16 16">
              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
            </svg>
          </button>
        </div>

        {/* Dropdown menu */}
        {openMenuId === chat.id && (
          <div 
            className={`absolute right-8 ${shouldOpenUp ? 'bottom-0' : 'top-0'} bg-[#121212] rounded-lg shadow-2xl border border-[#4a4a4a] py-1 z-50 min-w-[160px]`}
            onClick={(e) => e.stopPropagation()}
          >
          <button
            onClick={(e) => {
              handleTogglePin(chat.id, e)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] text-white text-sm flex items-center gap-2 transition-colors"
          >
            {chat.is_pinned ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.825 16L15 12.175V4H9v2.175l-2-2V4q0-.825.588-1.413Q8.175 2 9 2h6q.825 0 1.413.587Q17 3.175 17 4v7.25L18.825 14Zm.95 6.6l-6.6-6.6H13v5l-1 1l-1-1v-5H5v-2l2-3V9.825l-5.6-5.6L2.8 2.8l18.375 18.4ZM7.5 14h3.675l-2.2-2.225ZM12 9.175ZM10.075 12.9Z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 10.6V4a1 1 0 0 1 0-2h12a1 1 0 1 1 0 2v6.6c.932 1.02 1.432 2.034 1.699 2.834c.146.438.22.81.26 1.08a4 4 0 0 1 .04.43v.034l.001.013v.008s-.005-.131 0 .001a1 1 0 0 1-1 1h-6v5a1 1 0 1 1-2 0v-5H5a1 1 0 0 1-1-1v-.022a2 2 0 0 1 .006-.134a5 5 0 0 1 .035-.33c.04-.27.114-.642.26-1.08c.267-.8.767-1.814 1.699-2.835zM16 4H8v7a1 1 0 0 1-.293.707c-.847.847-1.271 1.678-1.486 2.293H17.78c-.215-.615-.64-1.446-1.486-2.293A1 1 0 0 1 16 11z"/>
              </svg>
            )}
            {chat.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingChatId(chat.id)
              setEditingTitle(chat.title)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] text-white text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="m10 21l4-4h6q.825 0 1.413.588T22 19q0 .825-.588 1.413T20 21H10Zm-6-2h1.4l8.625-8.625l-1.4-1.4L4 17.6V19ZM18.3 8.925l-4.25-4.2l1.4-1.4q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.388t-.55 1.387L18.3 8.925ZM3 21q-.425 0-.713-.288T2 20v-2.825q0-.2.075-.388t.225-.337l10.3-10.3l4.25 4.25l-10.3 10.3q-.15.15-.337.225T5.825 21H3ZM13.325 9.675l-.7-.7l1.4 1.4l-.7-.7Z"/>
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              handleToggleArchive(chat.id, e)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] text-white text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 12a1 1 0 1 0 0 2h4a1 1 0 0 0 0-2z"/>
              <path fillRule="evenodd" d="M4 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm16 2H4a1 1 0 0 0-1 1v3h18V5a1 1 0 0 0-1-1M3 19v-9h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1" clipRule="evenodd"/>
            </svg>
            {chat.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <div className="border-t border-[#4a4a4a] my-1"></div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setChatToDelete(chat.id)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-red-600/20 text-red-400 text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path d="m9.129 0l1.974.005c.778.094 1.46.46 2.022 1.078c.459.504.7 1.09.714 1.728h5.475a.69.69 0 0 1 .686.693a.69.69 0 0 1-.686.692l-1.836-.001v11.627c0 2.543-.949 4.178-3.041 4.178H5.419c-2.092 0-3.026-1.626-3.026-4.178V4.195H.686A.69.69 0 0 1 0 3.505c0-.383.307-.692.686-.692h5.47c.014-.514.205-1.035.554-1.55C7.23.495 8.042.074 9.129 0m6.977 4.195H3.764v11.627c0 1.888.52 2.794 1.655 2.794h9.018c1.139 0 1.67-.914 1.67-2.794zM6.716 6.34c.378 0 .685.31.685.692v8.05a.69.69 0 0 1-.686.692a.69.69 0 0 1-.685-.692v-8.05c0-.382.307-.692.685-.692m2.726 0c.38 0 .686.31.686.692v8.05a.69.69 0 0 1-.686.692a.69.69 0 0 1-.685-.692v-8.05c0-.382.307-.692.685-.692m2.728 0c.378 0 .685.31.685.692v8.05a.69.69 0 0 1-.685.692a.69.69 0 0 1-.686-.692v-8.05a.69.69 0 0 1 .686-.692M9.176 1.382c-.642.045-1.065.264-1.334.662c-.198.291-.297.543-.313.768l4.938-.001c-.014-.291-.129-.547-.352-.792c-.346-.38-.73-.586-1.093-.635z"/>
            </svg>
            Delete
          </button>
        </div>
      )}
      </div>
    )
  }

  const groupChatsByDate = (chats) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    return {
      today: chats.filter(c => new Date(c.created_at) >= today),
      yesterday: chats.filter(c => {
        const date = new Date(c.created_at)
        return date >= yesterday && date < today
      }),
      lastWeek: chats.filter(c => {
        const date = new Date(c.created_at)
        return date >= lastWeek && date < yesterday
      }),
      older: chats.filter(c => new Date(c.created_at) < lastWeek)
    }
  }

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchive = showArchived ? chat.is_archived : !chat.is_archived
    const matchesFolder = selectedFolder ? chat.folder_id === selectedFolder : true
    return matchesSearch && matchesArchive && matchesFolder
  })

  // Separate pinned and unpinned chats
  const pinnedChats = filteredChats.filter(chat => chat.is_pinned)
  const unpinnedChats = filteredChats.filter(chat => !chat.is_pinned)

  const groupedChats = groupChatsByDate(unpinnedChats)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null)
      setOpenMenuId(null)
    }
    if (contextMenu || openMenuId) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu, openMenuId])

  return (
    <>
      <style>{sidebarStyles}</style>
      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setChatToDelete(null)}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Conversation?</h3>
            <p className="text-sm text-gray-400 mb-6">This will delete "{chats.find(c => c.id === chatToDelete)?.title}". This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setChatToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChat(chatToDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#121212] rounded-lg shadow-2xl border border-[#4a4a4a] py-2 z-50 min-w-[180px]"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              handleTogglePin(contextMenu.chatId, e)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[#2e2f2f] text-white text-sm flex items-center gap-3 transition-colors"
          >
            {chats.find(c => c.id === contextMenu.chatId)?.is_pinned ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.825 16L15 12.175V4H9v2.175l-2-2V4q0-.825.588-1.413Q8.175 2 9 2h6q.825 0 1.413.587Q17 3.175 17 4v7.25L18.825 14Zm.95 6.6l-6.6-6.6H13v5l-1 1l-1-1v-5H5v-2l2-3V9.825l-5.6-5.6L2.8 2.8l18.375 18.4ZM7.5 14h3.675l-2.2-2.225ZM12 9.175ZM10.075 12.9Z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 10.6V4a1 1 0 0 1 0-2h12a1 1 0 1 1 0 2v6.6c.932 1.02 1.432 2.034 1.699 2.834c.146.438.22.81.26 1.08a4 4 0 0 1 .04.43v.034l.001.013v.008s-.005-.131 0 .001a1 1 0 0 1-1 1h-6v5a1 1 0 1 1-2 0v-5H5a1 1 0 0 1-1-1v-.022a2 2 0 0 1 .006-.134a5 5 0 0 1 .035-.33c.04-.27.114-.642.26-1.08c.267-.8.767-1.814 1.699-2.835zM16 4H8v7a1 1 0 0 1-.293.707c-.847.847-1.271 1.678-1.486 2.293H17.78c-.215-.615-.64-1.446-1.486-2.293A1 1 0 0 1 16 11z"/>
              </svg>
            )}
            {chats.find(c => c.id === contextMenu.chatId)?.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={() => {
              setEditingChatId(contextMenu.chatId)
              setEditingTitle(contextMenu.chatTitle)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[#2e2f2f] text-white text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="m10 21l4-4h6q.825 0 1.413.588T22 19q0 .825-.588 1.413T20 21H10Zm-6-2h1.4l8.625-8.625l-1.4-1.4L4 17.6V19ZM18.3 8.925l-4.25-4.2l1.4-1.4q.575-.575 1.413-.575t1.412.575l1.4 1.4q.575.575.6 1.388t-.55 1.387L18.3 8.925ZM3 21q-.425 0-.713-.288T2 20v-2.825q0-.2.075-.388t.225-.337l10.3-10.3l4.25 4.25l-10.3 10.3q-.15.15-.337.225T5.825 21H3ZM13.325 9.675l-.7-.7l1.4 1.4l-.7-.7Z"/>
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              handleToggleArchive(contextMenu.chatId, e)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[#2e2f2f] text-white text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 12a1 1 0 1 0 0 2h4a1 1 0 0 0 0-2z"/>
              <path fillRule="evenodd" d="M4 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm16 2H4a1 1 0 0 0-1 1v3h18V5a1 1 0 0 0-1-1M3 19v-9h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1" clipRule="evenodd"/>
            </svg>
            {chats.find(c => c.id === contextMenu.chatId)?.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <div className="border-t border-[#4a4a4a] my-1"></div>
          <button
            onClick={(e) => {
              handleDeleteChat(contextMenu.chatId, e)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-red-600/20 text-red-400 text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="m9.129 0l1.974.005c.778.094 1.46.46 2.022 1.078c.459.504.7 1.09.714 1.728h5.475a.69.69 0 0 1 .686.693a.69.69 0 0 1-.686.692l-1.836-.001v11.627c0 2.543-.949 4.178-3.041 4.178H5.419c-2.092 0-3.026-1.626-3.026-4.178V4.195H.686A.69.69 0 0 1 0 3.505c0-.383.307-.692.686-.692h5.47c.014-.514.205-1.035.554-1.55C7.23.495 8.042.074 9.129 0m6.977 4.195H3.764v11.627c0 1.888.52 2.794 1.655 2.794h9.018c1.139 0 1.67-.914 1.67-2.794zM6.716 6.34c.378 0 .685.31.685.692v8.05a.69.69 0 0 1-.686.692a.69.69 0 0 1-.685-.692v-8.05c0-.382.307-.692.685-.692m2.726 0c.38 0 .686.31.686.692v8.05a.69.69 0 0 1-.686.692a.69.69 0 0 1-.685-.692v-8.05c0-.382.307-.692.685-.692m2.728 0c.378 0 .685.31.685.692v8.05a.69.69 0 0 1-.685.692a.69.69 0 0 1-.686-.692v-8.05a.69.69 0 0 1 .686-.692M9.176 1.382c-.642.045-1.065.264-1.334.662c-.198.291-.297.543-.313.768l4.938-.001c-.014-.291-.129-.547-.352-.792c-.346-.38-.73-.586-1.093-.635z"/>
            </svg>
            Delete
          </button>
        </div>
      )}


      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} userId={userId} />}

      {/* Personalize Modal */}
      {showPersonalize && (
        <PersonalizeModal
          onClose={() => setShowPersonalize(false)}
          personality={personality}
          onPersonalityChange={(newPersonality) => {
            setPersonality(newPersonality)
            localStorage.setItem('aiPersonality', newPersonality)
            window.dispatchEvent(new CustomEvent('personalityChanged', { detail: newPersonality }))
          }}
        />
      )}

      {/* Redeem Code Modal */}
      {showRedeemCode && (
        <RedeemCodeModal
          onClose={() => setShowRedeemCode(false)}
          userId={userId}
        />
      )}

      {/* Rename Modal */}
      {editingChatId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => { setEditingChatId(null); setEditingTitle('') }}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Rename Conversation</h3>
            <p className="text-sm text-gray-400 mb-4">Give this conversation a memorable name</p>
            <div className="relative">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameChat(editingChatId, editingTitle)
                  if (e.key === 'Escape') { setEditingChatId(null); setEditingTitle('') }
                }}
                maxLength={100}
                className="w-full px-4 py-3 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter conversation title..."
                autoFocus
              />
              <div className="text-xs text-gray-500 mb-4 text-right">
                {editingTitle.length}/100
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingChatId(null); setEditingTitle('') }}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameChat(editingChatId, editingTitle)}
                disabled={!editingTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowSearchModal(false)}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-2xl w-full border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Search Conversations</h3>
            <div className="relative mb-4">
              <div className="absolute left-3 top-2.5 text-gray-400">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat)
                    setShowSearchModal(false)
                    setSearchQuery('')
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#2e2f2f] rounded-lg transition text-white mb-2"
                >
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(chat.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Menu - Appears above user button */}
      {showUserMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
          <div className={`absolute ${isMinimized ? 'bottom-14 left-1' : 'bottom-14 left-3'} bg-[#2f2f2f] rounded-lg p-4 w-56 border border-[#4a4a4a] shadow-2xl z-50`}>
            <div className="space-y-1">
              <button 
                onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] rounded-lg transition text-white text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                  <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                </svg>
                Profile
              </button>
              
              <button 
                onClick={() => { setShowPersonalize(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] rounded-lg transition text-white text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>
                  <path d="M14.247 14.269c1.01 0 1.587-.857 1.587-2.025v-.21C15.834 10.43 14.64 9 12.52 9h-.035C10.42 9 9 10.36 9 12.432v.214C9 14.82 10.438 16 12.358 16h.044c.594 0 1.018-.074 1.237-.175v-.73c-.245.11-.673.18-1.18.18h-.044c-1.334 0-2.571-.788-2.571-2.655v-.157c0-1.657 1.058-2.724 2.64-2.724h.04c1.535 0 2.484 1.05 2.484 2.326v.118c0 .975-.324 1.39-.639 1.39-.232 0-.41-.148-.41-.42v-2.19h-.906v.569h-.03c-.084-.298-.368-.63-.954-.63-.778 0-1.259.555-1.259 1.4v.528c0 .892.49 1.434 1.26 1.434.471 0 .896-.227 1.014-.643h.043c.118.42.617.648 1.12.648m-2.453-1.588v-.227c0-.546.227-.791.573-.791.297 0 .572.192.572.708v.367c0 .573-.253.744-.564.744-.354 0-.581-.215-.581-.8Z"/>
                </svg>
                Personalize
              </button>
              
              <button 
                onClick={() => { setShowRedeemCode(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] rounded-lg transition text-white text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                  <path d="M6.854 4.646a.5.5 0 0 1 0 .708L4.207 8l2.647 2.646a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708 0m2.292 0a.5.5 0 0 0 0 .708L11.793 8l-2.647 2.646a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708 0"/>
                </svg>
                Redeem Code
              </button>
              
              <button 
                onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] rounded-lg transition text-white text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                </svg>
                Settings
              </button>
              
              <button 
                onClick={() => { setShowHelp(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] rounded-lg transition text-white text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                Help
              </button>
              
              <div className="border-t border-gray-700 my-2"></div>
              
              <button onClick={handleSignOut} className="w-full text-left px-3 py-2 hover:bg-[#2e2f2f] rounded-lg transition text-red-400 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                </svg>
                Log Out
              </button>
            </div>
          </div>
        </>
      )}
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
            
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  userEmail?.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Your display name"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


      <div className={`${isMinimized ? 'w-0 overflow-hidden' : 'w-64'} bg-[#161717] h-screen flex flex-col transition-[width] duration-300 border-r border-[#3f3f3f] sidebar-container`}>
        {/* Header with Logo and Toggle - Fixed */}
        {!isMinimized && (
          <div className="p-4 border-b border-[#3f3f3f] flex-shrink-0">
            <div className="flex items-center justify-between">
              <img
                src="https://i.ibb.co/tTx52RYs/Kroz-logo-minimal-white.png"
                alt="Kroz logo minimal white"
                className="h-8 w-8 object-contain"
              />
              <button
                onClick={onToggleMinimize}
                className="p-2 rounded-lg bg-transparent hover:bg-[#2e2f2f] active:bg-[#2e2f2f] transition text-white flex items-center justify-center"
                title="Hide sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <path d="M9 3v18"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Scrollable Content Section (Buttons + Chats) */}
        <div className="flex-1 overflow-y-auto">
          {/* Buttons Section */}
          <div className="px-4 py-2">
            <div className="flex flex-col gap-2">
            <button onClick={onNewChat} className={`w-full bg-[#1f1f1f] hover:bg-[#2e2f2f] text-[#dbdbdb] px-3 py-2.5 rounded-lg transition flex items-center border border-[#3f3f3f] ${isMinimized ? 'justify-center' : 'gap-3'}`} title="New Chat">
              <div className="flex-shrink-0 flex items-center w-4"><PlusIcon /></div>
              {!isMinimized && <span>New Chat</span>}
            </button>
            <button onClick={() => window.location.href = '/study'} className={`w-full hover:bg-[#2e2f2f] text-[#dbdbdb] px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Study Dashboard">
              <div className="flex-shrink-0 flex items-center justify-center w-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                  <path d="M8.557 2.75H4.682A1.93 1.93 0 0 0 2.75 4.682v3.875a1.94 1.94 0 0 0 1.932 1.942h3.875a1.94 1.94 0 0 0 1.942-1.942V4.682A1.94 1.94 0 0 0 8.557 2.75m10.761 0h-3.875a1.94 1.94 0 0 0-1.942 1.932v3.875a1.943 1.943 0 0 0 1.942 1.942h3.875a1.94 1.94 0 0 0 1.932-1.942V4.682a1.93 1.93 0 0 0-1.932-1.932m0 10.75h-3.875a1.94 1.94 0 0 0-1.942 1.933v3.875a1.94 1.94 0 0 0 1.942 1.942h3.875a1.94 1.94 0 0 0 1.932-1.942v-3.875a1.93 1.93 0 0 0-1.932-1.932M8.557 13.5H4.682a1.943 1.943 0 0 0-1.932 1.943v3.875a1.93 1.93 0 0 0 1.932 1.932h3.875a1.94 1.94 0 0 0 1.942-1.932v-3.875a1.94 1.94 0 0 0-1.942-1.942"/>
                </svg>
              </div>
              {!isMinimized && <span>Study Dashboard</span>}
            </button>

            <button onClick={onToggleGallery} className={`w-full hover:bg-[#2e2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Gallery">
              <div className="flex-shrink-0 flex items-center justify-center w-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.081 2.489a1.04 1.04 0 0 0-.93-.897c-1.155-.11-2.362-.247-3.603-.247s-2.448.138-3.604.247a1.04 1.04 0 0 0-.93.897C.89 3.417.75 4.383.75 5.375s.141 1.958.264 2.886c.063.478.45.852.93.897"/>
                  <path d="M3.919 11.511c.063.478.45.852.93.897c1.155.11 2.362.247 3.603.247s2.448-.138 3.604-.247c.48-.045.867-.42.93-.897c.123-.928.264-1.894.264-2.886s-.141-1.958-.264-2.886a1.04 1.04 0 0 0-.93-.897c-1.156-.11-2.362-.247-3.604-.247c-1.24 0-2.448.138-3.603.247a1.04 1.04 0 0 0-.93.897c-.123.928-.264 1.894-.264 2.886s.14 1.958.264 2.886"/>
                  <path d="M3.818 10.68a7.6 7.6 0 0 1 1.531-1.43c.566-.401 1.323-.432 1.889-.03c1.234.878 2.278 2.128 2.986 3.357m-.143-3.747c.784 0 1.224-.44 1.224-1.223s-.44-1.224-1.224-1.224c-.783 0-1.224.44-1.224 1.224c0 .783.441 1.224 1.224 1.224"/>
                </svg>
              </div>
              {!isMinimized && <span>Gallery</span>}
            </button>
            </div>
          </div>
          
          {/* Chat List Section */}
          <div className="px-2 py-2">
          {!isMinimized && (
            <>
              {/* Chat History Header with Search and Archive */}
              <div className="px-3 py-2.5 mb-2 flex items-center justify-between">
                {!isSearchExpandedLocal ? (
                  <>
                    <h3 className="text-sm text-[#dbdbdb] font-normal flex items-center gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                      </div>
                      Chat History
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setIsSearchExpandedLocal(true)
                          setTimeout(() => {
                            const input = document.querySelector('.search-input')
                            if (input) input.focus()
                          }, 100)
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2e2f2f] rounded-lg transition"
                        title="Search chats"
                      >
                        <SearchIcon />
                      </button>
                      <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2e2f2f] rounded-lg transition"
                        title={showArchived ? 'Show Active' : 'Show Archived'}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 12a1 1 0 1 0 0 2h4a1 1 0 0 0 0-2z"/>
                          <path fillRule="evenodd" d="M4 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3zm16 2H4a1 1 0 0 0-1 1v3h18V5a1 1 0 0 0-1-1M3 19v-9h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center flex-1 rounded-lg bg-[#2f2f2f] px-3 py-1.5">
                      <SearchIcon />
                      <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setIsSearchExpandedLocal(false)}
                        className="search-input bg-transparent text-[#dbdbdb] text-sm outline-none ml-2 w-full placeholder-gray-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center text-gray-500 mt-4">Loading...</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center text-gray-500 mt-4 text-sm">No chats yet</div>
              ) : (
                <>
                  {/* All Chats - Pinned appear first */}
                  {[...pinnedChats, ...unpinnedChats].map((chat, index) => renderChatItem(chat, index))}
                </>
              )}
            </>
          )}
          </div>
        </div>
        
        {/* User Section - Fixed at bottom */}
        <div className="border-t border-[#3f3f3f] p-3 flex-shrink-0 relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full p-2 hover:bg-[#2e2f2f] rounded-lg transition flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {userEmail?.charAt(0).toUpperCase()}
            </div>
            {!isMinimized && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-white font-medium truncate">{userEmail?.split('@')[0]}</div>
                <div className="text-xs text-gray-400 truncate">{userEmail}</div>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}




