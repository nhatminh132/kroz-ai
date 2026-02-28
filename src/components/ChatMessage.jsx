import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import BookmarkButton from './BookmarkButton'
import CodeBlock from './CodeBlock'

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <path d="M17.25 8.5h-7a1.75 1.75 0 0 0-1.75 1.75v7c0 .966.784 1.75 1.75 1.75h7A1.75 1.75 0 0 0 19 17.25v-7a1.75 1.75 0 0 0-1.75-1.75"></path>
    <path d="M15.5 8.5V6.75A1.75 1.75 0 0 0 13.75 5h-7A1.75 1.75 0 0 0 5 6.75v7a1.75 1.75 0 0 0 1.75 1.75H8.5M12 12h3.5M12 15.5h3.5"></path>
  </svg>
)

export default function ChatMessage({ message, isUser, model, isStreaming, messageIndex, conversationId, userId, tokenCount, latencyMs, reasoning, legionProcess, imagePath, imageUrl, imageExpiresAt, imageExpired, onEdit }) {
  const [showLinkWarning, setShowLinkWarning] = useState(false)
  const [pendingLink, setPendingLink] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message)
  const [showReasoning, setShowReasoning] = useState(false)
  const [showLegionProcess, setShowLegionProcess] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)

  const normalizeMath = (text) => {
    if (!text) return text
    return text
      .replace(/\\\[/g, '$$')
      .replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$')
  }

  const formattedMessage = isUser ? message : normalizeMath(message)
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setShowCopyNotification(true)
    setTimeout(() => setShowCopyNotification(false), 2000)
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
                isBookmarked={false}
              />
              <button
                onClick={() => handleCopy(message)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 transition"
                title="Copy to clipboard"
              >
                <CopyIcon />
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



