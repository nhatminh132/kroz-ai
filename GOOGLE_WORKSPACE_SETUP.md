# Google Workspace Integration Setup Guide

## Overview
This guide will help you set up Google Workspace integration for your AI Study Assistant, enabling features like:
- 📁 **Auto-backup to Google Drive** - Automatically backup notes, flashcards, and bookmarks
- 📅 **Calendar Integration** - Create study schedules and flashcard review reminders
- 📝 **Export to Docs** - Export notes and chat history to Google Docs
- 📊 **Export to Sheets** - Export flashcards to Google Sheets

## Prerequisites
- A Google Cloud Platform account
- A Supabase project with the database schema applied
- The application running locally or deployed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Name your project (e.g., "AI Study Assistant")
4. Click **Create**

## Step 2: Enable Required APIs

1. In your project, go to **APIs & Services** → **Library**
2. Search for and enable the following APIs:
   - Google Drive API
   - Google Calendar API
   - Google Docs API
   - Google Sheets API
   - Google People API (for user info)

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace account)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: AI Study Assistant
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click **Save and Continue**
6. **Scopes**: Click **Add or Remove Scopes** and add:
   ```
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
7. Click **Update** → **Save and Continue**
8. **Test users**: Add your email address (for testing)
9. Click **Save and Continue** → **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application**
4. Configure:
   - **Name**: AI Study Assistant Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     https://yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:5173/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
5. Click **Create**
6. **Save the Client ID and Client Secret** - you'll need these!

## Step 5: Apply Database Schema

Run the Google Workspace schema migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of GOOGLE_WORKSPACE_SCHEMA.sql
```

This creates the necessary columns in the `profiles` table and the `google_sync_history` table.

## Step 6: Configure Environment Variables

Add the following to your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

For production, update the redirect URI to your deployed URL.

## Step 7: Deploy API Endpoints

Make sure your backend server (`server.js`) is running and accessible at the configured URL. The following endpoints should be available:

- `POST /api/google/token` - Exchange authorization code for tokens
- `POST /api/google/refresh` - Refresh access token

## Step 8: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   npm run dev:server
   ```

2. Log in to your application
3. Go to **Settings** → **Google Workspace**
4. Click **Connect Google Workspace**
5. Authorize the required permissions
6. You should be redirected back to the app with a success message

## Step 9: Test Features

### Test Drive Backup
1. Go to **Settings** → **Google Workspace** → **Drive Backup** tab
2. Click **Backup All Data**
3. Check your Google Drive for a new "AI Study Assistant" folder

### Test Calendar Integration
1. Go to **Settings** → **Google Workspace** → **Calendar** tab
2. Click **Generate Study Schedule**
3. Select your preferred study times
4. Check your Google Calendar for new events

### Test Export Features
1. Go to **Settings** → **Google Workspace** → **Export** tab
2. Click **Export Notes to Docs** or **Export Flashcards to Sheets**
3. Your browser should open the newly created document

## Troubleshooting

### "Access Blocked: This app's request is invalid"
- Make sure your redirect URI exactly matches what's configured in Google Cloud Console
- Check that you're using the correct Client ID

### "This app hasn't been verified"
- During testing, click **Advanced** → **Go to [App Name] (unsafe)**
- To verify your app for production, follow [Google's verification process](https://support.google.com/cloud/answer/9110914)

### "Failed to refresh token"
- The refresh token may have expired or been revoked
- Disconnect and reconnect Google Workspace in settings

### Token expires too quickly
- This is normal - access tokens expire after 1 hour
- The app automatically refreshes them using the refresh token

## Security Best Practices

1. **Never commit credentials** - Keep `.env` files in `.gitignore`
2. **Use HTTPS in production** - Required for OAuth
3. **Rotate secrets regularly** - Update client secrets periodically
4. **Limit scopes** - Only request permissions you actually need
5. **Monitor usage** - Check Google Cloud Console for unusual activity

## Features Roadmap

### Currently Implemented ✅
- Google Drive auto-backup
- Calendar study schedules
- Export to Docs/Sheets
- Sync history tracking

### Coming Soon 🚀
- Gmail integration (send study summaries)
- Google Keep integration (sync notes)
- Google Slides export (flashcard presentations)
- Smart suggestions based on calendar

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review the Supabase logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure all required APIs are enabled in Google Cloud Console

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Google Docs API](https://developers.google.com/docs/api)
- [Google Sheets API](https://developers.google.com/sheets/api)
