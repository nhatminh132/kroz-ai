# Quick Google Workspace Setup (5 Minutes)

## ⚠️ Important: Do This First!

The Google Workspace integration is already coded, but you need to configure Google Cloud credentials to make it work.

## Step 1: Create Google Cloud Project (2 minutes)

1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** dropdown at the top
3. Click **"NEW PROJECT"**
4. Name it: `AI Study Assistant`
5. Click **"CREATE"**
6. Wait for the project to be created (shows notification)

## Step 2: Enable Required APIs (1 minute)

1. In your project, click the **☰ menu** (hamburger menu)
2. Go to **"APIs & Services"** → **"Library"**
3. Search and enable these APIs (click **ENABLE** for each):
   - **Google Drive API**
   - **Google Calendar API**
   - **Google Docs API**
   - **Google Sheets API**

## Step 3: Configure OAuth Consent Screen (1 minute)

1. Go to **☰ menu** → **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have Google Workspace)
3. Click **"CREATE"**
4. Fill in required fields:
   - **App name:** `AI Study Assistant`
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click **"SAVE AND CONTINUE"**
6. Click **"SAVE AND CONTINUE"** again (skip scopes for now)
7. **Test users:** Click **"ADD USERS"**, enter your email
8. Click **"SAVE AND CONTINUE"**
9. Click **"BACK TO DASHBOARD"**

## Step 4: Create OAuth Credentials (1 minute)

1. Go to **☰ menu** → **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth 2.0 Client ID"**
4. Choose **"Web application"**
5. Configure:
   - **Name:** `AI Study Assistant Web`
   - Under **"Authorized JavaScript origins"**, click **"+ ADD URI"**:
     ```
     http://localhost:5173
     ```
   - Under **"Authorized redirect URIs"**, click **"+ ADD URI"**:
     ```
     http://localhost:5173/auth/google/callback
     ```
6. Click **"CREATE"**
7. **IMPORTANT:** Copy both:
   - ✅ **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - ✅ **Client Secret** (looks like: `GOCSPX-abc123...`)

## Step 5: Add to .env File

1. Open your project folder
2. Find the `.env` file (create it if it doesn't exist)
3. Add these lines:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

4. Replace `YOUR_CLIENT_ID_HERE` and `YOUR_CLIENT_SECRET_HERE` with the values you copied
5. **Save the file**

## Step 6: Run Database Migration

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the contents of `GOOGLE_WORKSPACE_SCHEMA.sql` from your project
5. Click **"RUN"**
6. You should see: "Success. No rows returned"

## Step 7: Restart Your App

1. Stop your development server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   npm run dev
   npm run dev:server
   ```
3. Open: http://localhost:5173

## Step 8: Test the Connection

1. Login to your app
2. Click the **user menu** (bottom left)
3. Click **"Settings"**
4. Scroll down to **"Google Workspace"** section
5. Click **"Manage"** button
6. You should see **"Connect Google Workspace"** button
7. Click it and authorize!

## ✅ That's It!

Once connected, you can:
- ☁️ Backup your data to Drive
- 📅 Create study schedules
- 📝 Export to Docs/Sheets

## 🐛 Troubleshooting

### "Button not showing"
- Make sure you're **logged in** (not in guest mode)
- Check that you restarted the server after adding .env

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Cloud Console **exactly matches**: `http://localhost:5173/auth/google/callback`
- No trailing slash, no extra spaces

### "This app hasn't been verified"
- Click **"Advanced"**
- Click **"Go to AI Study Assistant (unsafe)"**
- This is normal for testing - you're the developer!

### "Can't find .env file"
- Create it in your project root folder (same level as package.json)
- Make sure it's named exactly `.env` (not `.env.txt`)

## 📧 Need Help?

The `.env` file should look like this:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-api-key
VITE_OPENROUTER_API_KEY=your-openrouter-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key

# Google Workspace Integration
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

Replace the values with your actual credentials!
