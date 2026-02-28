import React from 'react'

export default function AISafetyModal({ onAccept, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f2f2f] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#2f2f2f] border-b border-[#4a4a4a] p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16" className="text-yellow-500">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
            </svg>
            Important: AI Safety Guidelines
          </h2>
          <p className="text-gray-400 mt-2">Please read these guidelines before using Kroz</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-gray-300">
          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-yellow-500/30">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-yellow-500">⚠️</span>
              AI Can Make Mistakes
            </h3>
            <p className="text-sm">
              This AI is powered by advanced language models, but it can still produce incorrect, misleading, 
              or outdated information. Always verify important facts from reliable sources.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-white">What You Should Know:</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-red-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Not Medical/Legal Advice:</strong> Don't use AI responses 
                  for medical diagnosis, legal advice, or financial decisions. Consult qualified professionals.
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-red-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Verify Critical Information:</strong> Always double-check 
                  facts, dates, statistics, and technical details from authoritative sources.
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-red-400 mt-1">•</span>
                <div>
                  <strong className="text-white">No Real-Time Data:</strong> The AI's knowledge may be 
                  outdated. It doesn't have access to current events or real-time information.
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-red-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Biases May Exist:</strong> AI can reflect biases from 
                  its training data. Use critical thinking when evaluating responses.
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-red-400 mt-1">•</span>
                <div>
                  <strong className="text-white">Privacy Matters:</strong> Don't share sensitive personal 
                  information, passwords, or confidential data in conversations.
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <strong className="text-white">Best Use Cases:</strong> Learning, brainstorming, writing 
                  assistance, coding help, creative projects, and general information.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <p className="text-sm text-blue-200">
              <strong>Remember:</strong> AI is a helpful tool, not a replacement for human expertise, 
              judgment, or professional advice. Use it wisely and responsibly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#2f2f2f] border-t border-[#4a4a4a] p-6 flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            I Understand - Continue
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
