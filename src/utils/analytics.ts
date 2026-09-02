"use client";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const QUEUE_KEY = "talatphlu_analytics_pending_v1";

type AnalyticsCollection = "guardian_checkpoints" | "fifth_guardian_submissions";

interface QueuedEntry {
  id: string;
  collectionName: AnalyticsCollection;
  data: Record<string, unknown>;
}

/** Build-time kill switch: logging stays off unless the env var is present. */
const ENABLED = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

let flushing = false;

function canStore(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readQueue(): QueuedEntry[] {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedEntry[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueuedEntry[]): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  } catch {
    /* queue exceeds quota — drop rather than break the app */
  }
}

function createEntryId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function sendEntry(entry: QueuedEntry): Promise<void> {
  await addDoc(collection(db, entry.collectionName), {
    ...entry.data,
    createdAt: serverTimestamp(),
    clientTimestamp: new Date().toISOString(),
  });
}

/** Replay anything buffered while offline, oldest first. */
export async function flushAnalyticsQueue(): Promise<void> {
  if (!ENABLED || flushing) return;
  const queue = readQueue();
  if (!queue.length) return;
  flushing = true;
  const sentIds = new Set<string>();
  try {
    for (const entry of queue) {
      try {
        await sendEntry(entry);
        sentIds.add(entry.id);
      } catch {
        break;
      }
    }
  } finally {
    flushing = false;
  }
  if (sentIds.size) writeQueue(readQueue().filter((entry) => !sentIds.has(entry.id)));
}

/** Fire-and-forget write; buffered to localStorage when offline / failing. */
async function persistOrSend(collectionName: AnalyticsCollection, data: Record<string, unknown>): Promise<void> {
  if (!ENABLED) return;
  await flushAnalyticsQueue();
  const entry: QueuedEntry = { id: createEntryId(), collectionName, data };
  try {
    await sendEntry(entry);
  } catch {
    writeQueue([...readQueue(), entry]);
  }
}

export async function logCheckpointCompletion(data: {
  userName: string;
  guardianId: string;
  guardianName: string;
  element: string;
  answers: Record<string, string>;
}): Promise<void> {
  await persistOrSend("guardian_checkpoints", data);
}

export async function logFifthGuardianSubmission(data: {
  userName: string;
  talatphluBlessing: string;
  personalPromise: string;
}): Promise<void> {
  await persistOrSend("fifth_guardian_submissions", data);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushAnalyticsQueue();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushAnalyticsQueue();
  });
}