import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0078533526",
  appId: "1:956205630002:web:af2dab8c20ff8c8d0e322b",
  apiKey: "AIzaSyBO2QV3bjv7WrjMF5gUw2lhbxSWQBGYsHs",
  authDomain: "gen-lang-client-0078533526.firebaseapp.com",
  storageBucket: "gen-lang-client-0078533526.firebasestorage.app",
  messagingSenderId: "956205630002",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-flowblog-755e4759-e218-40e2-bd33-595255596e9c");
export const auth = getAuth(app);
