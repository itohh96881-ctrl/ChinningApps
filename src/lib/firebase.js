import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDRc_gEEbm9jRx3_kob3Wda9U7jiv5ibEM",
    authDomain: "chinningproject.firebaseapp.com",
    projectId: "chinningproject",
    storageBucket: "chinningproject.firebasestorage.app",
    messagingSenderId: "667336211296",
    appId: "1:667336211296:web:e129642f288199b5bdfc05",
    measurementId: "G-JQFXPCG51S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize & Export Services
export const auth = getAuth(app);
export const db = getDatabase(app);
