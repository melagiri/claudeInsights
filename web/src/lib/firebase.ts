import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Initialize Firebase with user's config
 */
export function initializeFirebase(config: FirebaseConfig): { app: FirebaseApp; db: Firestore } {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    app = initializeApp(config);
  }
  db = getFirestore(app);
  return { app, db };
}

/**
 * Get Firestore instance
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return db;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return db !== null;
}

/**
 * Load config from localStorage
 */
export function loadFirebaseConfig(): FirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('claudeinsight_firebase_config');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as FirebaseConfig;
  } catch {
    return null;
  }
}

/**
 * Save config to localStorage
 */
export function saveFirebaseConfig(config: FirebaseConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('claudeinsight_firebase_config', JSON.stringify(config));
}

/**
 * Clear stored config
 */
export function clearFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('claudeinsight_firebase_config');
}
