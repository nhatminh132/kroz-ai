import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import NotesPanel from '../components/NotesPanel'
import BookmarksPanel from '../components/BookmarksPanel'
import FlashcardsPanel from '../components/FlashcardsPanel'

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

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

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
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" style={{color: 'rgb(96, 165, 250)'}}><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 5a2 2 0 0 1 2-2h6v18H4a2 2 0 0 1-2-2zm12-2h6a2 2 0 0 1 2 2v5h-8zm0 11h8v5a2 2 0 0 1-2 2h-6z"></path></svg>
            <h1 className="text-4xl font-bold text-white">Study Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256"><path fill="currentColor" d="M182 104v32a6 6 0 0 1-6 6H94.48l13.76 13.76a6 6 0 1 1-8.48 8.48l-24-24a6 6 0 0 1 0-8.48l24-24a6 6 0 0 1 8.48 8.48L94.48 130H170v-26a6 6 0 0 1 12 0m48-48v144a14 14 0 0 1-14 14H40a14 14 0 0 1-14-14V56a14 14 0 0 1 14-14h176a14 14 0 0 1 14 14m-12 0a2 2 0 0 0-2-2H40a2 2 0 0 0-2 2v144a2 2 0 0 0 2 2h176a2 2 0 0 0 2-2Z"></path></svg>
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
          <>
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
                      <h3 className="text-gray-400 text-sm">Flashcard Decks</h3>
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
                    <div className="flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style={{color: "rgb(96, 165, 250)"}}>
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7.2v9.485c0 1.361 0 2.042.204 2.458a2 2 0 0 0 2.06 1.102c.46-.06 1.026-.438 2.158-1.193l.003-.002c.449-.3.673-.449.908-.532a2 2 0 0 1 1.333 0c.235.083.460.233.911.534c1.133.755 1.7 1.132 2.16 1.193a2 2 0 0 0 2.059-1.102c.204-.416.204-1.097.204-2.458V7.197c0-1.118 0-1.678-.218-2.105a2 2 0 0 0-.875-.874C16.48 4 15.92 4 14.8 4H9.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C6 5.52 6 6.08 6 7.2" />
                      </svg>
                    </div>
                    {stats.recentNotes.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No notes yet</div>
                    ) : (
                      <div className="space-y-3">
                        {stats.recentNotes.map(note => (
                          <div key={note.id} className="bg-[#1f1f1f] rounded-lg p-4">
                            <div className="font-medium text-white mb-1">{note.title}</div>
                            <div className="text-sm text-gray-400 line-clamp-2">{note.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Bookmarks */}
                  <div className="bg-[#2a2a2a] rounded-xl p-6">
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
          </>
        )}

        {activeTab === 'notes' && (
          <NotesPanel userId={user?.id} />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksPanel userId={user?.id} />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsPanel userId={user?.id} />
        )}
      </div>
    </div>
  )
}
