import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import AIFlashcardGenerator from './AIFlashcardGenerator'
import ExportImport from './ExportImport'

export default function NotesPanel({ userId, onClose }) {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewNote, setShowNewNote] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(null)

  useEffect(() => {
    if (userId) {
      loadFolders()
      loadNotes()
    }
  }, [userId])

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const loadNotes = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('study_notes')
        .select('*, topics(name, color)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (selectedFolder) {
        query = query.eq('topic_id', selectedFolder)
      }

      const { data, error } = await query

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) loadNotes()
  }, [selectedFolder])

  const handleCreateNote = async (noteData) => {
    try {
      const { data, error } = await supabase
        .from('study_notes')
        .insert([{
          user_id: userId,
          title: noteData.title,
          content: noteData.content,
          topic_id: noteData.topicId || null,
          tags: noteData.tags || []
        }])
        .select()

      if (error) throw error
      setNotes([data[0], ...notes])
      setShowNewNote(false)
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Failed to create note')
    }
  }

  const handleUpdateNote = async (noteId, updates) => {
    try {
      const { error } = await supabase
        .from('study_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', noteId)

      if (error) throw error
      loadNotes()
      setEditingNote(null)
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return

    try {
      const { error } = await supabase
        .from('study_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      setNotes(notes.filter(n => n.id !== noteId))
      
      // Hide the editor if deleting the currently editing note
      if (editingNote?.id === noteId) {
        setEditingNote(null)
        setShowNewNote(false)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note')
    }
  }

  const handleCreateFolder = async (name, color) => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([{ user_id: userId, name, color }])
        .select()

      if (error) throw error
      setFolders([...folders, data[0]])
      setShowNewFolder(false)
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder')
    }
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f2f2f] rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#4a4a4a]">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-blue-400" viewBox="0 0 16 16">
              <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h6a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h6a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zM14.5 3.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1z"/>
            </svg>
            <h2 className="text-2xl font-bold text-white">Study Notes</h2>
            <span className="text-gray-400 text-sm">({filteredNotes.length})</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Folders */}
          <div className="w-64 border-r border-[#4a4a4a] p-4 overflow-y-auto">
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
            >
              + New Folder
            </button>

            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition mb-2 ${!selectedFolder ? 'bg-[#4a4a4a] text-white' : 'text-gray-400 hover:bg-[#3f3f3f]'}`}
            >
              📁 All Notes
            </button>

            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition mb-2 flex items-center gap-2 ${selectedFolder === folder.id ? 'bg-[#4a4a4a] text-white' : 'text-gray-400 hover:bg-[#3f3f3f]'}`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }}></span>
                {folder.name}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-[#4a4a4a] flex gap-4">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <ExportImport 
                userId={userId}
                dataType="notes"
                onImportComplete={loadNotes}
              />
              <button
                onClick={() => setShowNewNote(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition whitespace-nowrap flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <g fill="currentColor" clipPath="url(#newNoteIcon)">
                    <path d="M12 6a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 1-1"/>
                    <path fillRule="evenodd" d="M12.8 0c3.92 0 5.88 0 7.38.763a6.97 6.97 0 0 1 3.06 3.06c.763 1.5.763 3.46.763 7.38v1.6c0 3.92 0 5.88-.763 7.38l-.131.244a6.96 6.96 0 0 1-2.93 2.82l-.286.134c-1.46.629-3.42.629-7.09.629h-1.6l-1.38-.002c-2.81-.01-4.44-.082-5.71-.627l-.286-.134a6.97 6.97 0 0 1-3.06-3.06c-.763-1.5-.763-3.46-.763-7.38v-1.6c0-3.68 0-5.63.629-7.09l.134-.286a7.04 7.04 0 0 1 2.82-2.93L3.831.77c1.31-.667 2.97-.75 6-.761l1.38-.002h1.6zm-1.6 1c-1.98 0-3.4 0-4.52.092c-1.11.09-1.82.265-2.41.562a5.95 5.95 0 0 0-2.62 2.62c-.298.584-.472 1.3-.562 2.41c-.091 1.12-.092 2.54-.092 4.52v1.6c0 1.98 0 3.4.092 4.52c.09 1.11.265 1.82.562 2.41a5.95 5.95 0 0 0 2.62 2.62c.584.298 1.3.472 2.41.562c1.12.091 2.54.092 4.52.092h1.6c1.98 0 3.4 0 4.52-.092c1.11-.09 1.82-.265 2.41-.562a5.95 5.95 0 0 0 2.62-2.62c.298-.584.472-1.3.562-2.41c.091-1.12.092-2.54.092-4.52v-1.6c0-1.98 0-3.4-.092-4.52c-.09-1.11-.265-1.82-.562-2.41a5.95 5.95 0 0 0-2.62-2.62c-.584-.298-1.3-.472-2.41-.562C16.2 1 14.78 1 12.8 1z" clipRule="evenodd"/>
                  </g>
                  <defs><clipPath id="newNoteIcon"><path fill="#000" d="M0 0h24v24H0z"/></clipPath></defs>
                </svg>
                New Note
              </button>
            </div>

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading notes...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {searchQuery ? 'No notes found' : 'No notes yet. Create your first study note!'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map(note => (
                    <div key={note.id} className="bg-[#121212] rounded-lg p-4 border border-[#4a4a4a] hover:border-blue-500 transition group">
                      <div onClick={() => setEditingNote(note)} className="cursor-pointer">
                        <h3 className="text-white font-semibold mb-2 truncate">{note.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-3">{note.content}</p>
                      </div>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-[#3f3f3f] text-gray-300 text-xs rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{new Date(note.updated_at).toLocaleDateString()}</span>
                          {note.topics && (
                            <span className="px-2 py-1 rounded" style={{ backgroundColor: note.topics.color + '40', color: note.topics.color }}>
                              {note.topics.name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setGeneratingFlashcards(note)
                          }}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition flex items-center gap-1"
                          title="Generate flashcards from this note"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffffff' }}>
                            <path d="m21.3 18.7l-3-3l1.4-1.4l3 3zm-3.6-12l-1.4-1.4l3-3l1.4 1.4zm-11.4 0l-3-3l1.4-1.4l3 3zm-3.6 12l-1.4-1.4l3-3l1.4 1.4zM5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/>
                          </svg>
                          Flashcards
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Note Modal */}
        {showNewNote && (
          <NoteEditor
            folders={folders}
            onSave={handleCreateNote}
            onClose={() => setShowNewNote(false)}
          />
        )}

        {/* Edit Note Modal */}
        {editingNote && (
          <NoteEditor
            note={editingNote}
            folders={folders}
            onSave={(data) => handleUpdateNote(editingNote.id, data)}
            onDelete={() => handleDeleteNote(editingNote.id)}
            onClose={() => setEditingNote(null)}
          />
        )}

        {/* New Folder Modal */}
        {showNewFolder && (
          <FolderEditor
            onSave={handleCreateFolder}
            onClose={() => setShowNewFolder(false)}
          />
        )}

        {/* AI Flashcard Generator */}
        {generatingFlashcards && (
          <AIFlashcardGenerator
            userId={userId}
            noteContent={generatingFlashcards.content}
            noteTitle={generatingFlashcards.title}
            onClose={() => {
              setGeneratingFlashcards(null)
              loadNotes()
            }}
          />
        )}
      </div>
    </div>
  )
}

function NoteEditor({ note, folders, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [topicId, setTopicId] = useState(note?.topic_id || '')
  const [tags, setTags] = useState(note?.tags?.join(', ') || '')

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    onSave({
      title: title.trim(),
      content: content.trim(),
      topicId: topicId || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    })
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10">
      <div className="bg-[#2f2f2f] rounded-xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">{note ? 'Edit Note' : 'New Note'}</h3>
        
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <textarea
          placeholder="Start typing your notes..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="10"
          className="w-full px-4 py-2 mb-4 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
        />

        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">No folder</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>{folder.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <div className="flex gap-3">
          {note && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function FolderEditor({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a folder name')
      return
    }
    onSave(name.trim(), color)
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-10">
      <div className="bg-[#2f2f2f] rounded-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">New Folder</h3>
        
        <input
          type="text"
          placeholder="Folder name (e.g., Math, Science)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 mb-4 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">Color</label>
          <div className="flex gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2f2f2f]' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
