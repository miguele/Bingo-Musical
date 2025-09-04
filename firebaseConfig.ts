// Import the functions you need from the SDKs you need
// FIX: Switched to a namespaced import for 'firebase/app' to work around a module
// resolution issue that was preventing 'initializeApp' and 'getApps' from being found.
import * as firebaseApp from "firebase/app";
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
const app = firebaseApp.getApps().length === 0 ? firebaseApp.initializeApp(firebaseConfig) : firebaseApp.getApps()[0];

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);