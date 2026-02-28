import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function RedeemCodeModal({ onClose, userId }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleRedeem = async () => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter a code' })
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const upperCode = code.trim().toUpperCase()
      const now = new Date()
      
      // Check if code is BETA and within valid date range
      if (upperCode === 'BETA') {
        const validFrom = new Date('2026-02-16')
        const validUntil = new Date('2026-03-20')
        
        if (now < validFrom || now > validUntil) {
          setMessage({ type: 'error', text: 'This code is not valid at this time' })
          setLoading(false)
          return
        }

        // Check if user already redeemed this code
        const { data: existing } = await supabase
          .from('redeemed_codes')
          .select('*')
          .eq('user_id', userId)
          .eq('code', 'BETA')
          .single()

        if (existing) {
          setMessage({ type: 'error', text: 'You have already redeemed this code' })
          setLoading(false)
          return
        }

        // Save redeemed code
        const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
        
        const { error } = await supabase
          .from('redeemed_codes')
          .insert({
            user_id: userId,
            code: 'BETA',
            redeemed_at: now.toISOString(),
            expires_at: expiresAt.toISOString()
          })

        if (error) throw error

        setMessage({ 
          type: 'success', 
          text: '🎉 BETA code redeemed! You now have unlimited access for 5 days!' 
        })
        
        setTimeout(() => {
          onClose()
          window.location.reload() // Refresh to apply benefits
        }, 2000)
      } else {
        setMessage({ type: 'error', text: 'Invalid code' })
      }
    } catch (error) {
      console.error('Error redeeming code:', error)
      setMessage({ type: 'error', text: 'Failed to redeem code. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#121212] rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Redeem Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Enter your code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRedeem()}
            placeholder="BETA"
            className="w-full px-4 py-2 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            disabled={loading}
          />
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRedeem}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition"
          >
            {loading ? 'Redeeming...' : 'Redeem'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white rounded-lg font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
