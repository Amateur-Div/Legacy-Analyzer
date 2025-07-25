import { initializeApp, getApp, getApps } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAD54FG62klPsVN-Ep0Ovs0fdbcI5iGwis",
  authDomain: "legacy-codebase.firebaseapp.com",
  projectId: "legacy-codebase",
  storageBucket: "legacy-codebase.firebasestorage.app",
  messagingSenderId: "89526963192",
  appId: "1:89526963192:web:fc5358892ca19aaa96640d",
  measurementId: "G-Z1VBSGV2Z4",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const storage = getStorage(app);
// const analytics = getAnalytics(app);

export { app, auth, db, googleProvider, storage };
