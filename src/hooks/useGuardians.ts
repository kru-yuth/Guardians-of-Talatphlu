"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GuardianId, GuardiansState } from "@/types/guardian";
import {
  collectCard as collectCardStore,
  markCompleted as markCompletedStore,
  readState,
  resetState as resetStore,
  setPlayerName as setNameStore,
} from "@/utils/storage";

let currentState: GuardiansState | null = readState();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): GuardiansState | null {
  return currentState;
}

function getServerSnapshot(): GuardiansState | null {
  return null;
}

function emitChanges(): void {
  currentState = readState();
  for (const listener of listeners) listener();
}

/** Reactive wrapper around the localStorage-backed guardians state. */
export function useGuardians() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setName = useCallback((name: string) => {
    setNameStore(name);
    emitChanges();
  }, []);

  const collect = useCallback((id: GuardianId, blessing: string) => {
    collectCardStore(id, blessing);
    emitChanges();
  }, []);

  const markCompleted = useCallback(() => {
    markCompletedStore();
    emitChanges();
  }, []);

  const reset = useCallback(() => {
    resetStore();
    emitChanges();
  }, []);

  return { state, setName, collect, markCompleted, reset };
}