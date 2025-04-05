# LockedIn Chrome Extension

A Chrome extension for Google OAuth authentication.

## Setup Instructions

### 1. Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Google OAuth2 API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Name: LockedIn
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
5. Note down your Client ID and Client Secret

### 2. MongoDB Setup
1. Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace `<username>`, `<password>`, and `<dbname>` in the connection string

### 3. Extension Setup
1. Clone this repository
2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory
3. Copy your extension ID from the extensions page

### 4. Environment Setup
1. In the `server` directory, create a `.env` file:
```env
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=any_random_string_for_jwt_signing
EXTENSION_ID=your_extension_id_from_chrome
```

### 5. Install Dependencies & Run
1. Install server dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

3. The extension should now work with your Google account!

## Security Notes
- Never commit your `.env` file
- Keep your Google credentials and JWT secret secure
- The extension ID will be different for each installation

## Troubleshooting
- If authentication fails, check your Google OAuth credentials and redirect URIs
- If MongoDB connection fails, verify your connection string
- If the extension doesn't receive the token, verify the extension ID in your `.env` file matches your installation
