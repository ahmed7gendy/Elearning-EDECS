import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBRDUUjpV4HoCs4enRoRhgJ0oBVuzrk-bg",
  authDomain: "test-9a36d.firebaseapp.com",
  databaseURL: "https://test-9a36d-default-rtdb.firebaseio.com",
  projectId: "test-9a36d",
  storageBucket: "test-9a36d.appspot.com",
  messagingSenderId: "496654712405",
  appId: "1:496654712405:web:03d4d47944a5bc6a251edc",
  measurementId: "G-3JVQE9L9R0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

export { auth, database, storage, ref, set, get, onValue, createUserWithEmailAndPassword, signInWithEmailAndPassword, storageRef, uploadBytes, getDownloadURL };
