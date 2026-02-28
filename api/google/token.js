// Serverless function to exchange Google OAuth code for tokens
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, redirect_uri } = req.body

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' })
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || 'Failed to get tokens')
    }

    const tokens = await response.json()
    res.json(tokens)
  } catch (error) {
    console.error('Token exchange error:', error)
    res.status(500).json({ error: error.message })
  }
}
