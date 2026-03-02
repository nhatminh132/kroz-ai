import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AIFlashcardGenerator({ userId, noteContent, noteTitle, onClose }) {
  const [generatedCards, setGeneratedCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [deckName, setDeckName] = useState(noteTitle || 'New Deck')
  const [rateMessage, setRateMessage] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const RATE_LIMIT_KEY = `flashcard_rate_${userId || 'guest'}`
  const MINUTE_LIMIT = 2
  const DAILY_LIMIT = 20

  const loadRateEntries = () => {
    try {
      return JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]')
    } catch {
      return []
    }
  }

  const saveRateEntry = (timestamp) => {
    const entries = loadRateEntries().filter((time) => Date.now() - time < 24 * 60 * 60 * 1000)
    entries.push(timestamp)
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entries))
  }

  useEffect(() => {
    if (!cooldownSeconds) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const checkRateLimits = () => {
    const now = Date.now()
    const entries = loadRateEntries()
    const lastMinute = entries.filter((time) => now - time < 60 * 1000)
    const lastDay = entries.filter((time) => now - time < 24 * 60 * 60 * 1000)

    if (lastDay.length >= DAILY_LIMIT) {
      return { allowed: false, message: 'Daily limit reached (20/day). Try again tomorrow.' }
    }

    if (lastMinute.length >= MINUTE_LIMIT) {
      const oldest = Math.min(...lastMinute)
      const waitSeconds = Math.ceil((60 * 1000 - (now - oldest)) / 1000)
      return { allowed: false, message: `Rate limit: 2/min. Try again in ${waitSeconds}s.`, cooldown: waitSeconds }
    }

    return { allowed: true }
  }

  const generateCards = async () => {
    const limitCheck = checkRateLimits()
    if (!limitCheck.allowed) {
      setRateMessage(limitCheck.message)
      if (limitCheck.cooldown) {
        setCooldownSeconds(limitCheck.cooldown)
      }
      return
    }

    setRateMessage('')
    setLoading(true)
    saveRateEntry(Date.now())
    try {
      const systemPrompt = `You are a flashcard generator. Create concise, accurate flashcards from the provided note.
Return ONLY valid JSON in this exact format:
{
  "cards": [
    {"question": "...", "answer": "..."}
  ]
}
Rules:
- 5 to 10 flashcards
- Questions should test key facts, definitions, or concepts
- Answers must be short and precise
- No markdown, no extra text.`

      const userPrompt = `Note title: ${noteTitle || 'Untitled'}\n\nNote content:\n${noteContent}`

      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userPrompt,
          systemPrompt,
          model: 'qwen/qwen3-32b',
          stream: false
        })
      })

      if (!response.ok) {
        let errorMessage = `Failed to generate flashcards (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (err) {
          console.error('Error parsing flashcard error response:', err)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const content = data.content || ''
      let parsed

      try {
        parsed = JSON.parse(content)
      } catch (err) {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('AI response was not valid JSON')
        }
        parsed = JSON.parse(jsonMatch[0])
      }

      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error('AI response missing cards array')
      }

      const cards = parsed.cards
        .filter(card => card.question && card.answer)
        .slice(0, 10)
        .map(card => ({
          question: card.question.trim(),
          answer: card.answer.trim()
        }))

      if (cards.length === 0) {
        throw new Error('No valid flashcards generated')
      }

      setGeneratedCards(cards)
    } catch (error) {
      console.error('Error generating cards:', error)
      alert(error.message || 'Failed to generate flashcards')
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
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            {rateMessage && (
              <div className="text-sm text-red-400 text-center">
                {rateMessage} {cooldownSeconds > 0 && `(${cooldownSeconds}s)`}
              </div>
            )}
            <button
              onClick={generateCards}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                'Generating...'
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="#d8d8d8">
                    <path d="M331-651 211-771l57-57 120 120-57 57Zm149-95v-170h80v170h-80Zm291 535L651-331l57-57 120 120-57 57Zm-63-440-57-57 120-120 57 57-120 120Zm38 171v-80h170v80H746ZM205-92 92-205q-12-12-12-28t12-28l363-364q35-35 85-35t85 35q35 35 35 85t-35 85L261-92q-12 12-28 12t-28-12Zm279-335-14.5-14-14.5-14-14-14-14-14 28 28 29 28ZM233-176l251-251-57-56-250 250 56 57Z"/>
                  </svg>
                  Generate Flashcards from Note
                </>
              )}
            </button>
            {!rateMessage && (
              <div className="text-xs text-gray-400">
                Limit: 2 per minute · 20 per day
              </div>
            )}
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
