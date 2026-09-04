/* =========================================
   CONFIGURACIÓN DE FIREBASE
   =========================================
   1. Ve a la consola de Firebase > tu proyecto > ⚙️ Configuración del proyecto
   2. Baja hasta "Tus apps" > selecciona tu app web
   3. Copia el objeto firebaseConfig y pégalo abajo, reemplazando el de ejemplo.
========================================= */

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyaHaS8YI_-KYbugkDSerWCpeohZ6J2wc",
  authDomain: "patitas-felices-cd61c.firebaseapp.com",
  projectId: "patitas-felices-cd61c",
  storageBucket: "patitas-felices-cd61c.firebasestorage.app",
  messagingSenderId: "903085013158",
  appId: "1:903085013158:web:8bf770ac9cd58b2a681c67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);