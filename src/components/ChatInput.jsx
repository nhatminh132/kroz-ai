import React, { useState, useRef, useEffect } from 'react'

const UploadImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="14" height="14" x="5" y="5" rx="4"></rect>
    <path strokeLinecap="round" strokeLinejoin="round" d="m5.14 15.32l3.55-3.754A1.75 1.75 0 0 1 9.969 11c.479 0 .938.204 1.277.566L15.387 16m-1.806-1.934l1.432-1.533a1.75 1.75 0 0 1 1.277-.566c.48 0 .939.204 1.277.566l1.274 1.43m-5.063-4.63h.009"></path>
  </svg>
)

export default function ChatInput({ onSendMessage, onSendImage, uploadsLeft, disabled, mode, onModeChange, proMaxUsesLeft, proLiteUsesLeft, isGuest = false, guestAirUsesLeft = 10, guestBaseUsesLeft = 10, tokenUsage = 0, tokenLimit = 30000, hasUnlimitedAccess = false }) {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(1)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [attachedImage, setAttachedImage] = useState(null) // Store selected image
  const [imagePreview, setImagePreview] = useState(null) // Preview URL
  const [cooldownSeconds, setCooldownSeconds] = useState(0) // Cooldown timer
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const modeMenuRef = useRef(null)

  useEffect(() => {
    const lines = message.split('\n').length
    setRows(Math.min(lines, 5))
  }, [message])

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Check cooldown for non-instant modes
    if (cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode)) {
      return
    }
    
    // If there's an attached image, send it with the message
    if (attachedImage && !disabled) {
      onSendImage(attachedImage, message.trim())
      setMessage('')
      setAttachedImage(null)
      setImagePreview(null)
      setRows(1)
      
      // Start cooldown for non-instant modes
      if (['thinking', 'agent', 'legion'].includes(mode)) {
        setCooldownSeconds(5)
      }
    }
    // Otherwise send as regular text message
    else if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      setRows(1)
      
      // Start cooldown for non-instant modes
      if (['thinking', 'agent', 'legion'].includes(mode)) {
        setCooldownSeconds(5)
      }
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file && uploadsLeft > 0) {
      // Store the file and create a preview
      setAttachedImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target.result)
      }
      reader.readAsDataURL(file)
      e.target.value = ''
      
      // Focus on textarea so user can type
      textareaRef.current?.focus()
    } else if (uploadsLeft === 0) {
      alert('You have used all your image uploads for today!')
    }
  }

  const handlePaste = (e) => {
    if (disabled || uploadsLeft === 0) return

    const items = e.clipboardData?.items
    if (!items) return

    const imageItem = Array.from(items).find(item => item.type.startsWith('image/'))
    if (!imageItem) return

    const file = imageItem.getAsFile()
    if (!file) return

    // Prevent default paste (we want image preview instead)
    e.preventDefault()

    // Replace existing image if one is already attached
    setAttachedImage(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target.result)
    }
    reader.readAsDataURL(file)
  }
  
  const handleRemoveImage = () => {
    setAttachedImage(null)
    setImagePreview(null)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  const modeConfig = isGuest ? {
    instant: { label: 'Kroz Instant', description: `Quick responses (${guestAirUsesLeft}/10 left)`, disabled: guestAirUsesLeft <= 0 },
    thinking: { label: 'Kroz Thinking', description: `Deep reasoning (${guestBaseUsesLeft}/10 left)`, disabled: guestBaseUsesLeft <= 0 }
  } : hasUnlimitedAccess ? {
    instant: { label: 'Kroz Instant', description: 'Lightning-fast responses', badge: 'UNLIMITED' },
    thinking: { label: 'Kroz Thinking', description: 'Deep reasoning for complex problems', badge: 'UNLIMITED' },
    agent: { label: 'Kroz Agent', description: 'Research, writing docs & presentations', badge: 'UNLIMITED' },
    legion: { label: 'Kroz Legion', description: 'Multi-AI collaboration for best results', badge: 'BETA' }
  } : {
    instant: { label: 'Kroz Instant', description: 'Lightning-fast responses', badge: 'FREE' },
    thinking: { label: 'Kroz Thinking', description: 'Deep reasoning for complex problems', badge: 'FREE' },
    agent: { label: 'Kroz Agent', description: `Research & writing • ${proLiteUsesLeft}/50 left`, badge: 'PRO' },
    legion: { label: 'Kroz Legion', description: `Multi-AI collaboration • ${proMaxUsesLeft}/10 left`, badge: 'PRO' }
  }

  const currentMode = modeConfig[mode]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const audioChunks = []

      recorder.ondataavailable = (e) => audioChunks.push(e.data)
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        setIsTranscribing(true)
        
        stream.getTracks().forEach(track => track.stop())

        try {
          const formData = new FormData()
          formData.append('file', audioBlob, 'recording.webm')
          formData.append('model', 'whisper-large-v3-turbo')
          formData.append('language', 'en')
          formData.append('response_format', 'json')

          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + import.meta.env.VITE_GROQ_API_KEY
            },
            body: formData
          })

          if (!response.ok) throw new Error('Transcription failed')

          const data = await response.json()
          setMessage(prev => prev + (prev ? ' ' : '') + data.text)
          textareaRef.current?.focus()
        } catch (error) {
          console.error('Transcription error:', error)
          alert('Failed to transcribe audio. Please try again.')
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingStartTime(Date.now())
    } catch (error) {
      console.error('Recording error:', error)
      alert('Could not access microphone. Please grant permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setRecordingStartTime(null)
    }
  }

  const [recordingDuration, setRecordingDuration] = useState(0)

  useEffect(() => {
    let interval
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTime) / 1000))
      }, 100)
    } else {
      setRecordingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isRecording, recordingStartTime])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins + ':' + secs.toString().padStart(2, '0')
  }

  return (
    <div className="border-t border-[#3f3f3f] bg-[#121212] p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 rounded-lg border border-gray-600"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1 relative" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploadsLeft === 0 || attachedImage !== null}
                className="absolute left-3 bottom-3 p-1.5 hover:opacity-80 text-gray-400 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title={attachedImage ? 'Image already attached' : uploadsLeft === 0 ? 'No uploads remaining today' : uploadsLeft + ' uploads remaining'}
              >
                <UploadImageIcon />
                <span className="absolute -top-1 -right-1 bg-gray-700 dark:bg-gray-400 text-white dark:text-gray-900 px-1.5 py-0.5 rounded-full text-xs font-bold">{uploadsLeft}</span>
              </button>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder={isTranscribing ? "Transcribing..." : attachedImage ? "Add a message about this image... (optional)" : "Ask me anything... (Shift+Enter for new line)"}
                disabled={disabled || isTranscribing}
                rows={rows}
                className="w-full pl-14 pr-24 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-[#1f1f1f] text-white resize-none"
              />
              
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="absolute right-28 bottom-3 px-4 py-2 rounded-full bg-transparent hover:bg-gray-700/50 text-white text-sm font-medium transition-colors flex items-center gap-2 border border-gray-600"
                disabled={disabled}
              >
                <span>{currentMode.label}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModeMenu && (
                <div className="absolute bottom-12 right-28 min-w-64 max-w-xs bg-[#2f2f2f] border border-[#3f3f3f] rounded-lg shadow-lg overflow-hidden z-10">
                  {Object.entries(modeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (!config.disabled) {
                          onModeChange(key)
                          setShowModeMenu(false)
                        }
                      }}
                      className={'w-full px-4 py-3 text-left transition-colors flex items-start gap-3 ' + 
                        (config.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3f3f3f]') + ' ' +
                        (mode === key ? 'bg-[#3f3f3f]' : '')}
                      disabled={disabled || config.disabled}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{config.label}</span>
                          {config.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              config.badge === 'FREE' ? 'bg-green-600 text-white' :
                              config.badge === 'PRO' ? 'bg-blue-600 text-white' :
                              config.badge === 'UNLIMITED' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                              'bg-purple-600 text-white'
                            }`}>
                              {config.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{config.description}</div>
                      </div>
                      {mode === key && (
                        <svg className="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled || isTranscribing}
                className={'absolute right-14 bottom-3 p-2 rounded-lg transition-all ' + (isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500') + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                title={isRecording ? 'Recording... ' + formatDuration(recordingDuration) : 'Voice input'}
              >
                {isTranscribing ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isRecording ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12a1 1 0 0 0 14 0m-7 7v4m-4 0h8M9 12a1 1 0 0 0 6 0V4a1 1 0 0 0-6 0Z"/>
                  </svg>
                )}
              </button>

              <button
                type="submit"
                disabled={disabled || (!message.trim() && !attachedImage) || (cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode))}
                className="absolute right-3 bottom-3 p-2 bg-gray-800 dark:bg-gray-200 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode) ? `Wait ${cooldownSeconds}s` : ''}
              >
                {cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode) ? (
                  <span className="text-xs font-bold">{cooldownSeconds}s</span>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4a1 1 0 0 1 .707.293l6 6a1 1 0 0 1-1.414 1.414L13 7.414V19a1 1 0 1 1-2 0V7.414l-4.293 4.293a1 1 0 0 1-1.414-1.414l6-6A1 1 0 0 1 12 4"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {isRecording && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Recording... {formatDuration(recordingDuration)}
            </div>
          )}

          {/* Token Usage RGB Bar - Only for instant mode */}
          {!isGuest && tokenUsage > 0 && mode === 'instant' && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500">Limit:</span>
              <div className="w-24 h-2 rounded-full overflow-hidden bg-gray-700">
                <div 
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min((tokenUsage / tokenLimit) * 100, 100)}%`,
                    background: tokenUsage / tokenLimit > 0.9 
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                      : tokenUsage / tokenLimit > 0.7 
                        ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                        : 'linear-gradient(90deg, #22c55e, #16a34a, #3b82f6)'
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* AI Warning Text & Made By */}
          <div className="mt-2 text-xs text-gray-500 text-center flex flex-col gap-1">
            <div>
              AI can make mistakes. Check important info. Please read{' '}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openAISafety'))}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                AI Safety guidelines
              </button>
              {' '}before use.
            </div>
            <div className="text-gray-600">
              Made by{' '}
              <a 
                href="https://iamnhatminh.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white font-semibold hover:text-white transition-all"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.4)',
                  animation: 'glow 2s ease-in-out infinite alternate'
                }}
              >
                Nhat Minh
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}