import React, { useState, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?url'

// Configure PDF.js worker (local bundled worker for Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const UploadImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="14" height="14" x="5" y="5" rx="4"></rect>
    <path strokeLinecap="round" strokeLinejoin="round" d="m5.14 15.32l3.55-3.754A1.75 1.75 0 0 1 9.969 11c.479 0 .938.204 1.277.566L15.387 16m-1.806-1.934l1.432-1.533a1.75 1.75 0 0 1 1.277-.566c.48 0 .939.204 1.277.566l1.274 1.43m-5.063-4.63h.009"></path>
  </svg>
)

const InstantIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
  </svg>
)

const ThinkingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.852 14.772-.383.923"/>
    <path d="m10.852 9.228-.383-.923"/>
    <path d="m13.148 14.772.382.924"/>
    <path d="m13.531 8.305-.383.923"/>
    <path d="m14.772 10.852.923-.383"/>
    <path d="m14.772 13.148.923.383"/>
    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 0 0-5.63-1.446 3 3 0 0 0-.368 1.571 4 4 0 0 0-2.525 5.771"/>
    <path d="M17.998 5.125a4 4 0 0 1 2.525 5.771"/>
    <path d="M19.505 10.294a4 4 0 0 1-1.5 7.706"/>
    <path d="M4.032 17.483A4 4 0 0 0 11.464 20c.18-.311.892-.311 1.072 0a4 4 0 0 0 7.432-2.516"/>
    <path d="M4.5 10.291A4 4 0 0 0 6 18"/>
    <path d="M6.002 5.125a3 3 0 0 0 .4 1.375"/>
    <path d="m9.228 10.852-.923-.383"/>
    <path d="m9.228 13.148-.923.383"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const AgentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8"/>
    <rect width="16" height="12" x="4" y="8" rx="2"/>
    <path d="M2 14h2"/>
    <path d="M20 14h2"/>
    <path d="M15 13v2"/>
    <path d="M9 13v2"/>
  </svg>
)

const LegionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="7"/>
    <circle cx="15" cy="15" r="7"/>
  </svg>
)

const getModeIcon = (mode) => {
  switch(mode) {
    case 'instant': return <InstantIcon />
    case 'thinking': return <ThinkingIcon />
    case 'agent': return <AgentIcon />
    case 'legion': return <LegionIcon />
    default: return null
  }
}

