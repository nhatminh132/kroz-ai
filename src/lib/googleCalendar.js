// Google Calendar API Service
import { getValidAccessToken } from './googleAuth'
import { supabase } from './supabaseClient'

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

/**
 * Create study event in Google Calendar
 */
export async function createStudyEvent(userId, eventData) {
  try {
    const accessToken = await getValidAccessToken(userId)

    const event = {
      summary: eventData.title || 'Study Session',
      description: eventData.description || '',
      start: {
        dateTime: eventData.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 }
        ]
      },
      colorId: '9' // Blue color for study events
    }

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    const createdEvent = await response.json()
    await logSync(userId, 'calendar', 'create', 'study_event', createdEvent.id, 'success')
    return createdEvent
  } catch (error) {
    console.error('Error creating calendar event:', error)
    await logSync(userId, 'calendar', 'create', 'study_event', null, 'failed', error.message)
    throw error
  }
}

/**
 * Create flashcard review reminder
 */
export async function createFlashcardReminder(userId, flashcardSet, reviewDate) {
  try {
    const accessToken = await getValidAccessToken(userId)

    const event = {
      summary: `📚 Review Flashcards: ${flashcardSet.title || 'Study Set'}`,
      description: `Time to review your flashcards!\n\nSet: ${flashcardSet.title}\nCards: ${flashcardSet.count || 'Multiple'} cards\n\nCreated by AI Study Assistant`,
      start: {
        dateTime: reviewDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(new Date(reviewDate).getTime() + 30 * 60000).toISOString(), // 30 min duration
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 }
        ]
      },
      colorId: '10' // Green color for flashcard reviews
    }

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })

    const createdEvent = await response.json()
    await logSync(userId, 'calendar', 'create', 'flashcard_reminder', createdEvent.id, 'success')
    return createdEvent
  } catch (error) {
    console.error('Error creating flashcard reminder:', error)
    await logSync(userId, 'calendar', 'create', 'flashcard_reminder', null, 'failed', error.message)
    throw error
  }
}

/**
 * Generate AI study schedule and add to calendar
 */
export async function generateStudySchedule(userId, preferences) {
  try {
    const accessToken = await getValidAccessToken(userId)
    const today = new Date()
    const events = []

    // Generate study schedule for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      // Morning session (9 AM - 11 AM)
      if (preferences.morningStudy) {
        const morningStart = new Date(date)
        morningStart.setHours(9, 0, 0, 0)
        const morningEnd = new Date(date)
        morningEnd.setHours(11, 0, 0, 0)

        events.push({
          summary: '📖 Morning Study Session',
          description: 'Focused study time - Morning session\n\nCreated by AI Study Assistant',
          start: { dateTime: morningStart.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: morningEnd.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
          colorId: '9'
        })
      }

      // Afternoon session (2 PM - 4 PM)
      if (preferences.afternoonStudy) {
        const afternoonStart = new Date(date)
        afternoonStart.setHours(14, 0, 0, 0)
        const afternoonEnd = new Date(date)
        afternoonEnd.setHours(16, 0, 0, 0)

        events.push({
          summary: '📖 Afternoon Study Session',
          description: 'Focused study time - Afternoon session\n\nCreated by AI Study Assistant',
          start: { dateTime: afternoonStart.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: afternoonEnd.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
          colorId: '9'
        })
      }

      // Evening session (7 PM - 9 PM)
      if (preferences.eveningStudy) {
        const eveningStart = new Date(date)
        eveningStart.setHours(19, 0, 0, 0)
        const eveningEnd = new Date(date)
        eveningEnd.setHours(21, 0, 0, 0)

        events.push({
          summary: '📖 Evening Study Session',
          description: 'Focused study time - Evening session\n\nCreated by AI Study Assistant',
          start: { dateTime: eveningStart.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: eveningEnd.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
          colorId: '9'
        })
      }
    }

    // Batch create events
    const createdEvents = []
    for (const event of events) {
      const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
      const created = await response.json()
      createdEvents.push(created)
    }

    await logSync(userId, 'calendar', 'create', 'study_schedule', null, 'success')
    return { created: createdEvents.length, events: createdEvents }
  } catch (error) {
    console.error('Error generating study schedule:', error)
    await logSync(userId, 'calendar', 'create', 'study_schedule', null, 'failed', error.message)
    throw error
  }
}

/**
 * Create spaced repetition schedule for flashcards
 */
export async function createSpacedRepetitionSchedule(userId, flashcardSetId) {
  try {
    const accessToken = await getValidAccessToken(userId)
    
    // Spaced repetition intervals: 1 day, 3 days, 7 days, 14 days, 30 days
    const intervals = [1, 3, 7, 14, 30]
    const events = []

    for (const days of intervals) {
      const reviewDate = new Date()
      reviewDate.setDate(reviewDate.getDate() + days)
      reviewDate.setHours(18, 0, 0, 0) // 6 PM

      const event = {
        summary: `🔄 Flashcard Review - Day ${days}`,
        description: `Spaced repetition review session\n\nReview your flashcards to reinforce learning.\n\nCreated by AI Study Assistant`,
        start: {
          dateTime: reviewDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(reviewDate.getTime() + 30 * 60000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 120 }
          ]
        },
        colorId: '10'
      }

      const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      events.push(await response.json())
    }

    await logSync(userId, 'calendar', 'create', 'spaced_repetition', null, 'success')
    return events
  } catch (error) {
    console.error('Error creating spaced repetition schedule:', error)
    await logSync(userId, 'calendar', 'create', 'spaced_repetition', null, 'failed', error.message)
    throw error
  }
}

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
