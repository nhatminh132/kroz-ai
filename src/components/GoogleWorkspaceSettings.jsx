import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  getGoogleAuthUrl, 
  isGoogleConnected, 
  disconnectGoogle,
  getGoogleTokens 
} from '../lib/googleAuth'
import {
  backupNotesToDrive,
  backupFlashcardsToDrive,
  backupBookmarksToDrive,
  backupAllDataToDrive,
  enableAutoBackup,
  disableAutoBackup
} from '../lib/googleDrive'
import {
  createStudyEvent,
  generateStudySchedule,
  createSpacedRepetitionSchedule
} from '../lib/googleCalendar'
import {
  exportNotesToDocs,
  exportFlashcardsToSheets,
  exportChatHistoryToDocs
} from '../lib/googleDocs'

export default function GoogleWorkspaceSettings({ userId, onClose }) {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    driveAutoBackup: false,
    calendarEnabled: false,
    docsEnabled: false,
    sheetsEnabled: false,
    backupInterval: 3600
  })
  const [backupStatus, setBackupStatus] = useState(null)
  const [syncHistory, setSyncHistory] = useState([])
  const [activeTab, setActiveTab] = useState('overview') // overview, calendar, drive, export, history

  useEffect(() => {
    loadGoogleSettings()
  }, [userId])

  const loadGoogleSettings = async () => {
    try {
      setLoading(true)
      const connected = await isGoogleConnected(userId)
      setIsConnected(connected)

      if (connected) {
        // Load settings from database
        const { data, error } = await supabase
          .from('profiles')
          .select('google_drive_auto_backup, google_calendar_enabled, google_docs_enabled, google_sheets_enabled, google_backup_interval, google_last_backup')
          .eq('id', userId)
          .single()

        if (!error && data) {
          setSettings({
            driveAutoBackup: data.google_drive_auto_backup,
            calendarEnabled: data.google_calendar_enabled,
            docsEnabled: data.google_docs_enabled,
            sheetsEnabled: data.google_sheets_enabled,
            backupInterval: data.google_backup_interval || 3600,
            lastBackup: data.google_last_backup
          })
        }

        // Load sync history
        const { data: history } = await supabase
          .from('google_sync_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (history) {
          setSyncHistory(history)
        }
      }
    } catch (error) {
      console.error('Error loading Google settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    const authUrl = getGoogleAuthUrl()
    window.location.href = authUrl
  }

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Google Workspace? This will disable all integrations.')) {
      try {
        await disconnectGoogle(userId)
        setIsConnected(false)
        alert('Google Workspace disconnected successfully!')
      } catch (error) {
        console.error('Error disconnecting:', error)
        alert('Failed to disconnect Google Workspace')
      }
    }
  }

  const handleToggleAutoBackup = async () => {
    try {
      if (settings.driveAutoBackup) {
        await disableAutoBackup(userId)
        setSettings(prev => ({ ...prev, driveAutoBackup: false }))
        alert('Auto-backup disabled')
      } else {
        await enableAutoBackup(userId, settings.backupInterval)
        setSettings(prev => ({ ...prev, driveAutoBackup: true }))
        alert('Auto-backup enabled!')
      }
    } catch (error) {
      console.error('Error toggling auto-backup:', error)
      alert('Failed to update auto-backup settings')
    }
  }

  const handleManualBackup = async (type) => {
    try {
      setBackupStatus(`Backing up ${type}...`)
      let result

      switch (type) {
        case 'notes':
          result = await backupNotesToDrive(userId)
          break
        case 'flashcards':
          result = await backupFlashcardsToDrive(userId)
          break
        case 'bookmarks':
          result = await backupBookmarksToDrive(userId)
          break
        case 'all':
          result = await backupAllDataToDrive(userId)
          break
      }

      setBackupStatus(`✅ ${type} backed up successfully!`)
      await loadGoogleSettings() // Refresh sync history
      setTimeout(() => setBackupStatus(null), 3000)
    } catch (error) {
      console.error('Backup error:', error)
      setBackupStatus(`❌ Failed to backup ${type}`)
      setTimeout(() => setBackupStatus(null), 3000)
    }
  }

  const handleCreateStudySchedule = async () => {
    try {
      const preferences = {
        morningStudy: confirm('Include morning study sessions (9-11 AM)?'),
        afternoonStudy: confirm('Include afternoon study sessions (2-4 PM)?'),
        eveningStudy: confirm('Include evening study sessions (7-9 PM)?')
      }

      if (!preferences.morningStudy && !preferences.afternoonStudy && !preferences.eveningStudy) {
        alert('Please select at least one study session time')
        return
      }

      setBackupStatus('Creating study schedule...')
      const result = await generateStudySchedule(userId, preferences)
      setBackupStatus(`✅ Created ${result.created} study events!`)
      await loadGoogleSettings()
      setTimeout(() => setBackupStatus(null), 3000)
    } catch (error) {
      console.error('Error creating schedule:', error)
      setBackupStatus('❌ Failed to create study schedule')
      setTimeout(() => setBackupStatus(null), 3000)
    }
  }

  const handleToggleSetting = async (setting) => {
    try {
      const newValue = !settings[setting]
      await supabase
        .from('profiles')
        .update({ [`google_${setting.replace(/([A-Z])/g, '_$1').toLowerCase()}`]: newValue })
        .eq('id', userId)

      setSettings(prev => ({ ...prev, [setting]: newValue }))
    } catch (error) {
      console.error('Error updating setting:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-2xl w-full mx-4">
          <p className="text-white">Loading Google Workspace settings...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Google Workspace</h2>
          <p className="text-gray-300 mb-6">
            Connect your Google account to enable powerful integrations with Drive, Calendar, Docs, and more.
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-semibold">Auto-backup to Google Drive</h3>
                <p className="text-gray-400 text-sm">Automatically backup your notes, flashcards, and bookmarks</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-semibold">Smart Calendar Integration</h3>
                <p className="text-gray-400 text-sm">Create study schedules and flashcard review reminders</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-white font-semibold">Export to Docs & Sheets</h3>
                <p className="text-gray-400 text-sm">Export your study materials to Google Docs and Sheets</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConnect}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Google Workspace
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Google Workspace Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'drive', label: 'Drive Backup', icon: '☁️' },
            { id: 'calendar', label: 'Calendar', icon: '📅' },
            { id: 'export', label: 'Export', icon: '📤' },
            { id: 'history', label: 'Sync History', icon: '📜' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Status Message */}
        {backupStatus && (
          <div className="mb-4 p-3 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg text-blue-200">
            {backupStatus}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">Connected to Google</h3>
                  <p className="text-gray-400 text-sm">Your account is linked and ready to use</p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📁 Google Drive</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Auto-backup: {settings.driveAutoBackup ? '✅ Enabled' : '❌ Disabled'}
                </p>
                {settings.lastBackup && (
                  <p className="text-gray-500 text-xs">
                    Last backup: {new Date(settings.lastBackup).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📅 Google Calendar</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Integration: {settings.calendarEnabled ? '✅ Enabled' : '❌ Disabled'}
                </p>
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📝 Google Docs</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Export: {settings.docsEnabled ? '✅ Enabled' : '❌ Disabled'}
                </p>
              </div>

              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">📊 Google Sheets</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Export: {settings.sheetsEnabled ? '✅ Enabled' : '❌ Disabled'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Drive Tab */}
        {activeTab === 'drive' && (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">Auto-Backup</h3>
                  <p className="text-gray-400 text-sm">Automatically backup your data to Google Drive</p>
                </div>
                <button
                  onClick={handleToggleAutoBackup}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.driveAutoBackup
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {settings.driveAutoBackup ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {settings.lastBackup && (
                <p className="text-gray-400 text-sm">
                  Last backup: {new Date(settings.lastBackup).toLocaleString()}
                </p>
              )}
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Manual Backup</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleManualBackup('notes')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  📝 Backup Notes
                </button>
                <button
                  onClick={() => handleManualBackup('flashcards')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  🎴 Backup Flashcards
                </button>
                <button
                  onClick={() => handleManualBackup('bookmarks')}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  🔖 Backup Bookmarks
                </button>
                <button
                  onClick={() => handleManualBackup('all')}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
                >
                  ☁️ Backup All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">Calendar Integration</h3>
                  <p className="text-gray-400 text-sm">Sync study events with Google Calendar</p>
                </div>
                <button
                  onClick={() => handleToggleSetting('calendarEnabled')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.calendarEnabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {settings.calendarEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {settings.calendarEnabled && (
              <div className="bg-[#2a2a2a] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleCreateStudySchedule}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-left flex items-center gap-3"
                  >
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="font-semibold">Generate Study Schedule</div>
                      <div className="text-sm text-blue-200">Create study sessions for the next 7 days</div>
                    </div>
                  </button>

                  <button
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-left flex items-center gap-3"
                    onClick={() => alert('Feature coming soon! Will create spaced repetition schedule for your flashcards.')}
                  >
                    <span className="text-2xl">🔄</span>
                    <div>
                      <div className="font-semibold">Spaced Repetition Schedule</div>
                      <div className="text-sm text-purple-200">Smart review reminders for flashcards</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Export to Google Docs & Sheets</h3>
              <p className="text-gray-400 text-sm mb-4">
                Export your study materials to Google Workspace apps for easy sharing and collaboration.
              </p>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      setBackupStatus('Exporting notes to Google Docs...')
                      const { data: notes } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                      
                      if (!notes || notes.length === 0) {
                        setBackupStatus('❌ No notes to export')
                        setTimeout(() => setBackupStatus(null), 3000)
                        return
                      }

                      const result = await exportNotesToDocs(userId, notes)
                      setBackupStatus(`✅ Notes exported! Opening in new tab...`)
                      window.open(result.url, '_blank')
                      await loadGoogleSettings()
                      setTimeout(() => setBackupStatus(null), 3000)
                    } catch (error) {
                      console.error('Export error:', error)
                      setBackupStatus('❌ Failed to export notes')
                      setTimeout(() => setBackupStatus(null), 3000)
                    }
                  }}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-left flex items-center gap-3"
                >
                  <span className="text-2xl">📝</span>
                  <div>
                    <div className="font-semibold">Export Notes to Docs</div>
                    <div className="text-sm text-blue-200">Create a formatted Google Doc with all your notes</div>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    try {
                      setBackupStatus('Exporting flashcards to Google Sheets...')
                      const { data: flashcards } = await supabase
                        .from('flashcards')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                      
                      if (!flashcards || flashcards.length === 0) {
                        setBackupStatus('❌ No flashcards to export')
                        setTimeout(() => setBackupStatus(null), 3000)
                        return
                      }

                      const result = await exportFlashcardsToSheets(userId, flashcards)
                      setBackupStatus(`✅ Flashcards exported! Opening in new tab...`)
                      window.open(result.url, '_blank')
                      await loadGoogleSettings()
                      setTimeout(() => setBackupStatus(null), 3000)
                    } catch (error) {
                      console.error('Export error:', error)
                      setBackupStatus('❌ Failed to export flashcards')
                      setTimeout(() => setBackupStatus(null), 3000)
                    }
                  }}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-left flex items-center gap-3"
                >
                  <span className="text-2xl">🎴</span>
                  <div>
                    <div className="font-semibold">Export Flashcards to Sheets</div>
                    <div className="text-sm text-green-200">Create a spreadsheet with all your flashcards</div>
                  </div>
                </button>

                <button
                  onClick={() => alert('Select a conversation from the sidebar, then use the chat menu to export it to Google Docs.')}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-left flex items-center gap-3"
                >
                  <span className="text-2xl">💬</span>
                  <div>
                    <div className="font-semibold">Export Chat to Docs</div>
                    <div className="text-sm text-purple-200">Available from individual chat menus</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">Docs Integration</h3>
                  <p className="text-gray-400 text-sm">Enable Google Docs features</p>
                </div>
                <button
                  onClick={() => handleToggleSetting('docsEnabled')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.docsEnabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {settings.docsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            <div className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">Sheets Integration</h3>
                  <p className="text-gray-400 text-sm">Enable Google Sheets features</p>
                </div>
                <button
                  onClick={() => handleToggleSetting('sheetsEnabled')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.sheetsEnabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {settings.sheetsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">Recent Sync Operations</h3>
            {syncHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No sync history yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          item.status === 'success' ? 'bg-green-500' : 
                          item.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-white font-medium capitalize">
                          {item.service_type} - {item.action}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm ml-4">
                        {item.item_type && `Type: ${item.item_type}`}
                        {item.error_message && ` • Error: ${item.error_message}`}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
