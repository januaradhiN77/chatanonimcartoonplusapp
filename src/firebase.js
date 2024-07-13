// Import the function you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"

import {getAuth, GoogleAuthProvider} from 'firebase/auth'


const firebaseConfig = {
  apiKey: "AIzaSyCxkV1s7mJ7IJp4JSI35RBGitUwV3GbPk4",
  authDomain: "chatanonim-1ce68.firebaseapp.com",
  projectId: "chatanonim-1ce68",
  storageBucket: "chatanonim-1ce68.appspot.com",
  messagingSenderId: "132513460666",
  appId: "1:132513460666:web:2c570a51288d76e8732d83",
  measurementId: "G-50W8NWDFLV"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();