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
 * Parse config from URL parameter (base64 encoded)
 * URL format: ?config=base64encodedconfig
 */
export function parseConfigFromUrl(): FirebaseConfig | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const encodedConfig = params.get('config');

  if (!encodedConfig) return null;

  try {
    // URL-safe base64 decode
    const base64 = encodedConfig
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const decoded = atob(padded);
    const config = JSON.parse(decoded) as FirebaseConfig;

    // Validate required fields
    if (config.apiKey && config.projectId && config.appId) {
      return config;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear config parameter from URL without reload
 */
export function clearConfigFromUrl(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('config');

  window.history.replaceState({}, '', url.toString());
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
