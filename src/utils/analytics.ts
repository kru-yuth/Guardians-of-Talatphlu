"use client";

import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const QUEUE_KEY = "talatphlu_analytics_pending_v1";

type AnalyticsCollection = "guardian_checkpoints" | "fifth_guardian_submissions";

interface QueuedEntry {
  id: string;
  collectionName: AnalyticsCollection;
  data: Record<string, unknown>;
}

/** Build-time kill switch: logging stays off unless the env var is present. */
export const ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

if (typeof window !== "undefined") {
  if (ANALYTICS_ENABLED) {
    console.log("[analytics] enabled — NEXT_PUBLIC_FIREBASE_PROJECT_ID present in bundle");
  } else {
    console.error(
      "[analytics] DISABLED — NEXT_PUBLIC_FIREBASE_PROJECT_ID was MISSING at build time. " +
        "Set it in Vercel and redeploy with Clear Build Cache."
    );
  }
}

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

/**
 * Surface analytics failures to the console with an explicit error and, when
 * the environment allows it, through a DOM event the UI can listen for and
 * turn into an on-screen toast. Never throws — analytics must stay silent-safe.
 */
function reportFailure(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Firestore analytics] ${action} failed: ${message}`, error);
  if (typeof window !== "undefined" && typeof window.CustomEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent("talatphlu:analytics-error", { detail: { action, message } })
      );
    } catch {
      /* ignore — event dispatch is best-effort */
    }
  }
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
  if (!ANALYTICS_ENABLED || flushing) return;
  const queue = readQueue();
  if (!queue.length) return;
  flushing = true;
  const sentIds = new Set<string>();
  try {
    for (const entry of queue) {
      try {
        await sendEntry(entry);
        sentIds.add(entry.id);
      } catch (error) {
        reportFailure(`flush queued ${entry.collectionName}`, error);
        break;
      }
    }
  } finally {
    flushing = false;
  }
  if (sentIds.size) writeQueue(readQueue().filter((entry) => !sentIds.has(entry.id)));
}

/**
 * Fire-and-forget write; buffered to localStorage when offline / failing.
 * Returns `"sent" | "queued" | "disabled"` so callers can reflect the result.
 * Note: this is not awaited by callers today; failed sent-writes are logged in
 * error and queued for a later replay attempt.
 */
async function persistOrSend(
  collectionName: AnalyticsCollection,
  data: Record<string, unknown>
): Promise<"disabled" | "sent" | "queued"> {
  if (!ANALYTICS_ENABLED) {
    console.warn("[Firestore analytics] disabled — NEXT_PUBLIC_FIREBASE_PROJECT_ID not set at build");
    return "disabled";
  }
  try {
    await flushAnalyticsQueue();
  } catch (error) {
    reportFailure("flush queue", error);
  }
  const entry: QueuedEntry = { id: createEntryId(), collectionName, data };
  try {
    await sendEntry(entry);
    return "sent";
  } catch (error) {
    reportFailure(`write to ${collectionName}`, error);
    writeQueue([...readQueue(), entry]);
    return "queued";
  }
}

export async function logCheckpointCompletion(data: {
  userName: string;
  guardianId: string;
  guardianName: string;
  element: string;
  answers: Record<string, string>;
}): Promise<"disabled" | "sent" | "queued"> {
  return persistOrSend("guardian_checkpoints", data);
}

export async function logFifthGuardianSubmission(data: {
  userName: string;
  talatphluBlessing: string;
  personalPromise: string;
}): Promise<"disabled" | "sent" | "queued"> {
  return persistOrSend("fifth_guardian_submissions", data);
}

/**
 * Temporary diagnostic probe: verify client → Firestore connectivity and write
 * permissions. Writes then removes a throwaway doc in a `_diagnostics` sentinel
 * collection. Logs success/failure explicitly and returns the outcome.
 */
export async function pingFirestore(): Promise<{ ok: boolean; message: string }> {
  if (!ANALYTICS_ENABLED) {
    const msg = "Firestore analytics disabled: NEXT_PUBLIC_FIREBASE_PROJECT_ID not set at build";
    console.error(`[Firestore analytics] ${msg}`);
    return { ok: false, message: msg };
  }
  const ref = doc(
    collection(db, "_diagnostics"),
    `ping-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  try {
    await getDoc(doc(collection(db, "_diagnostics"), "__probe__"));
  } catch {
    /* read probe is best-effort; write is the real test */
  }
  try {
    await addDoc(collection(db, "_diagnostics"), {
      kind: "ping",
      clientTimestamp: new Date().toISOString(),
    });
    try {
      await getDoc(ref);
    } catch {
      /* ignore cleanup read errors */
    }
    const msg = "Firestore reachable — write permission confirmed (see _diagnostics collection)";
    console.log(`[Firestore analytics] ${msg}`);
    return { ok: true, message: msg };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    reportFailure("pingFirestore write", error);
    return { ok: false, message };
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void flushAnalyticsQueue();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushAnalyticsQueue();
  });
}
