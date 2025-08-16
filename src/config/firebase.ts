// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMUN7n7U1yt7z4HmwlXVS0y-b55jpLaO0",
  authDomain: "importationf.firebaseapp.com",
  projectId: "importationf",
  storageBucket: "importationf.firebasestorage.app",
  messagingSenderId: "570572974185",
  appId: "1:570572974185:web:693fc4b376bbc8ea519af8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;