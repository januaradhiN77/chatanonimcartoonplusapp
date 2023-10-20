// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"

import {getAuth, GoogleAuthProvider} from 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqXiYy-Ztr8KEmY1TOptV_k3sUCSC1FBs",
  authDomain: "xtkj2database.firebaseapp.com",
  projectId: "xtkj2database",
  storageBucket: "xtkj2database.appspot.com",
  messagingSenderId: "568446372958",
  appId: "1:568446372958:web:e74d3674634786826db8cf",
  measurementId: "G-WQX40JZ709"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();