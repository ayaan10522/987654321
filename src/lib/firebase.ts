import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, push, update, remove, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDSJaM56A0u41pihlc19zf-kIUtPJ7V618",
  authDomain: "sysss-35c0b.firebaseapp.com",
  databaseURL: "https://sysss-35c0b-default-rtdb.firebaseio.com",
  projectId: "sysss-35c0b",
  storageBucket: "sysss-35c0b.firebasestorage.app",
  messagingSenderId: "1060568174124",
  appId: "1:1060568174124:web:b5bc2ec7f6d08f7f818b89",
  measurementId: "G-YMBL7JNNR7"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Database helper functions
export const dbRef = (path: string) => ref(database, path);

export const dbSet = async (path: string, data: any) => {
  return set(ref(database, path), data);
};

export const dbGet = async (path: string) => {
  const snapshot = await get(ref(database, path));
  return snapshot.exists() ? snapshot.val() : null;
};

export const dbPush = async (path: string, data: any) => {
  const newRef = push(ref(database, path));
  await set(newRef, data);
  return newRef.key;
};

export const dbUpdate = async (path: string, data: any) => {
  return update(ref(database, path), data);
};

export const dbRemove = async (path: string) => {
  return remove(ref(database, path));
};

export const dbListen = (path: string, callback: (data: any) => void) => {
  return onValue(ref(database, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
};

// Initialize default admin if not exists
export const initializeAdmin = async () => {
  const adminData = await dbGet('users/admin');
  if (!adminData) {
    await dbSet('users/admin', {
      id: 'admin',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Principal Administrator',
      createdAt: new Date().toISOString()
    });
  }
};

export { ref, onValue };