export default function ChatInput({ onSendMessage, onSendImage, uploadsLeft, disabled, mode, onModeChange, proMaxUsesLeft, proLiteUsesLeft, isGuest = false, guestAirUsesLeft = 10, guestBaseUsesLeft = 10, tokenUsage = 0, tokenLimit = 30000, hasUnlimitedAccess = false }) {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(1)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [attachedImage, setAttachedImage] = useState(null) // Store selected image
  const [imagePreview, setImagePreview] = useState(null) // Preview URL
  const [attachedPDF, setAttachedPDF] = useState(null) // Store selected PDF
  const [extractedText, setExtractedText] = useState('') // Extracted PDF text
  const [isParsing, setIsParsing] = useState(false) // PDF parsing state
  const [parseError, setParseError] = useState(null) // PDF parse error
  const [showPDFText, setShowPDFText] = useState(false) // Show text modal
  const [pdfMetadata, setPdfMetadata] = useState(null) // { pages, words }
  const [cooldownSeconds, setCooldownSeconds] = useState(0) // Cooldown timer
  const fileInputRef = useRef(null)
  const pdfInputRef = useRef(null)
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
    // If there's an attached PDF, send it with extracted text
    else if (attachedPDF && extractedText && !disabled) {
      const pdfPrompt = message.trim()
        ? `PDF Content:\n${extractedText}\n\nUser Question: ${message.trim()}`
        : `PDF Content:\n${extractedText}\n\nPlease summarize this document.`
      
      onSendMessage(pdfPrompt)
      setMessage('')
      setRows(1)
      handleRemovePDF()

      if (['thinking', 'agent', 'legion'].includes(mode)) {
        setCooldownSeconds(5)
      }
    }
    // Otherwise send as regular text message
    else if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      setRows(1)

      if (['thinking', 'agent', 'legion'].includes(mode)) {
        setCooldownSeconds(5)
      }
    }
  }

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    setExtractedText('')
    setPdfMetadata(null)

    if (file.size > 10 * 1024 * 1024) {
      setParseError('PDF file is too large (max 10MB)')
      return
    }

    if (file.type !== 'application/pdf') {
      setParseError('Please upload a valid PDF file')
      return
    }

    setAttachedPDF(file)
    setIsParsing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const numPages = pdf.numPages

      let fullText = ''
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + '\n\n'
      }

      const wordCount = fullText.trim().split(/\s+/).filter(w => w.length > 0).length

      if (wordCount === 0) {
        setParseError('No text found. This might be a scanned PDF.')
        setIsParsing(false)
        return
      }

      setExtractedText(fullText.trim())
      setPdfMetadata({ pages: numPages, words: wordCount })
      setIsParsing(false)

      console.log('✅ PDF parsed:', { pages: numPages, words: wordCount })
    } catch (error) {
      console.error('❌ PDF parse error:', error)
      setParseError('Failed to parse PDF. File might be corrupted.')
      setIsParsing(false)
    }

    e.target.value = ''
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

  const handleRemovePDF = () => {
    setAttachedPDF(null)
    setExtractedText('')
    setPdfMetadata(null)
    setParseError(null)
    setShowPDFText(false)
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
  const [showUploadMenu, setShowUploadMenu] = useState(false)

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
    <div className="bg-[#121212] p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
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

          {/* PDF Preview */}
          {attachedPDF && (
            <div className="mb-3 bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                    <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                    <path d="M10 9H8"/>
                    <path d="M16 13H8"/>
                    <path d="M16 17H8"/>
                  </svg>
                  <div>
                    <div className="text-sm text-[#dbdbdb] font-medium">{attachedPDF.name}</div>
                    {pdfMetadata && (
                      <div className="text-xs text-gray-400">
                        {pdfMetadata.pages} pages • {pdfMetadata.words.toLocaleString()} words
                      </div>
                    )}
                    {isParsing && (
                      <div className="text-xs text-blue-400">Parsing PDF...</div>
                    )}
                    {parseError && (
                      <div className="text-xs text-red-400">{parseError}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {extractedText && !isParsing && (
                    <button
                      type="button"
                      onClick={() => setShowPDFText(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      View Text
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemovePDF}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1 relative" ref={modeMenuRef}>
              {/* Circular + button with upload menu */}
              <button
                type="button"
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                disabled={disabled || uploadsLeft === 0 || attachedImage !== null || attachedPDF !== null}
                className="absolute left-4 bottom-4 w-9 h-9 hover:bg-gray-700/50 text-gray-400 rounded-full border border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title={attachedImage || attachedPDF ? 'File already attached' : uploadsLeft + ' uploads remaining'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                {/* Upload count badge */}
                <span className="absolute -top-1 -right-1 bg-gray-700 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">{uploadsLeft}</span>
              </button>

              {/* Upload menu dropdown */}
              {showUploadMenu && (
                <div className="absolute bottom-16 left-4 w-48 bg-[#2f2f2f] border border-[#3f3f3f] rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click()
                        setShowUploadMenu(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#3f3f3f] transition-colors flex items-center gap-3"
                    >
                      <UploadImageIcon />
                      <span className="text-white text-sm">Upload image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        pdfInputRef.current?.click()
                        setShowUploadMenu(false)
                      }}
                      disabled={isParsing || attachedPDF}
                      className="w-full px-4 py-3 text-left hover:bg-[#3f3f3f] transition-colors flex items-center gap-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title={attachedPDF ? 'PDF already attached' : 'Upload PDF'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
                        <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                        <path d="M10 9H8"/>
                        <path d="M16 13H8"/>
                        <path d="M16 17H8"/>
                      </svg>
                      <span className="text-white text-sm">Upload PDF</span>
                    </button>
                  </div>
                )}

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
                placeholder={isTranscribing ? "Transcribing..." : attachedImage ? "Add a message about this image... (optional)" : "Ask me anything or upload an image to analyze..."}
                disabled={disabled || isTranscribing}
                rows={rows}
                style={{ minHeight: '120px' }}
                className="w-full pl-14 pr-24 py-4 border-2 border-[#2b2b2b] rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#1f1f1f] text-[#dbdbdb] placeholder-gray-500 resize-none text-base"
              />
              
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className={`absolute ${message.trim() ? 'right-28' : 'right-14'} bottom-4 px-4 py-2 rounded-full bg-transparent hover:bg-gray-700/50 text-[#dbdbdb] text-sm font-medium transition-colors flex items-center gap-2 border border-gray-600`}
                disabled={disabled}
              >
                {getModeIcon(mode)}
                <span>{currentMode.label}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModeMenu && (
                <div className="absolute bottom-12 right-14 min-w-64 max-w-xs bg-[#2f2f2f] border border-[#3f3f3f] rounded-lg shadow-lg overflow-hidden z-10">
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
                      <div className="flex-shrink-0 mt-1">
                        {getModeIcon(key)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{config.label}</span>
                          {config.badge && config.badge !== 'FREE' && config.badge !== 'PRO' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
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

              {/* Voice button - shows to the left of Send when user has text */}
              {message.trim() && !isRecording && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled || isTranscribing}
                  className="absolute right-16 bottom-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Voice input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 10v3"/>
                    <path d="M6 6v11"/>
                    <path d="M10 3v18"/>
                    <path d="M14 8v7"/>
                    <path d="M18 5v13"/>
                    <path d="M22 10v3"/>
                  </svg>
                </button>
              )}

              {/* Smart send/voice button */}
              <button
                type={message.trim() || attachedImage ? "submit" : "button"}
                onClick={!message.trim() && !attachedImage ? (isRecording ? stopRecording : startRecording) : undefined}
                disabled={disabled || (isTranscribing && !message.trim()) || ((message.trim() || attachedImage) && cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode))}
                className={
                  message.trim() || attachedImage
                    ? "absolute right-4 bottom-4 p-2 bg-[#dbdbdb] hover:bg-[#cfcfcf] text-[#121212] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    : 'absolute right-4 bottom-4 p-2 rounded-full transition-all ' + (isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700') + ' disabled:opacity-50 disabled:cursor-not-allowed'
                }
                title={
                  message.trim() || attachedImage 
                    ? (cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode) ? `Wait ${cooldownSeconds}s` : 'Send message')
                    : (isRecording ? 'Recording... ' + formatDuration(recordingDuration) : 'Voice input')
                }
              >
                {message.trim() || attachedImage ? (
                  cooldownSeconds > 0 && ['thinking', 'agent', 'legion'].includes(mode) ? (
                    <span className="text-xs font-bold">{cooldownSeconds}s</span>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4a1 1 0 0 1 .707.293l6 6a1 1 0 0 1-1.414 1.414L13 7.414V19a1 1 0 1 1-2 0V7.414l-4.293 4.293a1 1 0 0 1-1.414-1.414l6-6A1 1 0 0 1 12 4"/>
                    </svg>
                  )
                ) : isTranscribing ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isRecording ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 10v3"/>
                    <path d="M6 6v11"/>
                    <path d="M10 3v18"/>
                    <path d="M14 8v7"/>
                    <path d="M18 5v13"/>
                    <path d="M22 10v3"/>
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
          
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handlePDFUpload}
            className="hidden"
          />

          {isRecording && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Recording... {formatDuration(recordingDuration)}
            </div>
          )}

          {/* AI Warning Text */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            AI can make mistakes. Check important info. Please read{' '}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openAISafety'))}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              AI Safety guidelines
            </button>
            {' '}before use.
          </div>
        </div>

        {/* PDF Text Modal */}
        {showPDFText && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPDFText(false)}>
            <div className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-[#3f3f3f]">
                <h3 className="text-white font-semibold">Parsed PDF Text</h3>
                <button
                  type="button"
                  onClick={() => setShowPDFText(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh] text-sm text-[#dbdbdb] whitespace-pre-wrap">
                {extractedText || 'No text extracted.'}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}