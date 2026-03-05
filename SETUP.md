# HabitFlow — Firebase & GitHub Pages Setup

## 1. Firebase Configuration

### Create/Configure Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use existing)
3. Add a **Web app** (</> icon) and register your app
4. Copy the `firebaseConfig` values

### Configure firebase-config.js

Open `firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Enable Google Sign-In

1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → Enable → Save

### Create Firestore Database

1. Firebase Console → **Firestore Database** → Create database
2. Choose **Start in test mode** (for quick setup) or **production mode**
3. Select a location

### Firestore Security Rules

In Firestore → Rules, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures users can only read/write their own data.

### Authorized Domains (for GitHub Pages)

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your GitHub Pages domain:
   - `username.github.io` (user/org site)
   - `username.github.io` if app is at `https://username.github.io/habit-tracker/`
3. `localhost` is already authorized for local testing

---

## 2. GitHub Pages Deployment

### Option A: Deploy from main branch

1. Push your code to a GitHub repository
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` (or `master`), folder: `/ (root)` or your project folder

### Option B: GitHub Actions (included)

A workflow file `.github/workflows/deploy.yml` is included. On push to `main`, it deploys to the `gh-pages` branch.

1. Push your code
2. **Settings** → **Pages** → Source: **Deploy from a branch**
3. Branch: `gh-pages` / folder: `/(root)`

### Important

- Your site URL will be `https://username.github.io/habit-tracker/` if the repo is `habit-tracker`
- Add `username.github.io` to Firebase Authorized domains
- Ensure `firebase-config.js` is committed (with your config). **Do not** commit API keys if the repo is public and you're concerned — Firebase API keys are safe to expose; security comes from Firestore rules

---

## 3. Local Development

1. Open `index.html` in a browser or use a local server:
   ```bash
   npx serve .
   ```
2. With valid Firebase config, you’ll see the login screen and can sign in with Google
3. Without Firebase config, the app falls back to localStorage (no login)

---

## 4. Data Structure

User data in Firestore:

- **Path:** `users/{userId}`
- **Document:** `{ habits: [...], logs: { "2025-03-05": { "habitId": value }, ... } }`
