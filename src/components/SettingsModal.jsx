import React, { useState } from 'react'
import GoogleWorkspaceSettings from './GoogleWorkspaceSettings'

export default function SettingsModal({ onClose, userId }) {
  const [showGoogleWorkspace, setShowGoogleWorkspace] = useState(false)
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Enable sound notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Desktop notifications</span>
              </label>
            </div>
          </div>

          {/* Data & Privacy */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Data & Privacy</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Save chat history</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-gray-300">Allow data for model improvement</span>
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
                    <p className="text-sm text-gray-300 mb-1">
                      Connect Google Drive, Calendar, Docs, and more
                    </p>
                    <p className="text-xs text-gray-500">
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
