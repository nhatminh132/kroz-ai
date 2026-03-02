import React, { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabaseClient'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import BookmarkButton from './BookmarkButton'
import CodeBlock from './CodeBlock'
import TypingEffect from './TypingEffect'

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
    <path d="M371.31-230q-41.03 0-69.67-28.64T273-328.31v-463.38q0-41.03 28.64-69.67T371.31-890h343.38q41.03 0 69.67 28.64T813-791.69v463.38q0 41.03-28.64 69.67T714.69-230H371.31Zm0-86h343.38q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-463.38q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H371.31q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v463.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85Zm-166 252q-41.03 0-69.67-28.64T107-162.31v-549.38h86v549.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h429.38v86H205.31ZM359-316v-488 488Z"/>
  </svg>
)

export default function ChatMessage({ message, isUser, model, isStreaming, messageIndex, conversationId, userId, tokenCount, latencyMs, reasoning, legionProcess, imagePath, imageUrl, imageExpiresAt, imageExpired, onEdit, onRegenerate, isBookmarked = false, onBookmarkChange }) {
  const [showLinkWarning, setShowLinkWarning] = useState(false)
  const [pendingLink, setPendingLink] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message)
  const [showReasoning, setShowReasoning] = useState(false)
  const [showLegionProcess, setShowLegionProcess] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [isFetchingTTS, setIsFetchingTTS] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const audioRef = useRef(null)

  const TTS_CACHE_KEY = 'tts_cache_v1'
  const TTS_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000
  const TTS_BUCKET = 'tts-cache'

  const normalizeMath = (text) => {
    if (!text) return text
    return text
      .replace(/\\\[/g, '$$')
      .replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$')
  }

  const formattedMessage = isUser ? message : normalizeMath(message)
  
  const loadTtsCache = () => {
    try {
      return JSON.parse(localStorage.getItem(TTS_CACHE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  const saveTtsCache = (cache) => {
    localStorage.setItem(TTS_CACHE_KEY, JSON.stringify(cache))
  }

  const hashMessage = async (text) => {
    const data = new TextEncoder().encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const cleanupExpiredCache = async (cacheKey, cacheEntry) => {
    if (!cacheEntry?.path) return
    try {
      await supabase.storage.from(TTS_BUCKET).remove([cacheEntry.path])
    } catch (error) {
      console.warn('Failed to remove expired TTS audio:', error)
    }
  }

  const getCachedAudioUrl = async () => {
    const cache = loadTtsCache()
    const key = await hashMessage(message)
    const entry = cache[key]
    if (!entry) return null

    const isExpired = Date.now() - entry.createdAt > TTS_CACHE_TTL_MS
    if (isExpired) {
      delete cache[key]
      saveTtsCache(cache)
      await cleanupExpiredCache(key, entry)
      return null
    }

    return entry.url || null
  }

  const cacheAudio = async (blob) => {
    const key = await hashMessage(message)
    const filePath = `tts/${key}.wav`

    try {
      const { error } = await supabase.storage.from(TTS_BUCKET).upload(filePath, blob, {
        contentType: 'audio/wav',
        upsert: true
      })

      if (error) {
        console.warn('TTS cache upload failed:', error)
        return null
      }

      const { data } = supabase.storage.from(TTS_BUCKET).getPublicUrl(filePath)
      const url = data?.publicUrl
      if (!url) return null

      const cache = loadTtsCache()
      cache[key] = { url, createdAt: Date.now(), path: filePath }
      saveTtsCache(cache)

      return url
    } catch (error) {
      console.warn('TTS cache error:', error)
      return null
    }
  }

  const playAudio = (url) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onended = () => {
      setIsReading(false)
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
      setAudioUrl(null)
      setIsFetchingTTS(false)
    }

    audio.onerror = () => {
      setIsReading(false)
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
      setAudioUrl(null)
      setIsFetchingTTS(false)
      fallbackToSpeechSynthesis(true)
    }

    audio.play()
  }

  const fallbackToSpeechSynthesis = (silent = false) => {
    if (!('speechSynthesis' in window)) {
      if (!silent) alert('Read aloud is not supported in this browser')
      return false
    }

    try {
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.onend = () => setIsReading(false)
      utterance.onerror = () => setIsReading(false)
      setIsReading(true)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      return true
    } catch (error) {
      console.error('SpeechSynthesis error:', error)
      setIsReading(false)
      if (!silent) alert('Read aloud feature is temporarily unavailable')
      return false
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setShowCopyNotification(true)
    setTimeout(() => setShowCopyNotification(false), 2000)
  }

  const handleReadAloud = async () => {
    if (isFetchingTTS) return

    if (isReading) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      window.speechSynthesis.cancel()
      setIsReading(false)
      return
    }

    setIsFetchingTTS(true)

    try {
      const cachedUrl = await getCachedAudioUrl()
      if (cachedUrl) {
        setAudioUrl(cachedUrl)
        setIsReading(true)
        playAudio(cachedUrl)
        return
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
      })

      if (!response.ok) {
        throw new Error('TTS API failed')
      }

      const audioBlob = await response.blob()
      const cached = await cacheAudio(audioBlob)
      const url = cached || URL.createObjectURL(audioBlob)

      if (!cached) {
        setAudioUrl(url)
      }

      setIsReading(true)
      playAudio(url)
    } catch (error) {
      console.error('Error with read aloud:', error)
      setIsReading(false)
      setIsFetchingTTS(false)
      const usedFallback = fallbackToSpeechSynthesis(true)
      if (!usedFallback) {
        alert('Read aloud feature is temporarily unavailable')
      }
    }
  }

  const handleLinkClick = (e) => {
    if (!isUser) {
      e.preventDefault()
      setPendingLink(e.currentTarget.href)
      setShowLinkWarning(true)
    }
  }

  const confirmOpenLink = () => {
    window.open(pendingLink, '_blank', 'noopener,noreferrer')
    setShowLinkWarning(false)
    setPendingLink('')
  }

  const cancelOpenLink = () => {
    setShowLinkWarning(false)
    setPendingLink('')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editedMessage.trim() && editedMessage !== message) {
      onEdit?.(editedMessage, messageIndex)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedMessage(message)
    setIsEditing(false)
  }

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-[#2f2f2f] text-white'
              : 'text-gray-300'
          }`}
        >
          {!isUser && model && (
            <div className="text-xs font-semibold mb-2 opacity-70 flex items-center gap-1 whitespace-nowrap">
              {isStreaming ? (
                <>
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  <span>Using {model}</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Used {model}</span>
                </>
              )}
            </div>
          )}
          <div className="prose prose-sm prose-invert max-w-none break-words overflow-wrap-anywhere">
            {isUser && imageUrl && !imageExpired && (
              <div className="mb-3">
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="max-w-full rounded-lg border border-[#3f3f3f]"
                />
                {imageExpiresAt && (
                  <div className="mt-1 text-xs text-gray-500">
                    Image stored until {new Date(imageExpiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {isUser && imageExpired && (
              <div className="mb-3 p-3 border border-yellow-500/40 bg-yellow-500/10 text-yellow-200 text-sm rounded-lg">
                This image expired after 5 days and is no longer available.
              </div>
            )}

            {isUser ? (
              isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                    >
                      Send Edited
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="m-0 whitespace-pre-wrap">{message}</p>
              )
            ) : (
                <>
                  <style>{`
                    .prose table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1em 0;
                    }
                    .prose th {
                      background-color: #3f3f3f;
                      border: 1px solid #666;
                      padding: 0.75rem;
                      text-align: left;
                      font-weight: bold;
                    }
                    .prose td {
                      border: 1px solid #666;
                      padding: 0.75rem;
                    }
                    .prose tr:nth-child(even) {
                      background-color: #2a2a2a;
                    }
                    /* Remove default borders from headings */
                    .prose h1,
                    .prose h2,
                    .prose h3,
                    .prose h4,
                    .prose h5,
                    .prose h6 {
                      border-bottom: none !important;
                      padding-bottom: 0 !important;
                    }
                    /* Remove horizontal rules (lines) from AI responses */
                    .prose hr {
                      display: none !important;
                    }
                  `}</style>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      a: ({node, ...props}) => (
                        <a {...props} onClick={handleLinkClick} className="text-blue-400 hover:underline cursor-pointer" />
                      ),
                      code: ({node, inline, className, children, ...props}) => (
                        <CodeBlock inline={inline} className={className} {...props}>
                          {children}
                        </CodeBlock>
                      )
                    }}
                  >
                    {formattedMessage}
                  </ReactMarkdown>
                </>
              )}
          </div>
          
          {/* Metadata for AI messages */}
          {!isUser && !isStreaming && (tokenCount || latencyMs || model) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {model && model.includes("GPT") && (
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className={`flex items-center gap-1 transition ${reasoning ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 cursor-not-allowed'}`}
                  title={reasoning ? "View AI reasoning process" : "No reasoning available"}
                  disabled={!reasoning}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
                    <path fill="currentColor" d="M0 12h3v-1H1v-1h2v1h1v-1h2V9H1V7H0Zm6 0h3v-1H6ZM1 6h1V3H1Zm3 2h3V7H4Zm5 3h1v-1H9ZM7 9h1V8H7ZM2 3h1V2H2Zm2 2h1V3H4Zm3 0h1V3H7Zm3 5h1V3h-1ZM3 2h6V1H3Zm6 1h1V2H9Zm0 0"/>
                  </svg>
                  <span>{showReasoning ? 'Hide' : 'Show'} Thinking</span>
                </button>
              )}
              {model && model.includes("Legion") && (
                <button
                  onClick={() => setShowLegionProcess(!showLegionProcess)}
                  className={`flex items-center gap-1 transition ${legionProcess ? 'text-purple-400 hover:text-purple-300' : 'text-gray-500 cursor-not-allowed'}`}
                  title={legionProcess ? "View Legion multi-agent process" : "No Legion process available"}
                  disabled={!legionProcess}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
                  </svg>
                  <span>{showLegionProcess ? 'Hide' : 'Show'} Legion Process</span>
                </button>
              )}
              {tokenCount && (
                <div className="flex items-center gap-1" title="Approximate token count">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                  <span>{tokenCount.toLocaleString()} tokens</span>
                </div>
              )}
              {latencyMs && (
                <div className="flex items-center gap-1" title="Response time">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                  </svg>
                  <span>{(latencyMs / 1000).toFixed(2)}s</span>
                </div>
              )}
            </div>
          )}

          {/* Reasoning Display */}
          {!isUser && reasoning && showReasoning && (
            <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#3f3f3f] rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                <span>AI Thinking Process</span>
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {reasoning}
              </div>
            </div>
          )}

          {/* Legion Process Display */}
          {!isUser && legionProcess && showLegionProcess && (
            <div className="mt-3 p-3 bg-[#1a1a1a] border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"/>
                </svg>
                <span>Legion Multi-Agent Process</span>
              </div>
              <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: legionProcess }}>
              </div>
            </div>
          )}

          {/* Action Buttons for User messages */}
          {isUser && !isEditing && (
            <div className="flex items-center gap-2 mt-2 ml-2">
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 transition"
                title="Edit and resend"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                </svg>
              </button>
              <button
                onClick={() => handleCopy(message)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 transition"
                title="Copy to clipboard"
              >
                <CopyIcon />
              </button>
            </div>
          )}

          {/* Action Buttons for AI messages */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 mt-2 ml-2">
              <BookmarkButton
                messageText={message}
                messageIndex={messageIndex}
                conversationId={conversationId}
                userId={userId}
                isBookmarked={isBookmarked}
                onBookmarkChange={onBookmarkChange}
              />
              <button
                onClick={() => handleCopy(message)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 transition"
                title="Copy to clipboard"
              >
                <CopyIcon />
              </button>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(messageIndex)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 transition"
                  title="Regenerate response"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                  </svg>
                </button>
              )}
              <button
                onClick={handleReadAloud}
                className={`p-1.5 rounded-lg transition ${isReading ? 'text-green-400 hover:text-green-500' : 'text-gray-400 hover:text-green-400'}`}
                title={isReading ? "Stop reading" : "Read aloud"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                  <path d="M166.31-68q-41.92 0-70.12-28.19Q68-124.39 68-166.31v-627.38q0-41.92 28.19-70.12Q124.39-892 166.31-892h304.15l-86 86H166.31q-5.39 0-8.85 3.46t-3.46 8.85v627.38q0 5.39 3.46 8.85t8.85 3.46h427.38q5.39 0 8.85-3.46t3.46-8.85V-244h86v77.69q0 41.92-28.19 70.12Q635.61-68 593.69-68H166.31ZM244-244v-60h272v60H244Zm0-115.39v-59.99h192v59.99H244Zm378-9L458.23-532.15H336v-206h122.23L622-901.92v533.53Zm54-116.15v-301.23q45.31 27.62 70.65 68.39Q772-676.61 772-635.15t-25.54 82.23q-25.54 40.77-70.46 68.38Zm0 158.69v-89.23q65.77-27.3 107.88-87.46Q826-562.69 826-635.15q0-72.46-42.12-132.62-42.11-60.15-107.88-87.46v-89.23q101.92 31.92 168.96 117.12Q912-742.15 912-635.15t-67.04 192.19Q777.92-357.77 676-325.85Z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Copy Notification */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
          </svg>
          Copied!
        </div>
      )}

      {/* Warning Modal */}
      {showLinkWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelOpenLink}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md mx-4 border border-[#3f3f3f]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-3">⚠️ AI-Generated Link Warning</h3>
            <p className="text-gray-300 mb-4">
              This link was generated by AI and may not be accurate or safe. Please verify the destination before proceeding.
            </p>
            <p className="text-sm text-gray-400 mb-4 break-all">
              <strong>URL:</strong> {pendingLink}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelOpenLink}
                className="px-4 py-2 bg-[#3f3f3f] hover:bg-[#4f4f4f] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmOpenLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Open Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



