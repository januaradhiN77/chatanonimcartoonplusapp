// Import the function you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"

import {getAuth, GoogleAuthProvider} from 'firebase/auth'


const firebaseConfig = {
  apiKey: "AIzaSyClbyF9f_5Je27H94Dq4DBWPdExbAZKT5w",
  authDomain: "cartoonappchat.firebaseapp.com",
  projectId: "cartoonappchat",
  storageBucket: "cartoonappchat.appspot.com",
  messagingSenderId: "674207415793",
  appId: "1:674207415793:web:416c420038d990e2c79850",
  measurementId: "G-WTWJM0M6FG"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();