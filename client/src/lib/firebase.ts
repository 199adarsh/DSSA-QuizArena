import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD7YBXficoM_mMUilkk_Tu2XAFM_Czh6XQ",
  authDomain: "techguess-pro-dssa.firebaseapp.com",
  projectId: "techguess-pro-dssa",
  storageBucket: "techguess-pro-dssa.firebasestorage.app",
  messagingSenderId: "966351355109",
  appId: "1:966351355109:web:39d42f83f5fa551732e80c",
  measurementId: "G-P6XP9W1FXS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
