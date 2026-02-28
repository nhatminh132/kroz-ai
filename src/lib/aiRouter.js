import { streamGroq, callGroqNonStreaming } from './streamGroq'

// Personality-based system prompts
const PERSONALITY_PROMPTS = {
  default: `You are Kroz, a helpful educational AI assistant. Your name is Kroz. You help students with homework, studying, and learning. Refuse harmful requests.

IMPORTANT - Math Formatting:
When writing mathematical expressions, ALWAYS use LaTeX notation:
- For inline math: Use $...$ (e.g., $\\frac{1}{2}$ for fractions, $x^2$ for exponents)
- For block math: Use $$...$$ for centered equations
- Examples: $\\frac{1}{2}$, $\\sqrt{x}$, $x^2 + y^2 = r^2$, $\\int_0^1 x dx$
- NEVER write fractions as 1/2, ALWAYS use $\\frac{1}{2}$`,

  professional: `You are Kroz, a professional educational AI assistant.

Communicate in a formal, precise manner. Provide accurate, well-structured responses.

RULES:
1. Use formal language and proper terminology
2. Be thorough yet concise
3. Refuse harmful/illegal requests
4. Focus on educational content

Maintain professional standards at all times.`,

  casual: `You are Kroz, a friendly study buddy!

Chat naturally and help make learning fun. Keep it relaxed but helpful.

RULES:
1. Be friendly and approachable
2. Use casual language (but stay respectful)
3. Refuse harmful/illegal requests
4. Make studying enjoyable

You're here to help students learn in a chill way.`,

  eli5: `You are Kroz, a patient teacher who explains things simply.

Explain concepts like you're talking to a 5-year-old. Use simple words, analogies, and examples.

RULES:
1. Break down complex ideas into simple terms
2. Use analogies and everyday examples
3. Refuse harmful/illegal requests
4. Make learning accessible to everyone

Simplicity is your superpower.`,

  concise: `You are Kroz, a direct AI assistant.

Give the shortest accurate answer. No fluff.

RULES:
1. Maximum brevity
2. Direct answers only
3. Refuse harmful/illegal requests
4. One sentence when possible

Be ultra-concise.`,

  detailed: `You are Kroz, a thorough educational AI.

Provide comprehensive explanations with examples, context, and details.

RULES:
1. Give complete, detailed responses
2. Include examples and context
3. Refuse harmful/illegal requests
4. Explain thoroughly

Help students understand deeply.`,

  socratic: `You are Kroz, a Socratic teacher.

Guide students to answers through thoughtful questions. Help them think critically.

RULES:
1. Ask guiding questions instead of giving direct answers
2. Encourage critical thinking
3. Refuse harmful/illegal requests
4. Lead students to discover answers themselves

The best learning comes from self-discovery.`
}

// Safety system prompt - prevents jailbreaking
const SAFETY_SYSTEM_PROMPT = PERSONALITY_PROMPTS.default

/**
 * Call Groq Vision API for image analysis using Llama 4 Scout
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg', 'image/png')
 * @param {string} userMessage - Optional user message/question about the image
 * @returns {Promise<string>} - AI analysis of the image
 */
export async function callGroqVision(imageBase64, mimeType = 'image/jpeg', userMessage = '') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured')
  }

  // Ensure proper data URL format
  let dataUrl = imageBase64
  if (!imageBase64.startsWith('data:')) {
    dataUrl = `data:${mimeType};base64,${imageBase64}`
  }

  // Build the prompt based on whether user provided a message
  const promptText = userMessage 
    ? `You are Kroz, an AI homework assistant. The user has shared an image with this question/message:

"${userMessage}"

Please analyze the image and respond to their question. Provide clear, step-by-step explanations and show all work if it's a math problem.`
    : `You are Kroz, an AI homework assistant. Analyze this image and:

1. Identify the homework problem or question shown
2. Provide a clear, step-by-step solution
3. Explain the concepts involved
4. If it's a math problem, show all work
5. If it's text/reading, transcribe and provide guidance
6. If it's a diagram, explain what it shows

Format your response in a clear, educational way with proper sections and explanations.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: promptText
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      temperature: 0.4,
      max_completion_tokens: 4096,
      stream: false
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq Vision API failed (${response.status}): ${error}`)
  }

  const data = await response.json()
  
  if (data.error) {
    throw new Error(`Groq Vision error: ${data.error.message || 'Unknown error'}`)
  }
  
  return data.choices[0]?.message?.content || 'Could not analyze image'
}



