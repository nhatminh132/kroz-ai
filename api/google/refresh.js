// Serverless function to refresh Google OAuth access token
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' })
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || 'Failed to refresh token')
    }

    const tokens = await response.json()
    res.json(tokens)
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: error.message })
  }
}
