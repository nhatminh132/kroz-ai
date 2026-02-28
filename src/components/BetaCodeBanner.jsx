import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function BetaCodeBanner({ userId }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkBannerVisibility = async () => {
      // Check if user manually dismissed the banner
      const dismissed = localStorage.getItem(`betaBannerDismissed_${userId}`)
      if (dismissed === 'true') {
        setIsVisible(false)
        return
      }

      // Check if current date is within promotion period (16/2/2026 - 20/3/2026)
      const now = new Date()
      const startDate = new Date('2026-02-16')
      const endDate = new Date('2026-03-20')

      if (now < startDate || now > endDate) {
        setIsVisible(false)
        return
      }

      // Check if user has already redeemed the BETA code
      if (userId) {
        const { data, error } = await supabase
          .from('redeemed_codes')
          .select('code, expires_at')
          .eq('user_id', userId)
          .eq('code', 'BETA')
          .gt('expires_at', now.toISOString())
          .limit(1)

        console.log('🎫 Beta Code Banner Check:', { userId, data, error })

        if (!error && data && data.length > 0) {
          // User already redeemed and code is still valid, hide banner
          console.log('✅ User has valid BETA code, hiding banner')
          setIsVisible(false)
        } else {
          // User hasn't redeemed or code expired, show banner
          console.log('📢 Showing banner - user needs to redeem')
          setIsVisible(true)
        }
      } else {
        // Guest user, show banner
        setIsVisible(true)
      }
    }

    checkBannerVisibility()
  }, [userId])

  const handleDismiss = () => {
    // Save dismissal to localStorage
    localStorage.setItem(`betaBannerDismissed_${userId}`, 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 relative flex-shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">🎉</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold">Limited Time Offer!</p>
            <p className="text-sm break-words">Use code <span className="bg-white text-purple-600 px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap">BETA</span> for 5 days of unlimited access! Valid until March 20, 2026.</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white hover:text-gray-200 transition"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
