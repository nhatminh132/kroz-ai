import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AIFlashcardGenerator({ userId, noteContent, noteTitle, onClose }) {
  const [generatedCards, setGeneratedCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [deckName, setDeckName] = useState(noteTitle || 'New Deck')

  const generateCards = async () => {
    setLoading(true)
    try {
      // Simple card generation - split by sentences and create Q&A pairs
      const sentences = noteContent.split(/[.!?]+/).filter(s => s.trim().length > 10)
      const cards = sentences.slice(0, 5).map((sentence, i) => ({
        question: `What is the key point ${i + 1}?`,
        answer: sentence.trim()
      }))
      setGeneratedCards(cards)
    } catch (error) {
      console.error('Error generating cards:', error)
      alert('Failed to generate flashcards')
    } finally {
      setLoading(false)
    }
  }

  const saveCards = async () => {
    try {
      const cardsToInsert = generatedCards.map(card => ({
        user_id: userId,
        deck_name: deckName,
        question: card.question,
        answer: card.answer
      }))

      const { error } = await supabase.from('flashcards').insert(cardsToInsert)
      if (error) throw error
      
      alert(`Successfully created ${generatedCards.length} flashcards!`)
      onClose()
    } catch (error) {
      console.error('Error saving cards:', error)
      alert('Failed to save flashcards')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">✨ AI Flashcard Generator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {generatedCards.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={generateCards}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg disabled:opacity-50"
            >
              {loading ? 'Generating...' : '✨ Generate Flashcards from Note'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Deck Name</label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full px-4 py-2 bg-[#121212] border border-[#4a4a4a] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {generatedCards.map((card, i) => (
                <div key={i} className="bg-[#1f1f1f] rounded-lg p-4">
                  <div className="text-blue-400 font-medium mb-2">Q: {card.question}</div>
                  <div className="text-gray-300">A: {card.answer}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveCards}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Save {generatedCards.length} Cards
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
