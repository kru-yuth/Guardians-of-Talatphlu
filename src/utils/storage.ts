import {
  GUARDIAN_ORDER,
} from "@/data/guardians";
import type {
  AppStorageState,
  FifthGuardianSubmission,
  GuardianId,
  UserProgress,
} from "@/types/guardian";

export const STORAGE_KEY = "talatphlu_guardians_state_v2";

const EMPTY_GUARDIANS = (): Record<GuardianId, UserProgress> => ({
  fire: { unlocked: false, unlockedAt: null, answers: {} },
  earth: { unlocked: false, unlockedAt: null, answers: {} },
  wind: { unlocked: false, unlockedAt: null, answers: {} },
  water: { unlocked: false, unlockedAt: null, answers: {} },
});

/**
 * In-memory fallback so the app keeps working when localStorage is
 * unavailable (private browsing, sandboxed iframes, storage blocked).
 */
const memoryState: { value: AppStorageState | null } = { value: null };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function defaultState(): AppStorageState {
  return {
    version: 2,
    userName: "",
    guardians: EMPTY_GUARDIANS(),
    fifthGuardian: null,
    createdAt: new Date().toISOString(),
    lastActiveDate: getTodayDateString(),
  };
}

/** Local calendar date, e.g. "2026-09-02". */
const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Read the persisted state. Returns `null` when nothing is stored yet. */
export function readState(): AppStorageState | null {
  if (!canUseStorage()) return memoryState.value;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppStorageState>;
    if (!parsed || parsed.version !== 2) return null;

    // Daily midnight reset: every new day starts a fresh ritual.
    const today = getTodayDateString();
    if (parsed.lastActiveDate !== today) {
      const resetState: AppStorageState = {
        version: 2,
        userName: typeof parsed.userName === "string" ? parsed.userName : "",
        lastActiveDate: today,
        guardians: EMPTY_GUARDIANS(),
        fifthGuardian: null,
        createdAt:
          typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      };
      saveState(resetState);
      return resetState;
    }

    const merged = defaultState();
    if (typeof parsed.userName === "string") merged.userName = parsed.userName;
    if (typeof parsed.createdAt === "string") merged.createdAt = parsed.createdAt;
    if (parsed.guardians && typeof parsed.guardians === "object") {
      for (const id of GUARDIAN_ORDER) {
        const entry = (parsed.guardians as Record<string, Partial<UserProgress> | undefined>)[id];
        if (entry && typeof entry === "object") {
          merged.guardians[id] = {
            unlocked: Boolean(entry.unlocked),
            unlockedAt: typeof entry.unlockedAt === "string" ? entry.unlockedAt : null,
            answers:
              entry.answers && typeof entry.answers === "object" ? { ...entry.answers } : {},
          };
        }
      }
    }
    if (parsed.fifthGuardian && typeof parsed.fifthGuardian === "object") {
      const f = parsed.fifthGuardian as Partial<FifthGuardianSubmission>;
      merged.fifthGuardian = {
        talatphluBlessing: typeof f.talatphluBlessing === "string" ? f.talatphluBlessing : "",
        personalPromise: typeof f.personalPromise === "string" ? f.personalPromise : "",
        finalImageUrl: typeof f.finalImageUrl === "string" ? f.finalImageUrl : "",
        completedAt: typeof f.completedAt === "string" ? f.completedAt : "",
      };
    }
    return merged;
  } catch {
    return memoryState.value;
  }
}

/** Read state or create + persist a fresh one. */
export function getState(): AppStorageState {
  const existing = readState();
  if (existing) return existing;
  const fresh = defaultState();
  saveState(fresh);
  return fresh;
}

/**
 * Alias of `getState()` used by the dashboard. Returns the full persisted
 * state (never `null`), so the UI can always render all 4 guardian slots.
 */
export const getStoredState = getState;

export function saveState(state: AppStorageState): AppStorageState {
  if (!canUseStorage()) {
    memoryState.value = state;
    return state;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    memoryState.value = state;
  }
  return state;
}

/** Set the player's name (first visit only). */
export function saveUserName(name: string): AppStorageState {
  return saveState({ ...getState(), userName: name.trim() });
}

/**
 * Record an "awakened" guardian together with the answers collected during
 * the multi-question ritual. Existing answers are merged, so a re-run of the
 * ritual only updates the answered fields.
 */
export function awakenGuardian(
  guardianId: GuardianId,
  answers: Record<string, string>
): AppStorageState {
  const state = getState();
  const existing = state.guardians[guardianId];
  return saveState({
    ...state,
    guardians: {
      ...state.guardians,
      [guardianId]: {
        unlocked: true,
        unlockedAt: existing.unlockedAt ?? new Date().toISOString(),
        answers: { ...existing.answers, ...answers },
      },
    },
  });
}

/** Persist the completed 5th Guardian ceremony card (incl. the image). */
export function submitFifthGuardian(
  submission: Omit<FifthGuardianSubmission, "completedAt">
): AppStorageState {
  const state = getState();
  const previous = state.fifthGuardian;
  return saveState({
    ...state,
    fifthGuardian: {
      talatphluBlessing: submission.talatphluBlessing,
      personalPromise: submission.personalPromise,
      finalImageUrl: submission.finalImageUrl,
      completedAt: previous?.completedAt ?? new Date().toISOString(),
    },
  });
}

export function hasUnlocked(guardianId: GuardianId): boolean {
  return getState().guardians[guardianId].unlocked;
}

export function getUnlockedCount(): number {
  const state = getState();
  return GUARDIAN_ORDER.filter((id) => state.guardians[id].unlocked).length;
}

export function isAwakeningComplete(): boolean {
  return GUARDIAN_ORDER.every((id) => getState().guardians[id].unlocked);
}

export function isCeremonyDone(): boolean {
  return Boolean(getState().fifthGuardian?.completedAt && getState().fifthGuardian?.finalImageUrl);
}

/** Wipe all progress (used by the demo reset control). */
export function resetState(): void {
  memoryState.value = null;
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* no-op */
    }
  }
}

/** Human friendly Thai date, e.g. "30 สิงหาคม 2569". */
export function formatThaiDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}