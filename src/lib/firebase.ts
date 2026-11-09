// (2026-07-13) Initialize Firebase and Firestore. Prev: missing firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN4f7W8vU8te3bf9s123IsdrZq6yfu4wU",
  authDomain: "bainest-1.firebaseapp.com",
  projectId: "bainest-1",
  storageBucket: "bainest-1.firebasestorage.app",
  messagingSenderId: "803797867978",
  appId: "1:803797867978:web:29fe06bc4803caa0ff4333",
  measurementId: "G-JN01VZRMZD",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);
