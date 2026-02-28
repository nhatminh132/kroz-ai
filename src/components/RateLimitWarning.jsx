import React from 'react'

export default function RateLimitWarning({ onClose, mode, retryAfter }) {
  const modeInfo = {
    instant: {
      name: 'Instant Mode',
      limit: '6,000 TPM',
      color: 'blue',
      description: 'Lightweight models for quick responses'
    },
    thinking: {
      name: 'Thinking Mode',
      limit: '30,000 TPM',
      color: 'green',
      description: 'Balanced models for most tasks'
    },
    agent: {
      name: 'Agent Mode',
      limit: '30,000 TPM',
      color: 'purple',
      description: 'Advanced models for complex tasks'
    },
    legion: {
      name: 'Legion Mode',
      limit: '30,000 TPM',
      color: 'pink',
      description: 'Multi-agent system for advanced tasks'
    }
  }

  const info = modeInfo[mode] || modeInfo.thinking

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full bg-${info.color}-500 bg-opacity-20`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className={`text-${info.color}-500`} viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">
          Rate Limit Reached
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-center mb-4">
          You've reached the token limit for <span className={`font-semibold text-${info.color}-400`}>{info.name}</span>
        </p>

        {/* Info Box */}
        <div className="bg-[#121212] rounded-lg p-4 mb-4 border border-[#4a4a4a]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className={`font-semibold text-${info.color}-400`}>{info.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Token Limit:</span>
              <span className="text-white font-mono">{info.limit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Retry After:</span>
              <span className="text-white font-mono">{retryAfter || '~1 minute'}</span>
            </div>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
            </svg>
            Helpful Tips
          </h4>
          <ul className="text-xs text-gray-300 space-y-1 ml-5">
            <li className="list-disc">TPM = Tokens Per Minute (rate limiting by API)</li>
            <li className="list-disc">Wait a minute before sending your next message</li>
            <li className="list-disc">Try shortening your prompts to use fewer tokens</li>
            <li className="list-disc">Switch modes if you need different token limits</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-medium"
          >
            Got it
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Rate limits help ensure fair usage for all users
        </p>
      </div>
    </div>
  )
}
