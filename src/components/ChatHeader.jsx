import React from 'react'

export default function ChatHeader({ onToggleSidebar, sidebarMinimized, isSearchExpanded, isTemporaryChat, onToggleTemporaryChat, isGuest = false, onGenerateSummary, hasMessages = false, onShowLogin }) {

  return (
    <header className="bg-[#121212] border-b border-[#3f3f3f] p-4">
      <div className="w-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle - Show when sidebar is minimized */}
          {sidebarMinimized && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg bg-transparent hover:bg-[#2f2f2f] active:bg-[#3f3f3f] transition text-white flex items-center justify-center"
              title="Show sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <path d="M9 3v18"/>
              </svg>
            </button>
          )}
          
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Cascadia Mono, monospace', letterSpacing: '1px' }}>
              Kroz
            </h1>
            <a 
              href="https://iamnhatminh.vercel.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[8px] text-gray-500 hover:text-gray-400 transition-colors"
              style={{ marginTop: '-4px' }}
            >
              Made by Nhat Minh
            </a>
          </div>

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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.72a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.28 17.61a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98"/></svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