/**
 * Model configuration for each mode with rate limits
 */
const MODEL_CONFIG = {
  'instant': { 
    model: 'llama-3.1-8b-instant', 
    label: 'Llama 3.1 8B', 
    displayName: "Meta's Llama 3.1",
    dailyLimit: null, 
    perMinLimit: null,
    maxTokens: null,  // No limit
    tpm: 10000
  },
  'thinking': { 
    model: 'openai/gpt-oss-120b', 
    label: 'OpenAI GPT 120B', 
    displayName: "OpenAI's GPT Pro",
    dailyLimit: null, 
    perMinLimit: null,
    maxTokens: null,  // No limit
    tpm: 10000
  },
  'agent': { 
    model: 'moonshotai/kimi-k2-instruct', 
    label: 'Kimi K2', 
    displayName: "Moonshot's Kimi K2",
    dailyLimit: 10, 
    perMinLimit: 3,
    maxTokens: null,  // No limit
    tpm: 10000
  },
  'legion': { 
    model: 'groq/compound', 
    models: ['groq/compound', 'moonshotai/kimi-k2-instruct'], // Multi-model support
    label: 'Compound + Kimi K2', 
    displayName: "Multi-AI Legion",
    dailyLimit: 5, 
    perMinLimit: 2,
    maxTokens: null,  // No limit
    tpm: 10000
  }
}

/**
 * Multi-model coordination for Legion mode
 * TRUE multi-agent system with parallel processing
 * OPTIMIZED FOR PROMPT CACHING
 */
