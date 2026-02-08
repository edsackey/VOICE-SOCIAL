
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc-WUG1uZHA30RQDuh5Fy6krfK5YkWQ64",
  authDomain: "voice-room-6adc0.firebaseapp.com",
  projectId: "voice-room-6adc0",
  storageBucket: "voice-room-6adc0.firebasestorage.app",
  messagingSenderId: "79134419032",
  appId: "1:79134419032:web:3f4ea79e8be8dff8dcc22d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
