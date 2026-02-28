import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Sidebar({ userId, currentChatId, onNewChat, onSelectChat, onClose, isMinimized, userEmail }) {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    fetchChats()
    
    // Real-time subscription for instant updates
    const subscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          console.log('Conversation change detected:', payload)
          fetchChats() // Refresh the list
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchChats = async () => {
    try {
      // Get all conversations
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

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupChatsByDate = (chats) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const groups = {
      Today: [],
      Yesterday: [],
      'Last 7 Days': [],
      Older: []
    }

    chats.forEach(chat => {
      const chatDate = new Date(chat.created_at)
      if (chatDate.toDateString() === today.toDateString()) {
        groups.Today.push(chat)
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(chat)
      } else if (chatDate > lastWeek) {
        groups['Last 7 Days'].push(chat)
      } else {
        groups.Older.push(chat)
      }
    })

    return groups
  }

  const groupedChats = groupChatsByDate(filteredChats)

  const handleRenameChat = async (chatId, newTitle) => {
    if (!newTitle.trim()) return
    
    try {
      // Update the title in the database
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', chatId)

      if (error) throw error

      // Update local state
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ))
      setEditingChatId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error renaming chat:', error)
    }
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    
    if (!confirm('Delete this conversation?')) return
    
    try {
      // Delete conversation (messages will cascade delete)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', chatId)

      if (error) throw error

      // Update local state
      setChats(prev => prev.filter(chat => chat.id !== chatId))
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  return (
    <>
      {/* Rename Modal */}
      {editingChatId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-lg font-semibold text-white mb-4">Rename Chat</h3>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameChat(editingChatId, editingTitle)
                if (e.key === 'Escape') setEditingChatId(null)
              }}
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent mb-4"
              placeholder="Enter chat name"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingChatId(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameChat(editingChatId, editingTitle)}
                className="px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${isMinimized ? 'w-16' : 'w-64'} bg-[#121212] border-r border-[#3f3f3f] flex flex-col h-screen transition-all duration-300`}>
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <img 
            src="https://i.ibb.co/fdtpDM1c/nminh-white-nobg.png" 
            alt="Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="text-white font-semibold">Kroz</span>
        </div>
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
          </svg>
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-800">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white text-sm
                     focus:ring-2 focus:ring-[#4a4a4a] focus:border-transparent placeholder-gray-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
          </div>
        ) : (
          Object.entries(groupedChats).map(([group, chats]) =>
            chats.length > 0 && (
              <div key={group} className="mb-4">
                <div className="text-xs font-semibold text-gray-500 px-2 mb-2">{group}</div>
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`relative mb-1 rounded-lg transition group ${
                      currentChatId === chat.id
                        ? 'text-white'
                        : 'text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    <button
                      onClick={() => onSelectChat(chat)}
                      className="w-full text-left px-3 py-2.5"
                    >
                      <div className="text-sm truncate pr-16">{chat.title}</div>
                    </button>
                    
                    {/* Action buttons on hover */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
                      {/* Rename button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingChatId(chat.id)
                          setEditingTitle(chat.title)
                        }}
                        className="p-1 hover:bg-gray-700 rounded"
                        title="Rename"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                        </svg>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="p-1 hover:bg-gray-700 rounded"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </div>
    </>
  )
}


