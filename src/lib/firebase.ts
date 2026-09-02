"use client";

import { getAnalytics, isSupported } from "firebase/analytics";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyDS0mKo5tvm2gCK2IMNOADYZEaCOOfSJfU",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "guardians-of-talatphlu.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "guardians-of-talatphlu",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "guardians-of-talatphlu.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "892623099540",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:892623099540:web:91a8d4a7f5e7b14d16c681",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-K8J8Z50EH0",
};

let appReference: FirebaseApp | null | undefined;
let analyticsStarted = false;

function getFirebaseApp(): FirebaseApp {
  appReference ??= getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  return appReference;
}

/** Firestore handle shared by the analytics loggers (and any future module). */
export const db = getFirestore(getFirebaseApp());

/**
 * Best-effort Google Analytics bootstrap. Browser only (never during SSR/SSG
 * prerender) and never throws if the environment blocks it — Firestore still
 * works regardless.
 */
export async function ensureAnalytics(): Promise<void> {
  if (typeof window === "undefined" || analyticsStarted) return;
  analyticsStarted = true;
  try {
    if (await isSupported()) getAnalytics(getFirebaseApp());
  } catch {
    /* analytics unavailable — firestore keeps collecting */
  }
}

if (typeof window !== "undefined") {
  void ensureAnalytics();
}