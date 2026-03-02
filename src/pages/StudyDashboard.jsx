import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import AIFlashcardGenerator from '../components/AIFlashcardGenerator'
import ExportImport from '../components/ExportImport'

export default function StudyDashboard({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview') // overview, notes, bookmarks, flashcards
  const [stats, setStats] = useState({
    notesCount: 0,
    bookmarksCount: 0,
    flashcardsCount: 0,
    recentNotes: [],
    recentBookmarks: []
  })
  const [loading, setLoading] = useState(true)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState({ notes: [], bookmarks: [], flashcards: [] })
  
  // Keep tab data cached to prevent reloading
  const [tabsLoaded, setTabsLoaded] = useState({
    notes: false,
    bookmarks: false,
    flashcards: false,
    progress: false
  })

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  useEffect(() => {
    if (globalSearch.trim() && user) {
      performGlobalSearch()
    } else {
      setSearchResults({ notes: [], bookmarks: [], flashcards: [] })
    }
  }, [globalSearch, user])

  const performGlobalSearch = async () => {
    try {
      const query = globalSearch.toLowerCase()

      // Search notes
      const { data: notes } = await supabase
        .from('study_notes')
        .select('*, topics(name, color)')
        .eq('user_id', user.id)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10)

      // Search bookmarks
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .or(`message_text.ilike.%${query}%,personal_note.ilike.%${query}%`)
        .limit(10)

      // Search flashcards
      const { data: flashcards } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
        .limit(10)

      setSearchResults({
        notes: notes || [],
        bookmarks: bookmarks || [],
        flashcards: flashcards || []
      })
    } catch (error) {
      console.error('Error searching:', error)
    }
  }

  const loadStats = async () => {
    try {
      setLoading(true)

      // Load notes count and recent notes
      const { data: notes, error: notesError } = await supabase
        .from('study_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Load bookmarks count and recent bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Load flashcards count
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('deck_name')
        .eq('user_id', user.id)

      const uniqueDecks = flashcards ? [...new Set(flashcards.map(f => f.deck_name))] : []

      setStats({
        notesCount: notes?.length || 0,
        bookmarksCount: bookmarks?.length || 0,
        flashcardsCount: uniqueDecks.length,
        recentNotes: notes || [],
        recentBookmarks: bookmarks || []
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" style={{color: 'rgb(96, 165, 250)'}}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 5a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2zm12-2h6a2 2 0 0 1 2 2v5h-8zm0 11h8v5a2 2 0 0 1-2 2h-6z"></path></svg>
            <h1 className="text-4xl font-bold text-white">Study Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
              <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/>
            </svg>
            Back to Chat
          </button>
        </div>



        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${activeTab === 'overview' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 19q-.825 0-1.412-.587T1 17V7q0-.825.588-1.412T3 5h10q.825 0 1.413.588T15 7v10q0 .825-.587 1.413T13 19zm0-2h10V7H3zm14 2V5h2v14zm4 0V5h2v14zM3 17V7z"></path></svg>
            Overview
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${activeTab === 'progress' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Progress
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${activeTab === 'notes' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M16.5 4H8a4 4 0 0 0-4 4v8.5a4 4 0 0 0 4 4h6.843a4 4 0 0 0 2.829-1.172l1.656-1.656a4 4 0 0 0 1.172-2.829V8a4 4 0 0 0-4-4"></path><path d="M20.5 14H17a3 3 0 0 0-3 3v3.5M8 8h7.5M8 12h5"></path></svg>
            Notes
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${activeTab === 'bookmarks' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <path d="M6 7.2v9.485c0 1.361 0 2.042.204 2.458a2 2 0 0 0 2.06 1.102c.46-.06 1.026-.438 2.158-1.193l.003-.002c.449-.3.673-.449.908-.532a2 2 0 0 1 1.333 0c.235.083.46.233.911.534c1.133.755 1.7 1.132 2.16 1.193a2 2 0 0 0 2.059-1.102c.204-.416.204-1.097.204-2.458V7.197c0-1.118 0-1.678-.218-2.105a2 2 0 0 0-.875-.874C16.48 4 15.92 4 14.8 4H9.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C6 5.52 6 6.08 6 7.2" />
            </svg>
            Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition ${activeTab === 'flashcards' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 5.5h-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m13 0h-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-5-1h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1"></path></svg>
            Flashcards
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center text-gray-400 py-12">Loading your study data...</div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <button 
                    onClick={() => setActiveTab('notes')}
                    className="bg-[#2a2a2a] hover:bg-[#333] rounded-xl p-6 transition text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-400 text-sm">Total Notes</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" style={{color: "rgb(96, 165, 250)"}}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M16.5 4H8a4 4 0 0 0-4 4v8.5a4 4 0 0 0 4 4h6.843a4 4 0 0 0 2.829-1.172l1.656-1.656a4 4 0 0 0 1.172-2.829V8a4 4 0 0 0-4-4"></path><path d="M20.5 14H17a3 3 0 0 0-3 3v3.5M8 8h7.5M8 12h5"></path></g></svg>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{stats.notesCount}</div>
                    <div className="text-sm text-gray-500">Click to view all notes</div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('bookmarks')}
                    className="bg-[#2a2a2a] hover:bg-[#333] rounded-xl p-6 transition text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-400 text-sm">Bookmarks</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" style={{color: "rgb(96, 165, 250)"}}>
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7.2v9.485c0 1.361 0 2.042.204 2.458a2 2 0 0 0 2.06 1.102c.46-.06 1.026-.438 2.158-1.193l.003-.002c.449-.3.673-.449.908-.532a2 2 0 0 1 1.333 0c.235.083.46.233.911.534c1.133.755 1.7 1.132 2.16 1.193a2 2 0 0 0 2.059-1.102c.204-.416.204-1.097.204-2.458V7.197c0-1.118 0-1.678-.218-2.105a2 2 0 0 0-.875-.874C16.48 4 15.92 4 14.8 4H9.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C6 5.52 6 6.08 6 7.2" />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{stats.bookmarksCount}</div>
                    <div className="text-sm text-gray-500">Click to view all bookmarks</div>
                  </button>

                  <button 
                    onClick={() => setActiveTab('flashcards')}
                    className="bg-[#2a2a2a] hover:bg-[#333] rounded-xl p-6 transition text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-400 text-sm">Flashcards</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 21 21" style={{color: "rgb(96, 165, 250)"}}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.5h-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m13 0h-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1m-5-1h-4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1"></path></svg>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{stats.flashcardsCount}</div>
                    <div className="text-sm text-gray-500">Click to review flashcards</div>
                  </button>
                </div>

                {/* Recent Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Notes */}
                  <div className="bg-[#2a2a2a] rounded-xl p-6">
                    <div className="text-xs text-gray-400 uppercase mb-2">Recent Notes</div>
                    <div className="flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{color: "rgb(96, 165, 250)"}}><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M16.5 4H8a4 4 0 0 0-4 4v8.5a4 4 0 0 0 4 4h6.843a4 4 0 0 0 2.829-1.172l1.656-1.656a4 4 0 0 0 1.172-2.829V8a4 4 0 0 0-4-4"></path><path d="M20.5 14H17a3 3 0 0 0-3 3v3.5M8 8h7.5M8 12h5"></path></g></svg>
                    </div>
                    {stats.recentNotes.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No notes yet</div>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentNotes.map(note => (
                          <div key={note.id} className="bg-[#1f1f1f] rounded-lg p-4">
                            <div className="font-medium text-white mb-1">{note.title}</div>
                            <div className="text-sm text-gray-400 whitespace-pre-wrap break-words break-all max-h-24 overflow-y-auto overflow-x-hidden pr-1">{note.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Bookmarks */}
                  <div className="bg-[#2a2a2a] rounded-xl p-6">
                    <div className="text-xs text-gray-400 uppercase mb-2">Recent Bookmarks</div>
                    <div className="flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{color: "rgb(96, 165, 250)"}}>
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7.2v9.485c0 1.361 0 2.042.204 2.458a2 2 0 0 0 2.06 1.102c.46-.06 1.026-.438 2.158-1.193l.003-.002c.449-.3.673-.449.908-.532a2 2 0 0 1 1.333 0c.235.083.460.233.911.534c1.133.755 1.7 1.132 2.16 1.193a2 2 0 0 0 2.059-1.102c.204-.416.204-1.097.204-2.458V7.197c0-1.118 0-1.678-.218-2.105a2 2 0 0 0-.875-.874C16.48 4 15.92 4 14.8 4H9.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C6 5.52 6 6.08 6 7.2" />
                      </svg>
                    </div>
                    {stats.recentBookmarks.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No bookmarks yet</div>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentBookmarks.map(bookmark => (
                          <div key={bookmark.id} className="bg-[#1f1f1f] rounded-lg p-4">
                            <div className="text-sm text-gray-300 line-clamp-3">{bookmark.message_text}</div>
                            {bookmark.note && (
                              <div className="text-xs text-blue-400 mt-2">Note: {bookmark.note}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <div style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
            <NotesTab userId={user?.id} isActive={activeTab === 'notes'} />
          </div>

          <div style={{ display: activeTab === 'bookmarks' ? 'block' : 'none' }}>
            <BookmarksTab userId={user?.id} isActive={activeTab === 'bookmarks'} />
          </div>

          <div style={{ display: activeTab === 'flashcards' ? 'block' : 'none' }}>
            <FlashcardsTab userId={user?.id} isActive={activeTab === 'flashcards'} />
          </div>

          <div style={{ display: activeTab === 'progress' ? 'block' : 'none' }}>
            <ProgressDashboard userId={user?.id} isActive={activeTab === 'progress'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressDashboard({ userId, isActive }) {
  const [progressData, setProgressData] = useState({
    totalNotes: 0,
    totalBookmarks: 0,
    totalFlashcards: 0,
    topicBreakdown: [],
    weeklyActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (userId && isActive && !hasLoaded) {
      loadProgressData()
      setHasLoaded(true)
    }
  }, [userId, isActive, hasLoaded])

  const loadProgressData = async () => {
    try {
      setLoading(true)

      // Get all notes count
      const { data: notes, error: notesError } = await supabase
        .from('study_notes')
        .select('id, topic_id, created_at, topics(name, color)')
        .eq('user_id', userId)

      // Get all bookmarks count
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('id, created_at')
        .eq('user_id', userId)

      // Get all flashcards count
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('id, created_at')
        .eq('user_id', userId)

      // Calculate topic breakdown
      const topicMap = {}
      notes?.forEach(note => {
        if (note.topics) {
          const topicName = note.topics.name
          if (!topicMap[topicName]) {
            topicMap[topicName] = { name: topicName, color: note.topics.color, count: 0 }
          }
          topicMap[topicName].count++
        }
      })
      const topicBreakdown = Object.values(topicMap).sort((a, b) => b.count - a.count)

      // Calculate weekly activity (last 7 days)
      const weeklyActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const dayNotes = notes?.filter(n => {
          const created = new Date(n.created_at)
          return created >= date && created < nextDate
        }).length || 0

        const dayBookmarks = bookmarks?.filter(b => {
          const created = new Date(b.created_at)
          return created >= date && created < nextDate
        }).length || 0

        const dayFlashcards = flashcards?.filter(f => {
          const created = new Date(f.created_at)
          return created >= date && created < nextDate
        }).length || 0

        weeklyActivity.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          notes: dayNotes,
          bookmarks: dayBookmarks,
          flashcards: dayFlashcards,
          total: dayNotes + dayBookmarks + dayFlashcards
        })
      }

      setProgressData({
        totalNotes: notes?.length || 0,
        totalBookmarks: bookmarks?.length || 0,
        totalFlashcards: flashcards?.length || 0,
        topicBreakdown,
        weeklyActivity
      })
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxActivity = Math.max(...progressData.weeklyActivity.map(d => d.total), 1)

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading progress data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-600/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{progressData.totalNotes}</div>
                  <div className="text-sm text-gray-400">Total Notes</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-600/5 border border-yellow-600/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-yellow-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{progressData.totalBookmarks}</div>
                  <div className="text-sm text-gray-400">Total Bookmarks</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-600/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{progressData.totalFlashcards}</div>
                  <div className="text-sm text-gray-400">Total Flashcards</div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="bg-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Weekly Activity (Last 7 Days)
            </h3>
            <div className="flex items-end justify-between gap-4 h-64">
              {progressData.weeklyActivity.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1 flex-1 justify-end">
                    {day.total > 0 && (
                      <div className="text-xs text-gray-400 font-medium">{day.total}</div>
                    )}
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-500 hover:to-blue-300 relative group"
                      style={{ height: `${(day.total / maxActivity) * 100}%`, minHeight: day.total > 0 ? '20px' : '0' }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Notes: {day.notes}<br/>
                        Bookmarks: {day.bookmarks}<br/>
                        Flashcards: {day.flashcards}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{day.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Topics Breakdown */}
          {progressData.topicBreakdown.length > 0 && (
            <div className="bg-[#2a2a2a] rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Notes by Topic
              </h3>
              <div className="space-y-4">
                {progressData.topicBreakdown.map((topic, i) => {
                  const percentage = (topic.count / progressData.totalNotes) * 100
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }}></div>
                          <span className="text-white font-medium">{topic.name}</span>
                        </div>
                        <span className="text-gray-400 text-sm">{topic.count} notes ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-[#1f1f1f] rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: topic.color }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function NotesTab({ userId, isActive }) {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingFlashcards, setGeneratingFlashcards] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', topicId: '', tags: '' })
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState(new Set())

  useEffect(() => {
    if (userId && isActive && !hasLoaded) {
      loadFolders()
      loadNotes()
      setHasLoaded(true)
    }
  }, [userId, isActive, hasLoaded])

  useEffect(() => {
    if (userId && hasLoaded && selectedFolder !== null) {
      loadNotes()
    }
  }, [selectedFolder])

  const loadFolders = async () => {
    try {
      const { data } = await supabase.from('topics').select('*').eq('user_id', userId).order('name')
      setFolders(data || [])
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const loadNotes = async () => {
    try {
      setLoading(true)
      let query = supabase.from('study_notes').select('*, topics(name, color)').eq('user_id', userId).order('updated_at', { ascending: false })
      if (selectedFolder) query = query.eq('topic_id', selectedFolder)
      const { data } = await query
      setNotes(data || [])
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) {
      alert('Please enter a note title')
      return
    }

    try {
      const { error } = await supabase
        .from('study_notes')
        .insert({
          user_id: userId,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          topic_id: newNote.topicId || null,
          tags: newNote.tags
            ? newNote.tags.split(',').map(t => t.trim()).filter(Boolean)
            : []
        })

      if (error) throw error

      setShowNewNote(false)
      setNewNote({ title: '', content: '', topicId: '', tags: '' })
      loadNotes()
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Failed to create note')
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const displayNotes = selectedFolder
    ? filteredNotes
    : filteredNotes

  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }

  const handleDeleteSelectedNotes = async () => {
    if (selectedNotes.size === 0) return
    if (!confirm(`Delete ${selectedNotes.size} notes?`)) return

    try {
      const ids = Array.from(selectedNotes)
      const { error } = await supabase.from('study_notes').delete().in('id', ids)
      if (error) throw error
      setSelectedNotes(new Set())
      setIsSelectMode(false)
      loadNotes()
    } catch (error) {
      console.error('Error deleting notes:', error)
      alert('Failed to delete notes')
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return
    try {
      const { error } = await supabase.from('study_notes').delete().eq('id', noteId)
      if (error) throw error
      loadNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  return (
    <div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 gap-3 flex-nowrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-full max-w-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.34-4.34"/>
              </svg>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg text-[#dbdbdb] text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowNewNote(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Note
            </button>
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode)
                if (isSelectMode) setSelectedNotes(new Set())
              }}
              className="px-3 py-2 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-white rounded-lg text-sm transition"
            >
              {isSelectMode ? 'Cancel' : 'Select'}
            </button>
            {isSelectMode && (
              <button
                onClick={handleDeleteSelectedNotes}
                disabled={selectedNotes.size === 0}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
              >
                Delete Selected ({selectedNotes.size})
              </button>
            )}
          </div>
          <ExportImport userId={userId} dataType="notes" onImportComplete={loadNotes} />
        </div>
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading notes...</div>
        ) : displayNotes.length === 0 ? (
          <div className="text-center text-gray-400 py-12">{searchQuery ? 'No notes found' : 'No notes yet.'}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayNotes.map(note => (
              <div
                key={note.id}
                className={`bg-[#2a2a2a] rounded-lg p-4 border ${selectedNotes.has(note.id) ? 'border-blue-500' : 'border-[#4a4a4a]'} hover:border-blue-500 transition group overflow-hidden`}
                onClick={() => isSelectMode && toggleNoteSelection(note.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-[#dbdbdb] font-semibold mb-2 truncate">{note.title}</h3>
                    <div className="text-[#dbdbdb] opacity-70 text-sm mb-3 whitespace-pre-wrap break-words break-all max-h-32 overflow-y-auto overflow-x-hidden pr-1">
                      {note.content}
                    </div>
                  </div>
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedNotes.has(note.id)}
                      onChange={() => toggleNoteSelection(note.id)}
                      className="mt-1 accent-blue-600"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{new Date(note.updated_at).toLocaleDateString()}</span>
                    {note.topics && (
                      <span className="px-2 py-1 rounded" style={{ backgroundColor: note.topics.color + '40', color: note.topics.color }}>
                        {note.topics.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setGeneratingFlashcards(note) }} className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgb(74, 85, 101)' }}>
                        <path d="M12 2H2v11h6.5l.5 1H1V1h12v7.5l-1-1z"/>
                        <path d="M3 5h7.999V4H3zm0 3V7h6l-.5 1zm0 3v-1h2.5v1zm7.687 3.528l-.034.056a.2.2 0 0 1-.306 0l-.034-.056l-.069-.175l.256.101l.255-.1zm-.373-8.056a.2.2 0 0 1 .373 0l.608 1.543a3 3 0 0 0 1.69 1.69l1.369.54l.1.255l-.1.255l-1.369.54l-.143.06a3 3 0 0 0-1.547 1.63l-.54 1.369l-.255.1l-.256-.1l-.539-1.369a3 3 0 0 0-1.547-1.63l-.143-.06l-1.543-.608a.2.2 0 0 1 0-.373l.174-.07l1.369-.539a3 3 0 0 0 1.63-1.547l.06-.143zm.186 2.212A4 4 0 0 1 8.684 10.5a4 4 0 0 1 1.816 1.815a4 4 0 0 1 1.815-1.815A4 4 0 0 1 10.5 8.684m4.028 1.63a.2.2 0 0 1 0 .373l-.175.068l.101-.255l-.1-.256z"/>
                      </svg>
                      Flashcards
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id) }} className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {generatingFlashcards && (
          <AIFlashcardGenerator userId={userId} noteContent={generatingFlashcards.content} noteTitle={generatingFlashcards.title} onClose={() => setGeneratingFlashcards(null)} />
        )}

        {showNewNote && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowNewNote(false)}>
            <div className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl p-6 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold text-white mb-4">New Note</h3>
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 mb-3 bg-[#1f1f1f] border border-[#4a4a4a] rounded-lg text-[#dbdbdb] placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <textarea
                placeholder="Write your note..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows="6"
                className="w-full px-4 py-2 mb-3 bg-[#1f1f1f] border border-[#4a4a4a] rounded-lg text-[#dbdbdb] placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
              <select
                value={newNote.topicId}
                onChange={(e) => setNewNote(prev => ({ ...prev, topicId: e.target.value }))}
                className="w-full px-4 py-2 mb-3 bg-[#1f1f1f] border border-[#4a4a4a] rounded-lg text-[#dbdbdb] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">No folder</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newNote.tags}
                onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-2 mb-4 bg-[#1f1f1f] border border-[#4a4a4a] rounded-lg text-[#dbdbdb] placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewNote(false)}
                  className="flex-1 px-4 py-2 bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Create Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BookmarksTab({ userId, isActive }) {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingFlashcards, setGeneratingFlashcards] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedBookmarks, setSelectedBookmarks] = useState(new Set())

  useEffect(() => {
    if (userId && isActive && !hasLoaded) {
      loadBookmarks()
      setHasLoaded(true)
    }
  }, [userId, isActive, hasLoaded])

  const loadBookmarks = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.from('bookmarks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      setBookmarks(data || [])
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this bookmark?')) return
    try {
      await supabase.from('bookmarks').delete().eq('id', id)
      setBookmarks(bookmarks.filter(b => b.id !== id))
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    }
  }

  const filteredBookmarks = bookmarks.filter(b =>
    b.message_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.personal_note && b.personal_note.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleBookmarkSelection = (id) => {
    setSelectedBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteSelectedBookmarks = async () => {
    if (selectedBookmarks.size === 0) return
    if (!confirm(`Delete ${selectedBookmarks.size} bookmarks?`)) return

    try {
      const ids = Array.from(selectedBookmarks)
      const { error } = await supabase.from('bookmarks').delete().in('id', ids)
      if (error) throw error
      setSelectedBookmarks(new Set())
      setIsSelectMode(false)
      setBookmarks(bookmarks.filter(b => !ids.includes(b.id)))
    } catch (error) {
      console.error('Error deleting bookmarks:', error)
      alert('Failed to delete bookmarks')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-nowrap">
        <input type="text" placeholder="Search bookmarks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              if (isSelectMode) setSelectedBookmarks(new Set())
            }}
            className="px-3 py-2 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-white rounded-lg text-sm transition"
          >
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
          {isSelectMode && (
            <button
              onClick={handleDeleteSelectedBookmarks}
              disabled={selectedBookmarks.size === 0}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
            >
              Delete Selected ({selectedBookmarks.size})
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading bookmarks...</div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="text-center text-gray-400 py-12">{searchQuery ? 'No bookmarks found' : 'No bookmarks yet.'}</div>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              className={`bg-[#2a2a2a] rounded-lg p-4 border ${selectedBookmarks.has(bookmark.id) ? 'border-blue-500' : 'border-[#4a4a4a]'}`}
              onClick={() => isSelectMode && toggleBookmarkSelection(bookmark.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-[#dbdbdb] mb-3">{bookmark.message_text}</div>
                  {bookmark.personal_note && (
                    <div className="bg-[#1f1f1f] border-l-4 border-blue-500 p-3 mb-3 rounded">
                      <div className="text-xs text-gray-400 mb-1">Your Note:</div>
                      <div className="text-gray-300 text-sm">{bookmark.personal_note}</div>
                    </div>
                  )}
                </div>
                {isSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedBookmarks.has(bookmark.id)}
                    onChange={() => toggleBookmarkSelection(bookmark.id)}
                    className="mt-1 accent-blue-600"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{new Date(bookmark.created_at).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setGeneratingFlashcards(bookmark) }} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffffff' }}>
                      <path d="m21.3 18.7l-3-3l1.4-1.4l3 3zm-3.6-12l-1.4-1.4l3-3l1.4 1.4zm-11.4 0l-3-3l1.4-1.4l3 3zm-3.6 12l-1.4-1.4l3-3l1.4 1.4zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/>
                    </svg>
                    Flashcards
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(bookmark.id) }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {generatingFlashcards && (
        <AIFlashcardGenerator userId={userId} noteContent={generatingFlashcards.message_text} noteTitle="Bookmarked Message" onClose={() => setGeneratingFlashcards(null)} />
      )}
    </div>
  )
}

function FlashcardsTab({ userId, isActive }) {
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [flippedCards, setFlippedCards] = useState({})
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedDecks, setSelectedDecks] = useState(new Set())
  const [selectedCards, setSelectedCards] = useState(new Set())

  useEffect(() => {
    if (userId && isActive && !hasLoaded) {
      loadDecks()
      setHasLoaded(true)
    }
  }, [userId, isActive, hasLoaded])

  const loadDecks = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.from('flashcards').select('deck_name').eq('user_id', userId)
      const uniqueDecks = [...new Set(data?.map(f => f.deck_name) || [])]
      setDecks(uniqueDecks.map((name, i) => ({ id: i, name })))
    } catch (error) {
      console.error('Error loading decks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFlashcards = async (deckName) => {
    try {
      const { data } = await supabase.from('flashcards').select('*').eq('user_id', userId).eq('deck_name', deckName).order('created_at')
      setFlashcards(data || [])
    } catch (error) {
      console.error('Error loading flashcards:', error)
    }
  }

  const toggleDeckSelection = (deckName) => {
    setSelectedDecks(prev => {
      const next = new Set(prev)
      if (next.has(deckName)) {
        next.delete(deckName)
      } else {
        next.add(deckName)
      }
      return next
    })
  }

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const handleDeleteSelectedDecks = async () => {
    if (selectedDecks.size === 0) return
    if (!confirm(`Delete ${selectedDecks.size} deck(s) and all cards?`)) return

    try {
      const deckNames = Array.from(selectedDecks)
      const { error } = await supabase.from('flashcards').delete().in('deck_name', deckNames).eq('user_id', userId)
      if (error) throw error
      setSelectedDecks(new Set())
      setIsSelectMode(false)
      loadDecks()
    } catch (error) {
      console.error('Error deleting decks:', error)
      alert('Failed to delete decks')
    }
  }

  const handleDeleteSelectedCards = async () => {
    if (selectedCards.size === 0) return
    if (!confirm(`Delete ${selectedCards.size} flashcards?`)) return

    try {
      const ids = Array.from(selectedCards)
      const { error } = await supabase.from('flashcards').delete().in('id', ids).eq('user_id', userId)
      if (error) throw error
      setSelectedCards(new Set())
      setIsSelectMode(false)
      setFlashcards(flashcards.filter(card => !ids.includes(card.id)))
    } catch (error) {
      console.error('Error deleting flashcards:', error)
      alert('Failed to delete flashcards')
    }
  }

  const handleDeleteDeck = async (deckName) => {
    if (!confirm('Delete this deck and all its cards?')) return
    try {
      await supabase.from('flashcards').delete().eq('user_id', userId).eq('deck_name', deckName)
      loadDecks()
      if (selectedDeck?.name === deckName) setSelectedDeck(null)
    } catch (error) {
      console.error('Error deleting deck:', error)
    }
  }

  if (selectedDeck) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedDeck(null); setSelectedCards(new Set()); setIsSelectMode(false) }} className="text-gray-400 hover:text-white">← Back</button>
            <h3 className="text-lg font-semibold text-white">{selectedDeck.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode)
                if (isSelectMode) setSelectedCards(new Set())
              }}
              className="px-3 py-2 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-white rounded-lg text-sm transition"
            >
              {isSelectMode ? 'Cancel' : 'Select'}
            </button>
            {isSelectMode && (
              <button
                onClick={handleDeleteSelectedCards}
                disabled={selectedCards.size === 0}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
              >
                Delete Selected ({selectedCards.size})
              </button>
            )}
          </div>
        </div>
        {flashcards.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No cards in this deck.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.map(card => (
              <button
                key={card.id}
                onClick={() => isSelectMode ? toggleCardSelection(card.id) : setFlippedCards(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                className={`bg-[#2a2a2a] p-4 rounded-lg border ${selectedCards.has(card.id) ? 'border-blue-500' : 'border-[#4a4a4a]'} hover:border-blue-500 transition text-left min-h-[140px] flex flex-col justify-center`}
                title={isSelectMode ? 'Click to select' : 'Click to flip'}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {flippedCards[card.id] && !isSelectMode ? (
                      <>
                        <div className="text-xs text-blue-400 mb-2">Answer</div>
                        <div className="text-[#dbdbdb] opacity-80 text-sm">{card.answer}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-green-400 mb-2">Question</div>
                        <div className="text-[#dbdbdb] font-medium">{card.question}</div>
                      </>
                    )}
                  </div>
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedCards.has(card.id)}
                      onChange={() => toggleCardSelection(card.id)}
                      className="mt-1 accent-blue-600"
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4 gap-2">
        <button
          onClick={() => {
            setIsSelectMode(!isSelectMode)
            if (isSelectMode) setSelectedDecks(new Set())
          }}
          className="px-3 py-2 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-white rounded-lg text-sm transition"
        >
          {isSelectMode ? 'Cancel' : 'Select'}
        </button>
        {isSelectMode && (
          <button
            onClick={handleDeleteSelectedDecks}
            disabled={selectedDecks.size === 0}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition disabled:opacity-50"
          >
            Delete Selected ({selectedDecks.size})
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading decks...</div>
      ) : decks.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No flashcard decks yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <div
              key={deck.id}
              className={`bg-[#2a2a2a] p-4 rounded-lg border ${selectedDecks.has(deck.name) ? 'border-blue-500' : 'border-[#4a4a4a]'} hover:border-blue-500 transition`}
              onClick={() => isSelectMode && toggleDeckSelection(deck.name)}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-[#dbdbdb] font-semibold mb-4">{deck.name}</h4>
                {isSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedDecks.has(deck.name)}
                    onChange={() => toggleDeckSelection(deck.name)}
                    className="mt-1 accent-blue-600"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setSelectedDeck(deck); loadFlashcards(deck.name); }} className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition">
                  View Cards
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.name); }} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
