// Google OAuth 2.0 Authentication Service
import { supabase } from './supabaseClient'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback'

// Google API Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // Drive - create/manage files
  'https://www.googleapis.com/auth/calendar', // Calendar - full access
  'https://www.googleapis.com/auth/documents', // Docs - create/edit documents
  'https://www.googleapis.com/auth/spreadsheets', // Sheets - create/edit
  'https://www.googleapis.com/auth/gmail.send', // Gmail - send emails
  'https://www.googleapis.com/auth/presentations', // Slides - create/edit
  'https://www.googleapis.com/auth/userinfo.email', // User email
  'https://www.googleapis.com/auth/userinfo.profile' // User profile
].join(' ')

/**
 * Generate Google OAuth URL
 */
export function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline', // Get refresh token
    prompt: 'consent' // Force consent screen to get refresh token
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  try {
    const response = await fetch('/api/google/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error exchanging code:', error)
    throw error
  }
}

/**
 * Save Google tokens to Supabase
 */
export async function saveGoogleTokens(userId, tokens) {
  try {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { error } = await supabase
      .from('profiles')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expires_at: expiresAt
      })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving tokens:', error)
    throw error
  }
}

/**
 * Get Google tokens from Supabase
 */
export async function getGoogleTokens(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token, google_token_expires_at')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting tokens:', error)
    return null
  }
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(userId) {
  try {
    const tokens = await getGoogleTokens(userId)
    if (!tokens || !tokens.google_refresh_token) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('/api/google/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.google_refresh_token })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    await saveGoogleTokens(userId, {
      access_token: data.access_token,
      refresh_token: tokens.google_refresh_token,
      expires_in: data.expires_in
    })

    return data.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw error
  }
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(userId) {
  try {
    const tokens = await getGoogleTokens(userId)
    if (!tokens || !tokens.google_access_token) {
      throw new Error('Not authenticated with Google')
    }

    // Check if token is expired
    const expiresAt = new Date(tokens.google_token_expires_at)
    const now = new Date()

    if (now >= expiresAt) {
      // Token expired, refresh it
      return await refreshAccessToken(userId)
    }

    return tokens.google_access_token
  } catch (error) {
    console.error('Error getting valid token:', error)
    throw error
  }
}

/**
 * Disconnect Google account
 */
export async function disconnectGoogle(userId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_token_expires_at: null,
        google_drive_auto_backup: false,
        google_calendar_enabled: false,
        google_docs_enabled: false,
        google_keep_enabled: false,
        google_sheets_enabled: false,
        google_gmail_enabled: false,
        google_slides_enabled: false
      })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error disconnecting Google:', error)
    throw error
  }
}

/**
 * Check if user is connected to Google
 */
export async function isGoogleConnected(userId) {
  try {
    const tokens = await getGoogleTokens(userId)
    return !!(tokens && tokens.google_access_token)
  } catch (error) {
    return false
  }
}