async function routeLegionMode(message, onChunk, conversationHistory, personality) {
  console.log('🚀 Legion Mode: Activating TRUE multi-AI collaboration (cache-optimized)...')
  
  // ═══════════════════════════════════════════════════════════
  // SHARED SYSTEM PROMPT - Will be cached across all agents!
  // ═══════════════════════════════════════════════════════════
  const baseSystemPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.default
  
  // Common cached prefix for ALL agents and synthesis
  const CACHED_LEGION_CONTEXT = `${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEGION MODE: Multi-Agent AI System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are part of an advanced multi-AI system where:
- Multiple specialized agents work in parallel
- Each agent has a specific sub-task
- A synthesis AI combines all outputs
- The goal is maximum quality and comprehensive answers

Follow your specific role instructions below.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  
  try {
    // ═══════════════════════════════════════════════════════════
    // PHASE 1: ORCHESTRATOR - Analyze request & plan agents
    // ═══════════════════════════════════════════════════════════
    
    const orchestratorPrompt = `${CACHED_LEGION_CONTEXT}

ROLE: ORCHESTRATOR AI

Your task is to analyze the user's request and create an execution plan.

USER REQUEST: "${message}"

Instructions:
1. Determine complexity (simple/medium/complex/very complex)
2. Decide how many agents needed (1-4)
3. Assign specific sub-tasks to each agent
4. Choose the best model for each task
5. Provide synthesis instructions

Output ONLY valid JSON:
{
  "complexity": "simple|medium|complex|very complex",
  "agents_needed": 1-4,
  "tasks": [
    { "agent_id": 1, "task": "specific task", "model": "llama-3.3-70b-versatile" },
    { "agent_id": 2, "task": "specific task", "model": "moonshotai/kimi-k2-instruct" },
    { "agent_id": 3, "task": "specific task", "model": "llama-3.1-8b-instant" },
    { "agent_id": 4, "task": "specific task", "model": "groq/compound" }
  ],
  "synthesis_instructions": "how to combine results"
}

AVAILABLE MODELS (choose strategically):
- llama-3.3-70b-versatile: Deep reasoning, main analysis (30 RPM, 12K TPM)
- moonshotai/kimi-k2-instruct: Research, alternatives (60 RPM, 10K TPM)
- llama-3.1-8b-instant: Quick facts, speed (30 RPM, 6K TPM)
- groq/compound: Complex multi-step, long outputs (30 RPM, 70K TPM)

Return ONLY the JSON, nothing else.`

    const orchestratorResponse = await callGroqNonStreaming({
      message: orchestratorPrompt,
      systemPrompt: '',
      model: 'moonshotai/kimi-k2-instruct',
      conversationHistory: [],
      maxTokens: 2048
    })
    
    // Parse orchestrator plan
    let plan
    try {
      const jsonMatch = orchestratorResponse.text.match(/\{[\s\S]*\}/)
      plan = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      // Fallback to simple execution if JSON parsing fails
      console.log('⚠️ Orchestrator planning failed, using default 2-agent setup')
      onChunk && onChunk('⚠️ Using default 2-agent configuration\n\n')
      plan = {
        complexity: "medium",
        agents_needed: 2,
        tasks: [
          { agent_id: 1, task: `Analyze and respond to: ${message}`, model: "llama-3.3-70b-versatile" },
          { agent_id: 2, task: `Provide alternative perspective on: ${message}`, model: "llama-3.1-70b-versatile" }
        ],
        synthesis_instructions: "Combine both perspectives into a comprehensive answer"
      }
    }
    
    console.log(`[icon] Legion Plan: ${plan.agents_needed} agents, complexity: ${plan.complexity}`)
    
    // ═══════════════════════════════════════════════════════════
    // PHASE 2: PARALLEL AGENT EXECUTION
    // ═══════════════════════════════════════════════════════════
    
    const agentPromises = plan.tasks.map(async (task) => {
      console.log(`🤖 Spawning Agent ${task.agent_id} (${task.model})`)
      
      // CACHE-OPTIMIZED: Use same prefix for all agents
      const agentPrompt = `${CACHED_LEGION_CONTEXT}

ROLE: AGENT ${task.agent_id}

ASSIGNED TASK: ${task.task}

ORIGINAL USER REQUEST: "${message}"

Execute your specific task thoroughly and concisely. Focus only on your assigned responsibility.`
      
      try {
        // Use NON-STREAMING for parallel execution (streaming doesn't work well in parallel)
        const result = await callGroqNonStreaming({
          message: agentPrompt,
          systemPrompt: '',
          model: task.model,
          conversationHistory: [],
          maxTokens: 2048
        })
        
        console.log(`[icon] Agent ${task.agent_id} completed`)
        
        return {
          agent_id: task.agent_id,
          task: task.task,
          model: task.model,
          result: result.text
        }
      } catch (error) {
        console.error(`[icon] Agent ${task.agent_id} failed:`, error.message)
        const errorMsg = `[Agent ${task.agent_id} failed: ${error.message}]`
        return {
          agent_id: task.agent_id,
          task: task.task,
          model: task.model,
          result: errorMsg
        }
      }
    })
    
    // Wait for all agents to complete (PARALLEL EXECUTION!)
    const agentResults = await Promise.all(agentPromises)
    
    console.log('✅ All agents finished execution')
    
    // ═══════════════════════════════════════════════════════════
    // PHASE 3: SYNTHESIS
    // ═══════════════════════════════════════════════════════════
    
    // CACHE-OPTIMIZED: Use same prefix for synthesis
    const synthesisPrompt = `${CACHED_LEGION_CONTEXT}

ROLE: SYNTHESIS AI

Your job is to combine all agent outputs into ONE final, comprehensive response.

ORIGINAL USER REQUEST: "${message}"

AGENT OUTPUTS:
${agentResults.map(r => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT ${r.agent_id} (${r.model})
Task: ${r.task}
Output: ${r.result}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('\n')}

SYNTHESIS INSTRUCTIONS: ${plan.synthesis_instructions}

Tasks:
1. Combine all agent outputs intelligently
2. Resolve conflicts or contradictions
3. Remove redundancy
4. Create a coherent final answer
5. DO NOT mention agents, phases, or the Legion process

Provide the FINAL ANSWER:`

    const finalResult = await streamGroq({
      message: synthesisPrompt,
      systemPrompt: '',
      model: 'moonshotai/kimi-k2-instruct',
      onChunk: (chunk) => onChunk && onChunk(chunk),
      conversationHistory: [],
      maxTokens: null
    })
    
    console.log('✅ Legion Mode completed successfully!')
    
    // Build the legion process summary (everything except final answer)
    let legionProcess = `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" style="color: rgb(168, 85, 247);"><path fill="currentColor" d="M8.356 5H7.01L5 13h1.028l.464-1.875h2.316L9.26 13h1.062Zm-1.729 5.322L7.644 5.95h.045l.984 4.373ZM11.238 13V5h1v8Zm.187 1H4V4h10v4.78a5.5 5.5 0 0 1 4-.786V6h-2V4a2.006 2.006 0 0 0-2-2h-2V0h-2v2H8V0H6v2H4a2.006 2.006 0 0 0-2 2v2H0v2h2v2H0v2h2v2a2.006 2.006 0 0 0 2 2h2v2h2v-2h2v2h2v-1.992A5.6 5.6 0 0 1 11.425 14m2.075-.5A3.5 3.5 0 1 1 17 17a3.5 3.5 0 0 1-3.5-3.5M17 19c-2.336 0-7 1.173-7 3.5V24h14v-1.5c0-2.328-4.664-3.5-7-3.5"></path></svg><strong>LEGION MODE ACTIVATED</strong></div>\n\n`
    
    legionProcess += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" style="color: rgb(168, 85, 247);"><g fill="currentColor"><path d="M9.283 4.002V12H7.971V5.338h-.065L6.072 6.656V5.385l1.899-1.383z"></path><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"></path></g></svg><strong>Phase 1: Task Analysis</strong></div>\n`
    legionProcess += `Orchestrator analyzing request...\n\n`
    legionProcess += `<div style="display: flex; align-items: center; gap: 8px; margin: 12px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="color: rgb(168, 85, 247);"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="1.5" d="M12 12h10M12 5h10M12 19h10M2 5l2 2l4-4M4.806 16.776l-.377 1.508a.2.2 0 0 1-.145.145l-1.508.377c-.202.05-.202.337 0 .388l1.508.377a.2.2 0 0 1 .145.145l.377 1.508c.05.202.338.202.388 0l.377-1.508a.2.2 0 0 1 .145-.145l1.508-.377c.202-.05.202-.338 0-.388l-1.508-.377a.2.2 0 0 1-.145-.145l-.377-1.508c-.05-.202-.338-.202-.388 0m0-7l-.377 1.508a.2.2 0 0 1-.145.145l-1.508.377c-.202.05-.202.338 0 .388l1.508.377a.2.2 0 0 1 .145.145l.377 1.508c.05.202.338.202.388 0l.377-1.508a.2.2 0 0 1 .145-.145l1.508-.377c.202-.05.202-.338 0-.388l-1.508-.377a.2.2 0 0 1-.145-.145l-.377-1.508c-.05-.202-.338-.202-.388 0"></path></svg>Plan: ${plan.agents_needed} agents for ${plan.complexity} task</div>\n\n`
    
    legionProcess += `<div style="display: flex; align-items: center; gap: 8px; margin: 16px 0 12px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" style="color: rgb(168, 85, 247);"><g fill="currentColor"><path d="M6.646 6.24v.07H5.375v-.064c0-1.213.879-2.402 2.637-2.402c1.582 0 2.613.949 2.613 2.215c0 1.002-.6 1.667-1.287 2.43l-.096.107l-1.974 2.22v.077h3.498V12H5.422v-.832l2.97-3.293c.434-.475.903-1.008.903-1.705c0-.744-.557-1.236-1.313-1.236c-.843 0-1.336.615-1.336 1.306"></path><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"></path></g></svg><strong>Phase 2: Parallel Agent Execution</strong></div>\n\n`
    
    // Add agent headers
    plan.tasks.forEach((task) => {
      legionProcess += `<div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="color: rgb(168, 85, 247);"><path fill="currentColor" d="M21 11V9h-2V7a2.006 2.006 0 0 0-2-2h-2V3h-2v2h-2V3H9v2H7a2.006 2.006 0 0 0-2 2v2H3v2h2v2H3v2h2v2a2.006 2.006 0 0 0 2 2h2v2h2v-2h2v2h2v-2h2a2.006 2.006 0 0 0 2-2v-2h2v-2h-2v-2Zm-4 6H7V7h10Z"></path><path fill="currentColor" d="M11.361 8h-1.345l-2.01 8h1.027l.464-1.875h2.316L12.265 16h1.062Zm-1.729 5.324L10.65 8.95h.046l.983 4.374ZM14.244 8h1v8h-1z"></path></svg><strong>Agent ${task.agent_id}</strong> (${task.model})</div>\n*Task: ${task.task}*\n\n`
    })
    
    legionProcess += `---\n\n`
    
    // Add agent results with proper formatting
    agentResults.forEach((result) => {
      // Convert markdown to HTML and add proper spacing
      const formattedResult = result.result
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic
        .replace(/\n\n/g, '</p><p>') // Paragraphs
        .replace(/\n/g, '<br />') // Line breaks
      
      legionProcess += `<div style="margin: 16px 0; padding: 12px; background: rgba(168, 85, 247, 0.05); border-left: 3px solid rgb(168, 85, 247); border-radius: 4px;">\n`
      legionProcess += `<h4 style="margin: 0 0 8px 0; color: rgb(168, 85, 247);">Agent ${result.agent_id} Result:</h4>\n`
      legionProcess += `<div style="color: #e5e7eb; line-height: 1.6;"><p>${formattedResult}</p></div>\n`
      legionProcess += `</div>\n\n`
    })
    
    legionProcess += `<hr style="border: none; border-top: 1px solid #3f3f3f; margin: 20px 0;" />\n\n`
    legionProcess += `<div style="display: flex; align-items: center; gap: 8px; margin: 16px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" style="color: rgb(34, 197, 94);"><path fill="currentColor" d="M4.854 2.146a.5.5 0 0 1 0 .707l-2 2a.5.5 0 0 1-.707 0l-1-1a.5.5 0 0 1 .707-.707l.646.646l1.646-1.646a.5.5 0 0 1 .708 0M14.5 4h-8a.5.5 0 0 1 0-1h8a.5.5 0 0 1 0 1m-9.646 7.146a.5.5 0 0 1 0 .707l-2 2a.5.5 0 0 1-.707 0l-1-1a.5.5 0 0 1 .707-.707l.646.646l1.646-1.646a.5.5 0 0 1 .708 0M14.5 13h-8a.5.5 0 0 1 0-1h8a.5.5 0 0 1 0 1M4.854 6.646a.5.5 0 0 1 0 .707l-2 2a.5.5 0 0 1-.707 0l-1-1a.5.5 0 0 1 .707-.707l.646.646l1.646-1.646a.5.5 0 0 1 .708 0M14.5 8.5h-8a.5.5 0 0 1 0-1h8a.5.5 0 0 1 0 1"></path></svg><strong>All agents completed!</strong></div>\n\n`
    legionProcess += `<hr style="border: none; border-top: 2px solid #a855f7; margin: 24px 0;" />\n\n`
    legionProcess += `<div style="display: flex; align-items: center; gap: 8px; margin: 16px 0 8px 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 16 16" style="color: rgb(168, 85, 247);"><g fill="currentColor"><path d="M7.918 8.414h-.879V7.342h.838c.78 0 1.348-.522 1.342-1.237c0-.709-.563-1.195-1.348-1.195c-.79 0-1.312.498-1.348 1.055H5.275c.036-1.137.95-2.115 2.625-2.121c1.594-.012 2.608.885 2.637 2.062c.023 1.137-.885 1.776-1.482 1.875v.07c.703.07 1.71.64 1.734 1.917c.024 1.459-1.277 2.396-2.93 2.396c-1.705 0-2.707-.967-2.754-2.144H6.33c.059.597.68 1.06 1.541 1.066c.973.006 1.6-.563 1.588-1.354c-.006-.779-.621-1.318-1.541-1.318"></path><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"></path></g></svg><strong>Phase 3: Synthesis</strong></div>\n\n`
    legionProcess += `<div style="margin: 12px 0 16px 0; padding: 10px; background: rgba(168, 85, 247, 0.1); border-radius: 6px; color: #d1d5db; font-style: italic;">Combining outputs from ${plan.agents_needed} agents into a comprehensive answer...</div>\n\n`
    
    return {
      text: finalResult.text, // Only the final answer
      model: `Legion (${plan.agents_needed} agents)`,
      tokenCount: finalResult.tokenCount,
      latencyMs: finalResult.latencyMs,
      legionProcess: legionProcess // The full process
    }
    
  } catch (error) {
    console.error('❌ Legion mode failed:', error)
    
    // Graceful fallback - try single model instead of crashing
    try {
      onChunk && onChunk('\n⚠️ Legion mode encountered an error. Falling back to single model...\n\n')
      
      const result = await streamGroq({
        message,
        systemPrompt: PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.default,
        model: 'moonshotai/kimi-k2-instruct',
        onChunk: onChunk || (() => {}),
        conversationHistory,
        maxTokens: null
      })
      
      return { 
        text: result.text, 
        model: 'Kimi K2 (Legion fallback)', 
        tokenCount: result.tokenCount, 
        latencyMs: result.latencyMs 
      }
    } catch (fallbackError) {
      console.error('❌ Legion fallback also failed:', fallbackError)
      // Re-throw so the main error handler can catch it and trigger Groq fallback
      throw new Error(`Legion mode failed: ${error.message}. Fallback also failed: ${fallbackError.message}`)
    }
  }
}

