import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import GoogleWorkspaceSettings from './GoogleWorkspaceSettings'

export default function SettingsModal({ onClose, userId }) {
  const [showGoogleWorkspace, setShowGoogleWorkspace] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-[#3f3f3f] transition">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-[#dbdbdb]">Enable sound notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-[#3f3f3f] transition">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-[#dbdbdb]">Desktop notifications</span>
              </label>
            </div>
          </div>

          {/* Data & Privacy */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Data & Privacy</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-[#3f3f3f] transition">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-[#dbdbdb]">Save chat history</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-[#3f3f3f] transition">
                <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-[#dbdbdb]">Allow data for model improvement</span>
              </label>
            </div>
          </div>

          {/* Google Workspace Integration */}
          {userId && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Google Workspace</h4>
              <div className="bg-[#121212] rounded-lg p-4 border border-[#4a4a4a]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#dbdbdb] mb-1">
                      Connect Google Drive, Calendar, Docs, and more
                    </p>
                    <p className="text-xs text-gray-400">
                      Auto-backup, smart scheduling, and seamless exports
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGoogleWorkspace(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleLogout} className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#dbdbdb] rounded-lg transition flex items-center justify-center gap-2 border border-[#4a4a4a]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
            </svg>
            Log Out
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition">
            Close
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium">
            Save Changes
          </button>
        </div>
      </div>

      {/* Google Workspace Settings Modal */}
      {showGoogleWorkspace && (
        <GoogleWorkspaceSettings
          userId={userId}
          onClose={() => setShowGoogleWorkspace(false)}
        />
      )}
    </div>
  )
}
