const DEFAULT_FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant'
]

/**
 * Non-streaming Groq API call (for reasoning support)
 */
export async function callGroqNonStreaming({
  message,
  systemPrompt = '',
  model,
  conversationHistory = [],
  maxTokens = 4096,
  reasoningEffort = null,
  includeReasoning = false
}) {
  const requestBody = {
    message,
    model,
    systemPrompt,
    conversationHistory,
    maxTokens,
    stream: false
  }
  
  if (reasoningEffort) {
    requestBody.reasoningEffort = reasoningEffort
  }
  if (includeReasoning) {
    requestBody.includeReasoning = includeReasoning
  }
  
  const startTime = Date.now()
  
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // If JSON parsing fails, use status code
        console.warn('Failed to parse error response:', e)
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    const latencyMs = Date.now() - startTime
    
    return {
      text: data.content,
      reasoning: data.reasoning || null,
      tokenCount: null,
      latencyMs
    }
  } catch (error) {
    console.error('❌ Groq non-streaming failed:', error)
    throw error
  }
}

export async function streamGroq({
  message,
  systemPrompt = '',
  model,
  onChunk = () => {},
  fallbackModels = DEFAULT_FALLBACK_MODELS,
  conversationHistory = [],
  maxTokens = 4096,
  reasoningEffort = null,
  includeReasoning = false
}) {
  const modelsToTry = model ? [model, ...fallbackModels] : fallbackModels
  let lastError = null

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Attempting to use model: ${currentModel}`)
      
      // Track start time for latency
      const startTime = performance.now()

      const requestBody = {
        message,
        model: currentModel,
        systemPrompt,
        conversationHistory,
        maxTokens
      }
      
      // Add reasoning parameters if specified (for GPT-OSS models)
      if (reasoningEffort) {
        requestBody.reasoningEffort = reasoningEffort
      }
      if (includeReasoning) {
        requestBody.includeReasoning = includeReasoning
      }
      
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If JSON parsing fails, use status code
          console.warn('Failed to parse error response:', e)
        }
        throw new Error(errorMessage)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let reasoning = ''
      let tokenCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              const endTime = performance.now()
              const latencyMs = Math.round(endTime - startTime)
              
              return { 
                text: fullText, 
                reasoning: reasoning || null,
                model: currentModel,
                tokenCount: tokenCount || estimateTokenCount(fullText),
                latencyMs
              }
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullText += parsed.content
                onChunk(parsed.content)
              }
              // Capture reasoning if provided
              if (parsed.reasoning) {
                reasoning = parsed.reasoning
                console.log('🧠 Reasoning captured:', reasoning.substring(0, 100) + '...')
              }
              // Capture token count if provided by API
              if (parsed.usage?.total_tokens) {
                tokenCount = parsed.usage.total_tokens
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      const endTime = performance.now()
      const latencyMs = Math.round(endTime - startTime)
      
      return { 
        text: fullText,
        reasoning: reasoning || null,
        model: currentModel,
        tokenCount: tokenCount || estimateTokenCount(fullText),
        latencyMs
      }
    } catch (error) {
      lastError = error
      console.warn(`Model ${currentModel} failed:`, error.message)
      
      if (currentModel === modelsToTry[modelsToTry.length - 1]) {
        throw new Error(`All Groq models failed. Last error: ${lastError.message}`)
      }
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError?.message}`)
}

// Estimate token count (rough approximation: ~4 chars per token)
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4)
}
