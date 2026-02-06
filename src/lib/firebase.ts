import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVL3SqUoObnTKL1u3WpAJ6wwSD-BANGJw",
  authDomain: "dead-e4119.firebaseapp.com",
  projectId: "dead-e4119",
  storageBucket: "dead-e4119.firebasestorage.app",
  messagingSenderId: "152555907166",
  appId: "1:152555907166:web:8a7d93f87567f1c599accf",
  measurementId: "G-9M9GCB52X9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
