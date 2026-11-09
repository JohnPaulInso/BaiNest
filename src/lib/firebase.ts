// (2026-07-13) Initialize Firestore and Storage with helpers. Prev: firestore only
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
export const storage = getStorage(firebaseApp);
export { storageRef, uploadBytes, getDownloadURL };

