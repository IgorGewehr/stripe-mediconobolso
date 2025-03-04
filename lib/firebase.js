// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// Substitua os valores abaixo pelas credenciais do seu projeto Firebase.
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3VIRZ-rCbRVC4eybhJNG-dMdw1LVMF9I",
    authDomain: "projeto-med-19a8b.firebaseapp.com",
    projectId: "projeto-med-19a8b",
    storageBucket: "projeto-med-19a8b.firebasestorage.app",
    messagingSenderId: "428515821255",
    appId: "1:428515821255:web:f2b6d3c348174dadf960e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que serão utilizados no seu projeto.
export let auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