/**
 * Main AI router with fallback logic
 * @param {string} message - User message
 * @param {Function} onChunk - Callback for streaming chunks (Groq only)
 * @param {string} mode - AI mode: 'instant', 'thinking', 'agent', or 'legion'
 * @param {Array} conversationHistory - Array of previous messages for context
 * @param {string} personality - AI personality type
 * @returns {Promise<{text: string, model: string}>}
 */
export async function routeAIRequest(message, onChunk = null, mode = 'thinking', conversationHistory = [], personality = 'default') {
  console.log(`🤖 Starting AI request routing (Mode: ${mode})...`)
  
  const config = MODEL_CONFIG[mode] || MODEL_CONFIG['thinking']
  
  // Special handling for Legion mode (multi-model)
  if (mode === 'legion') {
    try {
      return await routeLegionMode(message, onChunk, conversationHistory, personality)
    } catch (error) {
      console.error('❌ Legion mode completely failed:', error.message)
      // Continue to regular fallback chain
    }
  }
  
  // Get personality-based system prompt
  const systemPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.default
  
  // Try Groq first - primary AI provider
  let groqError = null
  try {
    console.log(`📡 Attempting Groq API with ${config.model} (${config.label} mode, ${personality} personality)...`)
    
    // Use non-streaming for Thinking mode to get reasoning
    if (mode === 'thinking') {
      console.log('🧠 Using non-streaming mode for reasoning support')
      const result = await callGroqNonStreaming({
        message,
        systemPrompt,
        model: config.model,
        conversationHistory,
        maxTokens: config.maxTokens,
        reasoningEffort: 'high',
        includeReasoning: true
      })
      console.log('✅ Groq succeeded with reasoning!')
      if (result.reasoning) {
        console.log('🧠 Reasoning received, length:', result.reasoning.length)
      }
      return { 
        text: result.text, 
        reasoning: result.reasoning,
        model: config.displayName, 
        tokenCount: result.tokenCount, 
        latencyMs: result.latencyMs 
      }
    }
    
    // Use streaming for other modes
    const groqOptions = {
      message,
      systemPrompt,
      model: config.model,
      onChunk: onChunk || (() => {}),
      conversationHistory,
      maxTokens: config.maxTokens
    }
    
    const result = await streamGroq(groqOptions)
    console.log('✅ Groq succeeded!')
    return { text: result.text, model: config.displayName, tokenCount: result.tokenCount, latencyMs: result.latencyMs }
  } catch (error) {
    groqError = error
    console.warn(`❌ Groq ${config.label} failed:`, groqError.message)
  }
  
  // All providers failed
  throw new Error('All AI services are currently unavailable. Please try again later.')
}






