import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyACmVzKOQxP0SrhsINo_TY3UEMdiTwm5bI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "esd-attendance.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "esd-attendance",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "esd-attendance.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "131556750254",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:131556750254:web:7d5dbb660f316f1600ce3f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GTV5W1N195",
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default app;
