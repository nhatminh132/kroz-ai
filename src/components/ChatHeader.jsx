import React from 'react'

export default function ChatHeader({ onToggleSidebar, sidebarMinimized, isTemporaryChat, onToggleTemporaryChat, isGuest = false, onGenerateSummary, hasMessages = false, onShowLogin }) {

  return (
    <header className="bg-[#121212] border-b border-[#3f3f3f] p-4">
      <div className="w-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-[#2f2f2f] hover:bg-[#3f3f3f] transition text-white flex items-center justify-center"
            title={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
            style={{ minWidth: '36px', minHeight: '36px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <path d="M9 3v18"/>
            </svg>
          </button>

          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Cascadia Mono, monospace', letterSpacing: '1px' }}>
            Kroz
          </h1>

          {/* Guest Auth Buttons */}
          {isGuest && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={onShowLogin}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm"
              >
                Sign In
              </button>
              <button
                onClick={onShowLogin}
                className="px-4 py-2 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors text-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Summary Generator Button */}
          {!isGuest && hasMessages && onGenerateSummary && (
            <button
              onClick={onGenerateSummary}
              className="p-2 rounded-lg bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white transition"
              title="Generate conversation summary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10 0a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1z"/>
                <path d="M4 4.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5"/>
              </svg>
            </button>
          )}

          {/* Temporary Chat Toggle Button */}
          {!isGuest && onToggleTemporaryChat && (
            <button
              onClick={onToggleTemporaryChat}
              className={`p-2 rounded-lg transition ${
                isTemporaryChat 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white'
              }`}
              title={isTemporaryChat ? 'Exit temporary chat' : 'Start temporary chat'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <defs><mask id="tempChatMask"><g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><g stroke="#fff"><path strokeDasharray="70" d="M3 19.5v-15.5c0 -0.55 0.45 -1 1 -1h16c0.55 0 1 0.45 1 1v12c0 0.55 -0.45 1 -1 1h-14.5Z"/><g strokeDasharray="10" strokeDashoffset="10"><path d="M8 7h8"/><path d="M8 10h8"/></g><path strokeDasharray="6" strokeDashoffset="6" d="M8 13h4"/></g><path stroke="#000" strokeDasharray="28" strokeDashoffset="28" d="M-1 11h26" transform="rotate(45 12 12)"/></g></mask></defs><path fill="currentColor" d="M0 0h24v24H0z" mask="url(#tempChatMask)"/><path fill="none" stroke="currentColor" strokeDasharray="28" strokeDashoffset="28" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M-1 13h26" transform="rotate(45 12 12)"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
