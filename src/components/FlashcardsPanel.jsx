import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import ExportImport from './ExportImport'

export default function FlashcardsPanel({ userId, onClose }) {
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showStudyMode, setShowStudyMode] = useState(false)
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [showNewCard, setShowNewCard] = useState(false)

  useEffect(() => {
    if (userId) {
      loadDecks()
    }
  }, [userId])

  const loadDecks = async () => {
    try {
      // Get unique deck names from flashcards
      const { data, error } = await supabase
        .from('flashcards')
        .select('deck_name')
        .eq('user_id', userId)

      if (error) throw error
      
      // Get unique deck names
      const uniqueDecks = [...new Set(data.map(f => f.deck_name))]
      setDecks(uniqueDecks.map((name, i) => ({ id: i, name })))
    } catch (error) {
      console.error('Error loading decks:', error)
    }
  }

  const loadFlashcards = async (deckName) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .eq('deck_name', deckName)
        .order('created_at')

      if (error) throw error
      setFlashcards(data || [])
    } catch (error) {
      console.error('Error loading flashcards:', error)
    }
  }

  const handleCreateDeck = async (name, topicId) => {
    try {
      // Create a placeholder card for this deck
      const { error } = await supabase
        .from('flashcards')
        .insert({ 
          user_id: userId,
          deck_name: name,
          question: 'Sample Question',
          answer: 'Sample Answer'
        })

      if (error) throw error
      
      // Reload decks to include the new one
      loadDecks()
      setShowNewDeck(false)
    } catch (error) {
      console.error('Error creating deck:', error)
      alert('Failed to create deck: ' + error.message)
    }
  }

  const handleCreateCard = async (front, back) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({ 
          user_id: userId,
          deck_name: selectedDeck.name, 
          question: front, 
          answer: back 
        })

      if (error) throw error
      loadFlashcards(selectedDeck.name)
      setShowNewCard(false)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleDeleteDeck = async (deckName) => {
    if (!confirm('Delete this deck and all its cards?')) return
    try {
      // Delete all flashcards in this deck
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('user_id', userId)
        .eq('deck_name', deckName)

      if (error) throw error
      loadDecks()
      if (selectedDeck?.name === deckName) {
        setSelectedDeck(null)
        setShowStudyMode(false)
      }
    } catch (error) {
      console.error('Error deleting deck:', error)
    }
  }

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Delete this card?')) return
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
      setFlashcards(flashcards.filter(c => c.id !== cardId))
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#2f2f2f] rounded-lg w-full max-w-4xl h-[90vh] flex flex-col border border-[#4a4a4a]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#4a4a4a]">
          <h2 className="text-2xl font-bold text-white">Flashcards</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedDeck ? (
            /* Deck List View */
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Your Decks</h3>
                <button
                  onClick={() => setShowNewDeck(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <g fill="currentColor" clipPath="url(#newDeckIcon)">
                      <path d="M12 6a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 1-1"/>
                      <path fillRule="evenodd" d="M12.8 0c3.92 0 5.88 0 7.38.763a6.97 6.97 0 0 1 3.06 3.06c.763 1.5.763 3.46.763 7.38v1.6c0 3.92 0 5.88-.763 7.38l-.131.244a6.96 6.96 0 0 1-2.93 2.82l-.286.134c-1.46.629-3.42.629-7.09.629h-1.6l-1.38-.002c-2.81-.01-4.44-.082-5.71-.627l-.286-.134a6.97 6.97 0 0 1-3.06-3.06c-.763-1.5-.763-3.46-.763-7.38v-1.6c0-3.68 0-5.63.629-7.09l.134-.286a7.04 7.04 0 0 1 2.82-2.93L3.831.77c1.31-.667 2.97-.75 6-.761l1.38-.002h1.6zm-1.6 1c-1.98 0-3.4 0-4.52.092c-1.11.09-1.82.265-2.41.562a5.95 5.95 0 0 0-2.62 2.62c-.298.584-.472 1.3-.562 2.41c-.091 1.12-.092 2.54-.092 4.52v1.6c0 1.98 0 3.4.092 4.52c.09 1.11.265 1.82.562 2.41a5.95 5.95 0 0 0 2.62 2.62c.584.298 1.3.472 2.41.562c1.12.091 2.54.092 4.52.092h1.6c1.98 0 3.4 0 4.52-.092c1.11-.09 1.82-.265 2.41-.562a5.95 5.95 0 0 0 2.62-2.62c.298-.584.472-1.3.562-2.41c.091-1.12.092-2.54.092-4.52v-1.6c0-1.98 0-3.4-.092-4.52c-.09-1.11-.265-1.82-.562-2.41a5.95 5.95 0 0 0-2.62-2.62c-.584-.298-1.3-.472-2.41-.562C16.2 1 14.78 1 12.8 1z" clipRule="evenodd"/>
                    </g>
                    <defs><clipPath id="newDeckIcon"><path fill="#000" d="M0 0h24v24H0z"/></clipPath></defs>
                  </svg>
                  New Deck
                </button>
              </div>

              {decks.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No flashcard decks yet. Create your first deck!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {decks.map(deck => (
                    <div key={deck.id} className="bg-[#121212] p-4 rounded-lg border border-[#4a4a4a] hover:border-blue-500 transition">
                      <h4 className="text-white font-semibold mb-2">{deck.name}</h4>
                      <p className="text-sm text-gray-400 mb-4">0 cards</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedDeck(deck); loadFlashcards(deck.name); }}
                          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
                        >
                          View Cards
                        </button>
                        <button
                          onClick={() => handleDeleteDeck(deck.name)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !showStudyMode ? (
            /* Card List View */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedDeck(null)} className="text-gray-400 hover:text-white">
                    ← Back
                  </button>
                  <h3 className="text-lg font-semibold text-white">{selectedDeck.name}</h3>
                </div>
                <div className="flex gap-2">
                  {flashcards.length > 0 && (
                    <button
                      onClick={() => { setShowStudyMode(true); setCurrentCardIndex(0); setIsFlipped(false); }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      Study
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewCard(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <g fill="currentColor" clipPath="url(#newCardIcon)">
                        <path d="M12 6a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 1-1"/>
                        <path fillRule="evenodd" d="M12.8 0c3.92 0 5.88 0 7.38.763a6.97 6.97 0 0 1 3.06 3.06c.763 1.5.763 3.46.763 7.38v1.6c0 3.92 0 5.88-.763 7.38l-.131.244a6.96 6.96 0 0 1-2.93 2.82l-.286.134c-1.46.629-3.42.629-7.09.629h-1.6l-1.38-.002c-2.81-.01-4.44-.082-5.71-.627l-.286-.134a6.97 6.97 0 0 1-3.06-3.06c-.763-1.5-.763-3.46-.763-7.38v-1.6c0-3.68 0-5.63.629-7.09l.134-.286a7.04 7.04 0 0 1 2.82-2.93L3.831.77c1.31-.667 2.97-.75 6-.761l1.38-.002h1.6zm-1.6 1c-1.98 0-3.4 0-4.52.092c-1.11.09-1.82.265-2.41.562a5.95 5.95 0 0 0-2.62 2.62c-.298.584-.472 1.3-.562 2.41c-.091 1.12-.092 2.54-.092 4.52v1.6c0 1.98 0 3.4.092 4.52c.09 1.11.265 1.82.562 2.41a5.95 5.95 0 0 0 2.62 2.62c.584.298 1.3.472 2.41.562c1.12.091 2.54.092 4.52.092h1.6c1.98 0 3.4 0 4.52-.092c1.11-.09 1.82-.265 2.41-.562a5.95 5.95 0 0 0 2.62-2.62c.298-.584.472-1.3.562-2.41c.091-1.12.092-2.54.092-4.52v-1.6c0-1.98 0-3.4-.092-4.52c-.09-1.11-.265-1.82-.562-2.41a5.95 5.95 0 0 0-2.62-2.62c-.584-.298-1.3-.472-2.41-.562C16.2 1 14.78 1 12.8 1z" clipRule="evenodd"/>
                      </g>
                      <defs><clipPath id="newCardIcon"><path fill="#000" d="M0 0h24v24H0z"/></clipPath></defs>
                    </svg>
                    New Card
                  </button>
                </div>
              </div>

              {flashcards.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No cards yet. Add your first flashcard!
                </div>
              ) : (
                <div className="space-y-3">
                  {flashcards.map(card => (
                    <div key={card.id} className="bg-[#121212] p-4 rounded-lg border border-[#4a4a4a]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-2">{card.question}</div>
                          <div className="text-gray-400 text-sm">{card.answer}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-red-500 hover:text-red-400 ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Study Mode */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-6 text-gray-400">
                Card {currentCardIndex + 1} of {flashcards.length}
              </div>

              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-2xl h-96 cursor-pointer perspective-1000"
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  <div className="absolute w-full h-full backface-hidden bg-blue-600 rounded-lg p-8 flex items-center justify-center text-white text-2xl text-center">
                    {flashcards[currentCardIndex]?.question}
                  </div>
                  <div className="absolute w-full h-full backface-hidden bg-green-600 rounded-lg p-8 flex items-center justify-center text-white text-xl text-center rotate-y-180">
                    {flashcards[currentCardIndex]?.answer}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-400">Click card to flip</div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    if (currentCardIndex > 0) {
                      setCurrentCardIndex(currentCardIndex - 1)
                      setIsFlipped(false)
                    }
                  }}
                  disabled={currentCardIndex === 0}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setShowStudyMode(false)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Exit Study
                </button>
                <button
                  onClick={() => {
                    if (currentCardIndex < flashcards.length - 1) {
                      setCurrentCardIndex(currentCardIndex + 1)
                      setIsFlipped(false)
                    }
                  }}
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Deck Modal */}
      {showNewDeck && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-4">New Deck</h3>
            <input
              type="text"
              placeholder="Deck name"
              className="w-full px-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateDeck(e.target.value, null)
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewDeck(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const input = e.target.parentElement.previousElementSibling
                  handleCreateDeck(input.value, null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Card Modal */}
      {showNewCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-4">New Card</h3>
            <input
              id="card-front"
              type="text"
              placeholder="Front (Question)"
              className="w-full px-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white mb-3"
            />
            <textarea
              id="card-back"
              placeholder="Back (Answer)"
              rows="4"
              className="w-full px-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewCard(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const front = document.getElementById('card-front').value
                  const back = document.getElementById('card-back').value
                  if (front && back) handleCreateCard(front, back)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
