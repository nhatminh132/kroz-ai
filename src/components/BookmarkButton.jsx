import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function BookmarkButton({ 
  messageText, 
  messageIndex, 
  conversationId, 
  userId, 
  isBookmarked: initialBookmarked,
  onBookmarkChange 
}) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [showNotePopup, setShowNotePopup] = useState(false)
  const [personalNote, setPersonalNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBookmark = async () => {
    console.log('Bookmark clicked - userId:', userId)
    if (!userId) {
      alert('Please sign in to bookmark messages')
      return
    }

    if (isBookmarked) {
      // Remove bookmark
      setLoading(true)
      try {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('conversation_id', conversationId)
          .eq('message_index', messageIndex)

        if (error) throw error
        setIsBookmarked(false)
        if (onBookmarkChange) onBookmarkChange(false)
      } catch (error) {
        console.error('Error removing bookmark:', error)
        alert('Failed to remove bookmark')
      } finally {
        setLoading(false)
      }
    } else {
      // Show popup to add optional note
      setShowNotePopup(true)
    }
  }

  const saveBookmark = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          message_index: messageIndex,
          message_text: messageText,
          personal_note: personalNote || null
        })

      if (error) throw error
      setIsBookmarked(true)
      setShowNotePopup(false)
      setPersonalNote('')
      if (onBookmarkChange) onBookmarkChange(true)
    } catch (error) {
      console.error('Error saving bookmark:', error)
      alert('Failed to save bookmark')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleBookmark}
        disabled={loading}
        className={`p-1.5 rounded-lg transition ${
          isBookmarked 
            ? 'text-yellow-400 hover:text-yellow-300' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this message'}
      >
        {isBookmarked ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5z"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
          </svg>
        )}
      </button>

      {/* Add Note Popup */}
      {showNotePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2f2f2f] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Bookmark Message</h3>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">
                Add a personal note (optional)
              </label>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Why is this important? What should you remember?"
                className="w-full px-4 py-3 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                rows="4"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotePopup(false)
                  setPersonalNote('')
                }}
                className="flex-1 px-4 py-2 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-white rounded-lg transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={saveBookmark}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Bookmark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
