import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Gallery({ userId, onClose }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [userId])

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .like('question', '%Image upload%')
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#2f2f2f] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#4a4a4a]">
          <h2 className="text-xl font-bold text-white">Image Gallery</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3f3f3f] rounded-lg transition text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="mx-auto mb-4 text-gray-500" viewBox="0 0 16 16">
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/>
              </svg>
              <p className="text-gray-400">No images uploaded yet</p>
              <p className="text-gray-500 text-sm mt-2">Upload an image in the chat to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((item, index) => (
                <div key={item.id} className="bg-[#121212] rounded-lg p-4 border border-[#4a4a4a]">
                  <div className="flex items-start gap-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-white flex-shrink-0" viewBox="0 0 16 16">
                      <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                      <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z"/>
                    </svg>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        Model: {item.model_used}
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#2f2f2f] rounded p-3 border border-[#4a4a4a]">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


