import React, { useState } from 'react'

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <path d="M17.25 8.5h-7a1.75 1.75 0 0 0-1.75 1.75v7c0 .966.784 1.75 1.75 1.75h7A1.75 1.75 0 0 0 19 17.25v-7a1.75 1.75 0 0 0-1.75-1.75"></path>
    <path d="M15.5 8.5V6.75A1.75 1.75 0 0 0 13.75 5h-7A1.75 1.75 0 0 0 5 6.75v7a1.75 1.75 0 0 0 1.75 1.75H8.5M12 12h3.5M12 15.5h3.5"></path>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
    <path d="M20 6L9 17l-5-5"></path>
  </svg>
)

export default function CodeBlock({ children, className, inline }) {
  const [copied, setCopied] = useState(false)

  // Extract language from className (e.g., "language-javascript")
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''

  const handleCopy = () => {
    const code = children?.toString() || ''
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // For inline code, return simple styling
  if (inline) {
    return (
      <code className="px-1.5 py-0.5 bg-[#1e1e1e] text-[#f8f8f2] rounded text-sm font-mono">
        {children}
      </code>
    )
  }

  // For code blocks
  return (
    <div className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e] border border-[#3f3f3f]">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3f3f3f]">
        <span className="text-xs text-gray-400 font-semibold uppercase">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-[#3f3f3f] rounded transition"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="p-4 m-0">
          <code className={`${className} text-sm font-mono text-[#f8f8f2]`}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  )
}
