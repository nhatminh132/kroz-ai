import express from 'express'
import Groq from 'groq-sdk'
import cors from 'cors'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
})

// Whisper endpoint for speech-to-text
app.post('/api/whisper', async (req, res) => {
  try {
    const { audio } = req.body
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio provided' })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    // Create a blob-like object for Groq API
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'json'
    })

    res.json({ text: transcription.text })
  } catch (error) {
    console.error('Whisper error:', error)
    res.status(500).json({ error: 'Transcription failed', details: error.message })
  }
})

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const speech = await groq.audio.speech.create({
      model: 'canopylabs/orpheus-v1-english',
      voice: 'troy',
      response_format: 'wav',
      input: text
    })

    const buffer = Buffer.from(await speech.arrayBuffer())
    res.setHeader('Content-Type', 'audio/wav')
    res.send(buffer)
  } catch (error) {
    console.error('TTS error:', error)
    const details = error?.response?.data || error?.message || 'Unknown error'
    res.status(500).json({ error: 'Text-to-speech failed', details })
  }
})

app.post('/api/groq', async (req, res) => {
  const { message, model, systemPrompt, conversationHistory, maxTokens = 4096, stream = true, reasoningEffort, includeReasoning } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    // Build messages array with conversation history
    const messages = []
    
    // Add system prompt
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })
      })
    }
    
    // Add current message
    messages.push({ role: 'user', content: message })

    // Enable web search for compound models
    const isCompoundModel = model && (model.includes('compound') || model.includes('groq/compound'))
    
    const completionOptions = {
      messages,
      model: model || 'llama-3.1-8b-instant',
      stream: stream,
      temperature: 0.7,
      max_tokens: maxTokens
    }

    // Add compound tools for web search, code interpreter, visit website
    if (isCompoundModel) {
      completionOptions.compound_custom = {
        tools: {
          enabled_tools: ['web_search', 'code_interpreter', 'visit_website']
        }
      }
    }

    // Add reasoning parameters if specified (for GPT-OSS models)
    if (reasoningEffort) {
      console.log('🧠 Adding reasoning_effort:', reasoningEffort)
      completionOptions.reasoning_effort = reasoningEffort
    }
    if (includeReasoning) {
      console.log('🧠 Adding include_reasoning:', includeReasoning)
      completionOptions.include_reasoning = includeReasoning
    }

    const response = await groq.chat.completions.create(completionOptions)

    // Handle non-streaming response (for reasoning support)
    if (!stream) {
      console.log('📦 Non-streaming response received')
      
      const messageContent = response.choices[0]?.message
      const content = messageContent?.content || ''
      const reasoning = messageContent?.reasoning || ''
      
      console.log('📝 Content length:', content.length)
      if (reasoning) {
        console.log('✅ Reasoning found, length:', reasoning.length)
      }
      
      return res.status(200).json({
        content,
        reasoning,
        model
      })
    }

    // Handle streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let fullReasoning = ''

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta
      const content = delta?.content || ''
      const reasoning = delta?.reasoning || ''
      
      // Accumulate reasoning
      if (reasoning) {
        console.log('🧠 Got reasoning chunk:', reasoning.substring(0, 50) + '...')
        fullReasoning += reasoning
      }
      
      if (content) {
        res.write(`data: ${JSON.stringify({ content, model })}\n\n`)
      }
    }

    // Send final reasoning if available
    if (fullReasoning) {
      console.log('✅ Sending full reasoning, length:', fullReasoning.length)
      res.write(`data: ${JSON.stringify({ reasoning: fullReasoning, model })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    console.error('❌ Groq API error:', error)
    
    // Only send JSON error if headers haven't been sent (streaming hasn't started)
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'Groq API error',
        model 
      })
    } else {
      // If streaming has started, send error as event
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
    }
  }
})

// Google OAuth token exchange endpoint
app.post('/api/google/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body
    
    console.log('🔐 Google token exchange request received')
    console.log('📍 Redirect URI:', redirect_uri)
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' })
    }

    const requestBody = {
      code,
      client_id: process.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
      redirect_uri: redirect_uri || process.env.VITE_GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    
    console.log('📤 Sending request to Google with client_id:', requestBody.client_id?.substring(0, 20) + '...')

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('❌ Google token exchange error:', JSON.stringify(data, null, 2))
      return res.status(tokenResponse.status).json(data)
    }

    console.log('✅ Token exchange successful!')
    res.json(data)
  } catch (error) {
    console.error('❌ Token exchange error:', error)
    res.status(500).json({ error: 'Failed to exchange token', details: error.message })
  }
})

// Google OAuth token refresh endpoint
app.post('/api/google/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    })

    const data = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      console.error('Google token refresh error:', data)
      return res.status(tokenResponse.status).json(data)
    }

    res.json(data)
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Failed to refresh token', details: error.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Groq proxy server running on port ${PORT}`)
})
