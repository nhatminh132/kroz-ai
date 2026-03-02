import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
})

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, model, systemPrompt, conversationHistory, reasoningEffort, includeReasoning, stream = true } = req.body

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

    // Build request options
    const requestOptions = {
      messages,
      model: model || 'llama-3.1-8b-instant',
      stream: stream,
      temperature: 0.7,
      max_completion_tokens: 2048
    }
    
    // Add reasoning parameters if specified (for GPT-OSS models)
    if (reasoningEffort) {
      console.log('🧠 Adding reasoning_effort:', reasoningEffort)
      requestOptions.reasoning_effort = reasoningEffort
    }
    if (includeReasoning) {
      console.log('🧠 Adding include_reasoning:', includeReasoning)
      requestOptions.include_reasoning = includeReasoning
    }
    
    console.log('📤 Request options:', JSON.stringify(requestOptions, null, 2))
    
    const response = await groq.chat.completions.create(requestOptions)

    // Handle non-streaming response (for reasoning support)
    if (!stream) {
      console.log('📦 Full response object:', JSON.stringify(response.choices[0], null, 2))
      
      const message = response.choices[0]?.message
      const content = message?.content || ''
      const reasoning = message?.reasoning || ''
      
      console.log('📦 Non-streaming response received')
      console.log('📝 Content length:', content.length)
      if (reasoning) {
        console.log('✅ Reasoning found, length:', reasoning.length)
        console.log('🧠 First 200 chars of reasoning:', reasoning.substring(0, 200))
      } else {
        console.log('⚠️ No reasoning in response')
        console.log('🔍 Message object keys:', Object.keys(message || {}))
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
    } else {
      console.log('⚠️ No reasoning received from model')
    }
    
    res.write('data: [DONE]\\n\\n')
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
      res.write(`data: ${JSON.stringify({ error: error.message })}\\n\\n`)
      res.write('data: [DONE]\\n\\n')
      res.end()
    }
  }
}
