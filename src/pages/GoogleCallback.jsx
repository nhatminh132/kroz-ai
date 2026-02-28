import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { exchangeCodeForTokens, saveGoogleTokens } from '../lib/googleAuth'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing...')
  const [error, setError] = useState(null)

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        throw new Error(`Google authorization error: ${error}`)
      }

      if (!code) {
        throw new Error('No authorization code received')
      }

      setStatus('Exchanging authorization code...')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not logged in. Please log in first.')
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code)

      setStatus('Saving tokens...')

      // Save tokens to database
      await saveGoogleTokens(user.id, tokens)

      setStatus('✅ Google Workspace connected successfully!')

      // Redirect back to chat after 2 seconds
      setTimeout(() => {
        navigate('/chat')
      }, 2000)

    } catch (err) {
      console.error('OAuth callback error:', err)
      setError(err.message)
      
      // Redirect back after 5 seconds
      setTimeout(() => {
        navigate('/chat')
      }, 5000)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="bg-[#1e1e1e] rounded-lg p-8 max-w-md w-full mx-4 text-center">
        {error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connection Failed</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <p className="text-gray-400 text-sm">Redirecting back...</p>
          </>
        ) : (
          <>
            <div className="animate-spin text-blue-500 text-5xl mb-4 mx-auto w-12 h-12">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connecting Google Workspace</h2>
            <p className="text-gray-300">{status}</p>
          </>
        )}
      </div>
    </div>
  )
}
