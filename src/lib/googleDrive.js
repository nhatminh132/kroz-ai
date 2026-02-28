// Google Drive API Service
import { getValidAccessToken } from './googleAuth'
import { supabase } from './supabaseClient'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

/**
 * Create or get Study Assistant folder in Google Drive
 */
export async function getOrCreateStudyFolder(userId) {
  try {
    const accessToken = await getValidAccessToken(userId)
    
    // Check if folder already exists in database
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_drive_folder_id')
      .eq('id', userId)
      .single()

    if (profile?.google_drive_folder_id) {
      // Verify folder still exists
      const checkResponse = await fetch(
        `${DRIVE_API_BASE}/files/${profile.google_drive_folder_id}?fields=id,name`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )
      
      if (checkResponse.ok) {
        return profile.google_drive_folder_id
      }
    }

    // Search for existing folder
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}/files?q=name='AI Study Assistant' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )

    const searchData = await searchResponse.json()
    
    if (searchData.files && searchData.files.length > 0) {
      const folderId = searchData.files[0].id
      await saveFolderId(userId, folderId)
      return folderId
    }

    // Create new folder
    const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'AI Study Assistant',
        mimeType: 'application/vnd.google-apps.folder'
      })
    })

    const folder = await createResponse.json()
    await saveFolderId(userId, folder.id)
    return folder.id
  } catch (error) {
    console.error('Error creating/getting folder:', error)
    throw error
  }
}

async function saveFolderId(userId, folderId) {
  await supabase
    .from('profiles')
    .update({ google_drive_folder_id: folderId })
    .eq('id', userId)
}

/**
 * Create subfolder in Study Assistant folder
 */
export async function createSubfolder(userId, folderName) {
  try {
    const accessToken = await getValidAccessToken(userId)
    const parentFolderId = await getOrCreateStudyFolder(userId)

    const response = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      })
    })

    const folder = await response.json()
    return folder.id
  } catch (error) {
    console.error('Error creating subfolder:', error)
    throw error
  }
}

/**
 * Upload JSON data to Google Drive
 */
export async function uploadJsonToDrive(userId, fileName, jsonData, folderId = null) {
  try {
    const accessToken = await getValidAccessToken(userId)
    const parentFolderId = folderId || await getOrCreateStudyFolder(userId)

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [parentFolderId]
    }

    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(jsonData, null, 2) +
      closeDelimiter

    const response = await fetch(
      `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,webViewLink`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      }
    )

    const file = await response.json()
    await logSync(userId, 'drive', 'backup', fileName, file.id, 'success')
    return file
  } catch (error) {
    console.error('Error uploading to Drive:', error)
    await logSync(userId, 'drive', 'backup', fileName, null, 'failed', error.message)
    throw error
  }
}

/**
 * Backup notes to Google Drive
 */
export async function backupNotesToDrive(userId) {
  try {
    // Get all notes
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const fileName = `notes-backup-${new Date().toISOString().split('T')[0]}.json`
    const file = await uploadJsonToDrive(userId, fileName, notes)
    
    // Update last backup time
    await supabase
      .from('profiles')
      .update({ google_last_backup: new Date().toISOString() })
      .eq('id', userId)

    return file
  } catch (error) {
    console.error('Error backing up notes:', error)
    throw error
  }
}

/**
 * Backup flashcards to Google Drive
 */
export async function backupFlashcardsToDrive(userId) {
  try {
    const { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const fileName = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`
    const file = await uploadJsonToDrive(userId, fileName, flashcards)
    
    await supabase
      .from('profiles')
      .update({ google_last_backup: new Date().toISOString() })
      .eq('id', userId)

    return file
  } catch (error) {
    console.error('Error backing up flashcards:', error)
    throw error
  }
}

/**
 * Backup bookmarks to Google Drive
 */
export async function backupBookmarksToDrive(userId) {
  try {
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const fileName = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`
    const file = await uploadJsonToDrive(userId, fileName, bookmarks)
    
    await supabase
      .from('profiles')
      .update({ google_last_backup: new Date().toISOString() })
      .eq('id', userId)

    return file
  } catch (error) {
    console.error('Error backing up bookmarks:', error)
    throw error
  }
}

/**
 * Backup all data to Google Drive
 */
export async function backupAllDataToDrive(userId) {
  try {
    const results = await Promise.allSettled([
      backupNotesToDrive(userId),
      backupFlashcardsToDrive(userId),
      backupBookmarksToDrive(userId)
    ])

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      successful,
      failed,
      total: results.length,
      results
    }
  } catch (error) {
    console.error('Error backing up all data:', error)
    throw error
  }
}

/**
 * Log sync operation
 */
async function logSync(userId, serviceType, action, itemType, googleResourceId, status, errorMessage = null) {
  try {
    await supabase
      .from('google_sync_history')
      .insert({
        user_id: userId,
        service_type: serviceType,
        action,
        item_type: itemType,
        google_resource_id: googleResourceId,
        status,
        error_message: errorMessage
      })
  } catch (error) {
    console.error('Error logging sync:', error)
  }
}

/**
 * Enable auto-backup
 */
export async function enableAutoBackup(userId, intervalSeconds = 3600) {
  try {
    await supabase
      .from('profiles')
      .update({
        google_drive_auto_backup: true,
        google_backup_interval: intervalSeconds
      })
      .eq('id', userId)

    return true
  } catch (error) {
    console.error('Error enabling auto-backup:', error)
    throw error
  }
}

/**
 * Disable auto-backup
 */
export async function disableAutoBackup(userId) {
  try {
    await supabase
      .from('profiles')
      .update({ google_drive_auto_backup: false })
      .eq('id', userId)

    return true
  } catch (error) {
    console.error('Error disabling auto-backup:', error)
    throw error
  }
}
