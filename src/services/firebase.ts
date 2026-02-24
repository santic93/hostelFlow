import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAj3dLovAcgdddUAxIxOCMmont0PIOjXXU",
    authDomain: "hostelflow-dev.firebaseapp.com",
    projectId: "hostelflow-dev",
    storageBucket: "hostelflow-dev.firebasestorage.app",
    messagingSenderId: "8613051030",
    appId: "1:8613051030:web:fb6c6217e2c08d7c76e0b7",
    measurementId: "G-68ZZ9J03HS"
};

const app = initializeApp(firebaseConfig);



export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);