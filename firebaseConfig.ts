// Import the functions you need from the SDKs you need
// FIX: Use named imports for Firebase v9+ to resolve import errors.
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCk72T7OwIOr-pAoID_Y6tne6WqGD2BNNA",
  authDomain: "bodaapp-fb390.firebaseapp.com",
  databaseURL: "https://bodaapp-fb390-default-rtdb.firebaseio.com",
  projectId: "bodaapp-fb390",
  storageBucket: "bodaapp-fb390.firebasestorage.app",
  messagingSenderId: "850787249223",
  appId: "1:850787249223:web:25142251c54f9ab8135562",
  measurementId: "G-Y0247HEVHZ"
};

// Initialize Firebase, preventing re-initialization in HMR environments.
// FIX: Call imported functions directly instead of from a namespace.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
