import type { GuardianId, GuardiansState } from "@/types/guardian";
import { GUARDIAN_ORDER } from "@/data/guardians";

export const STORAGE_KEY = "talatphlu_guardians_state_v1";

const EMPTY_CARDS = (): GuardiansState["cards"] => ({
  fire: null,
  earth: null,
  wind: null,
  water: null,
});

/**
 * In-memory fallback so the app keeps working when localStorage is
 * unavailable (private browsing, sandboxed iframes, storage blocked).
 */
const memoryState: { value: GuardiansState | null } = { value: null };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function defaultState(): GuardiansState {
  return {
    version: 1,
    playerName: "",
    cards: EMPTY_CARDS(),
    createdAt: new Date().toISOString(),
  };
}

/** Read the persisted state. Returns `null` when nothing is stored yet. */
export function readState(): GuardiansState | null {
  if (!canUseStorage()) return memoryState.value;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuardiansState>;
    if (!parsed || parsed.version !== 1) return null;

    const merged = defaultState();
    if (typeof parsed.playerName === "string") merged.playerName = parsed.playerName;
    if (typeof parsed.createdAt === "string") merged.createdAt = parsed.createdAt;
    if (typeof parsed.completedAt === "string") merged.completedAt = parsed.completedAt;
    if (parsed.cards && typeof parsed.cards === "object") {
      for (const id of GUARDIAN_ORDER) {
        const card = (parsed.cards as Record<string, unknown>)[id];
        if (card && typeof card === "object") {
          merged.cards[id] = card as GuardiansState["cards"][GuardianId];
        }
      }
    }
    return merged;
  } catch {
    return memoryState.value;
  }
}

/** Read state or create + persist a fresh one. */
export function getState(): GuardiansState {
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

export function saveState(state: GuardiansState): GuardiansState {
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
export function setPlayerName(name: string): GuardiansState {
  const state = getState();
  return saveState({ ...state, playerName: name.trim() });
}

/** Record an unlocked guardian card and return the updated state. */
export function collectCard(guardianId: GuardianId, blessing: string): GuardiansState {
  const state = getState();
  const playerName = state.playerName.trim();

  return saveState({
    ...state,
    playerName,
    cards: {
      ...state.cards,
      [guardianId]: {
        guardianId,
        playerName,
        blessing,
        unlockedAt: new Date().toISOString(),
      },
    },
  });
}

export function hasCollected(guardianId: GuardianId): boolean {
  return Boolean(getState().cards[guardianId]);
}

export function getCollectedCount(): number {
  const state = getState();
  return GUARDIAN_ORDER.filter((id) => state.cards[id]).length;
}

export function isComplete(): boolean {
  return GUARDIAN_ORDER.every((id) => getState().cards[id] !== null);
}

/** Mark completion (set once on the /final-card page). */
export function markCompleted(): GuardiansState {
  const state = getState();
  if (GUARDIAN_ORDER.every((id) => state.cards[id])) {
    if (!state.completedAt) {
      return saveState({ ...state, completedAt: new Date().toISOString() });
    }
  }
  return state;
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