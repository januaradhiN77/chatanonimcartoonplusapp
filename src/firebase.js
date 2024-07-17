// Import the function you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"

import {getAuth, GoogleAuthProvider} from 'firebase/auth'


const firebaseConfig = {
  apiKey: "AIzaSyCtmopdloaAJPjsEp7E1YjeQyocnNnIjVA",
  authDomain: "cplus-53913.firebaseapp.com",
  projectId: "cplus-53913",
  storageBucket: "cplus-53913.appspot.com",
  messagingSenderId: "234769813033",
  appId: "1:234769813033:web:effbe37df2e9b99ea29638",
  measurementId: "G-DH3ZY6PRYP"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();