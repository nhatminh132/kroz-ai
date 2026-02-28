import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Chat from './pages/Chat'
import PornhubTroll from './pages/PornhubTroll'
import StudyDashboard from './pages/StudyDashboard'
import GoogleCallback from './pages/GoogleCallback'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/pornhub-troll" element={<PornhubTroll />} />
        <Route path="/study" element={session ? <StudyDashboard user={session.user} /> : <Navigate to="/" replace />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route
          path="/"
          element={<Chat user={session?.user || null} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
