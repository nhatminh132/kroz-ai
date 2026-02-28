import React, { useState } from 'react'

export default function HelpModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('faq')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Help & Support</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 font-medium transition ${activeTab === 'faq' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('release')}
            className={`px-4 py-2 font-medium transition ${activeTab === 'release' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            Release Notes
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 font-medium transition ${activeTab === 'safety' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            AI Safety
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 font-medium transition ${activeTab === 'policies' ? 'text-white border-b-2 border-white' : 'text-gray-400 hover:text-white'}`}
          >
            Policies
          </button>
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">How do I use different AI modes?</h4>
              <p className="text-gray-400 text-sm">Click the model selector at the bottom of the chat input to choose between Instant, Thinking, Agent, and Legion modes. Each mode offers different capabilities and usage limits.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">What are the differences between modes?</h4>
              <p className="text-gray-400 text-sm">Instant and Thinking modes are unlimited and free. Agent mode offers enhanced capabilities with daily limits. Legion mode provides advanced multi-agent processing with limited daily uses.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">How do I save my conversations?</h4>
              <p className="text-gray-400 text-sm">Sign in to automatically save all your conversations. Guest users can use the AI but conversations won't be saved.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Can I upload images?</h4>
              <p className="text-gray-400 text-sm">Yes! Click the image icon in the chat input to upload homework images. Powered by Groq's Llama 4 Scout vision model for fast OCR and image analysis.</p>
            </div>
          </div>
        )}

        {/* Release Notes Tab */}
        {activeTab === 'release' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">Latest Updates (February 2026)</h4>
              <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                <li>Added guest mode with limited free usage</li>
                <li>Implemented conversation memory for context-aware responses</li>
                <li>Added multiple AI model options (Instant, Thinking, Agent, Legion)</li>
                <li>Improved streaming responses for better UX</li>
                <li>Added Help and Settings modals</li>
                <li>Profile customization with display names</li>
                <li>Vercel deployment support</li>
              </ul>
            </div>
          </div>
        )}

        {/* AI Safety Tab */}
        {activeTab === 'safety' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">AI Limitations</h4>
              <p className="text-gray-400 text-sm mb-3">AI can make mistakes. Always verify important information from reliable sources.</p>
              <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                <li>AI responses are generated based on patterns in training data</li>
                <li>Information may be outdated or incomplete</li>
                <li>AI cannot access real-time information or browse the web</li>
                <li>Responses should not be used for medical, legal, or financial advice</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 mt-4">Safe Usage Guidelines</h4>
              <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                <li>Don't share personal sensitive information</li>
                <li>Verify critical information from authoritative sources</li>
                <li>Use AI as a tool to assist, not replace human judgment</li>
                <li>Report inappropriate or harmful content</li>
              </ul>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">Privacy Policy</h4>
              <p className="text-gray-400 text-sm mb-3">We take your privacy seriously. Your conversations are stored securely and never shared with third parties.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Terms of Service</h4>
              <p className="text-gray-400 text-sm mb-3">By using this service, you agree to use it responsibly and not for any illegal or harmful purposes.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Data Usage</h4>
              <p className="text-gray-400 text-sm">Your data is used only to provide and improve the service. You can delete your conversations at any time.</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button onClick={onClose} className="w-full px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
