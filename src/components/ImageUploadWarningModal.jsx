import React from 'react'

export default function ImageUploadWarningModal({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1f1f1f] border border-[#3f3f3f] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="text-purple-400">
              <path d="M12 3v12m-4-4l4 4l4-4" />
              <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Image Upload Notice</h3>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          Your uploaded images will be stored securely for up to <span className="text-white font-semibold">5 days</span> and then automatically deleted. This lets you revisit image conversations after reloads.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
