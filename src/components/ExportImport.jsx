import React from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ExportImport({ userId, dataType, onImportComplete }) {
  const handleExport = async () => {
    try {
      let data
      if (dataType === 'notes') {
        const { data: notes } = await supabase
          .from('study_notes')
          .select('*')
          .eq('user_id', userId)
        data = notes
      } else if (dataType === 'flashcards') {
        const { data: cards } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', userId)
        data = cards
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export')
    }
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result)
        
        const dataToInsert = importedData.map(item => ({
          ...item,
          user_id: userId,
          id: undefined,
          created_at: undefined,
          updated_at: undefined
        }))

        const tableName = dataType === 'notes' ? 'study_notes' : 'flashcards'
        const { error } = await supabase.from(tableName).insert(dataToInsert)

        if (error) throw error
        alert(`Successfully imported ${importedData.length} ${dataType}`)
        if (onImportComplete) onImportComplete()
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition whitespace-nowrap flex items-center gap-2"
        title="Export to JSON"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ color: 'rgb(255, 255, 255)' }}>
          <path fill="currentColor" d="M11 16h2V7h3l-4-5l-4 5h3z"></path>
          <path fill="currentColor" d="M5 22h14c1.103 0 2-.897 2-2v-9c0-1.103-.897-2-2-2h-4v2h4v9H5v-9h4V9H5c-1.103 0-2 .897-2 2v9c0 1.103.897 2 2 2"></path>
        </svg>
        Export
      </button>
      <label className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition cursor-pointer whitespace-nowrap flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{ color: 'rgb(255, 255, 255)' }}>
          <path d="M12 3v12m-4-4l4 4l4-4"></path>
          <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"></path>
        </svg>
        Import
        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
      </label>
    </div>
  )
}
