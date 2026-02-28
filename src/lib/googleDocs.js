// Google Docs & Sheets API Service
import { getValidAccessToken } from './googleAuth'
import { getOrCreateStudyFolder } from './googleDrive'
import { supabase } from './supabaseClient'

const DOCS_API_BASE = 'https://docs.googleapis.com/v1'
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4'

/**
 * Export notes to Google Docs
 */
export async function exportNotesToDocs(userId, notes) {
  try {
    const accessToken = await getValidAccessToken(userId)
    const folderId = await getOrCreateStudyFolder(userId)

    // Create document
    const createResponse = await fetch(`${DOCS_API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Notes Export - ${new Date().toLocaleDateString()}`
      })
    })

    const doc = await createResponse.json()
    const documentId = doc.documentId

    // Build content requests
    const requests = []
    let currentIndex = 1

    for (const note of notes) {
      // Add note title
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: `${note.title}\n`
        }
      })
      
      // Style note title as heading
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + note.title.length + 1
          },
          paragraphStyle: {
            namedStyleType: 'HEADING_2'
          },
          fields: 'namedStyleType'
        }
      })

      currentIndex += note.title.length + 1

      // Add note content
      const content = `${note.content}\n\n`
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: content
        }
      })

      currentIndex += content.length

      // Add separator
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '─'.repeat(50) + '\n\n'
        }
      })

      currentIndex += 52
    }

    // Apply all formatting
    const updateResponse = await fetch(
      `${DOCS_API_BASE}/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      }
    )

    // Move to study folder
    await moveToFolder(accessToken, documentId, folderId)

    await logSync(userId, 'docs', 'export', 'notes', documentId, 'success')
    return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` }
  } catch (error) {
    console.error('Error exporting notes to Docs:', error)
    await logSync(userId, 'docs', 'export', 'notes', null, 'failed', error.message)
    throw error
  }
}

/**
 * Export flashcards to Google Sheets
 */
export async function exportFlashcardsToSheets(userId, flashcards) {
  try {
    const accessToken = await getValidAccessToken(userId)
    const folderId = await getOrCreateStudyFolder(userId)

    // Create spreadsheet
    const createResponse = await fetch(`${SHEETS_API_BASE}/spreadsheets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `Flashcards Export - ${new Date().toLocaleDateString()}`
        },
        sheets: [{
          properties: {
            title: 'Flashcards',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }]
      })
    })

    const spreadsheet = await createResponse.json()
    const spreadsheetId = spreadsheet.spreadsheetId

    // Prepare data rows
    const rows = [
      ['Front', 'Back', 'Category', 'Created At'] // Header row
    ]

    for (const card of flashcards) {
      rows.push([
        card.front || '',
        card.back || '',
        card.category || 'Uncategorized',
        new Date(card.created_at).toLocaleDateString()
      ])
    }

    // Update spreadsheet with data
    await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/Flashcards!A1:D${rows.length}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rows
        })
      }
    )

    // Format header row
    await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 4
                }
              }
            }
          ]
        })
      }
    )

    // Move to study folder
    await moveToFolder(accessToken, spreadsheetId, folderId)

    await logSync(userId, 'sheets', 'export', 'flashcards', spreadsheetId, 'success')
    return { 
      spreadsheetId, 
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` 
    }
  } catch (error) {
    console.error('Error exporting flashcards to Sheets:', error)
    await logSync(userId, 'sheets', 'export', 'flashcards', null, 'failed', error.message)
    throw error
  }
}

/**
 * Export chat history to Google Docs
 */
export async function exportChatHistoryToDocs(userId, conversationId) {
  try {
    const accessToken = await getValidAccessToken(userId)
    const folderId = await getOrCreateStudyFolder(userId)

    // Get conversation and messages
    const { data: conversation } = await supabase
      .from('conversations')
      .select('title')
      .eq('id', conversationId)
      .single()

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    // Create document
    const createResponse = await fetch(`${DOCS_API_BASE}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `Chat - ${conversation.title}`
      })
    })

    const doc = await createResponse.json()
    const documentId = doc.documentId

    // Build content
    const requests = []
    let currentIndex = 1

    // Add title
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: `${conversation.title}\n\n`
      }
    })

    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: currentIndex,
          endIndex: currentIndex + conversation.title.length + 1
        },
        paragraphStyle: {
          namedStyleType: 'HEADING_1'
        },
        fields: 'namedStyleType'
      }
    })

    currentIndex += conversation.title.length + 2

    // Add messages
    for (const msg of messages) {
      // User question
      const questionText = `Q: ${msg.question}\n\n`
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: questionText
        }
      })

      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + 2
          },
          textStyle: {
            bold: true,
            foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.4, blue: 0.8 } } }
          },
          fields: 'bold,foregroundColor'
        }
      })

      currentIndex += questionText.length

      // AI answer
      const answerText = `A: ${msg.answer}\n\n`
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: answerText
        }
      })

      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + 2
          },
          textStyle: {
            bold: true,
            foregroundColor: { color: { rgbColor: { red: 0.2, green: 0.7, blue: 0.3 } } }
          },
          fields: 'bold,foregroundColor'
        }
      })

      currentIndex += answerText.length

      // Separator
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: '─'.repeat(50) + '\n\n'
        }
      })

      currentIndex += 52
    }

    // Apply formatting
    await fetch(
      `${DOCS_API_BASE}/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      }
    )

    // Move to study folder
    await moveToFolder(accessToken, documentId, folderId)

    await logSync(userId, 'docs', 'export', 'chat', documentId, 'success')
    return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` }
  } catch (error) {
    console.error('Error exporting chat to Docs:', error)
    await logSync(userId, 'docs', 'export', 'chat', null, 'failed', error.message)
    throw error
  }
}

/**
 * Move file to folder in Google Drive
 */
async function moveToFolder(accessToken, fileId, folderId) {
  try {
    // Get current parents
    const getResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )
    const file = await getResponse.json()
    const previousParents = file.parents ? file.parents.join(',') : ''

    // Move to new folder
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )
  } catch (error) {
    console.error('Error moving file:', error)
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
