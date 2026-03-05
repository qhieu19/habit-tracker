/**
 * Firebase Configuration
 * Replace these values with your Firebase project credentials.
 * Get them from: Firebase Console → Project Settings → General → Your apps
 */
const firebaseConfig = {
  apiKey: "AIzaSyBGJ6CAFsXEPaetz0oFAz8BQi09dsbzKw4",
  authDomain: "habit-tracker-by-hieu19.firebaseapp.com",
  projectId: "habit-tracker-by-hieu19",
  storageBucket: "habit-tracker-by-hieu19.firebasestorage.app",
  messagingSenderId: "706704481680",
  appId: "1:706704481680:web:d642ec945f39483c26e715"
};

// Initialize Firebase (only if config is valid)
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
}
