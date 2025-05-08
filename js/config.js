// Import the functions you need from the SDKs you need
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuT1B9MeO8CS-E9E1Eaqv1EsXDcTELFNw",
  authDomain: "exam-42167.firebaseapp.com",
  projectId: "exam-42167",
  storageBucket: "exam-42167.appspot.com",
  messagingSenderId: "770330396766",
  appId: "1:770330396766:web:6dd30342b827657b288ccf",
  measurementId: "G-QM1DVYB2BX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the auth and db for use in other files
export { auth, db };