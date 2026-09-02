"use client";

import { useCallback, useSyncExternalStore } from "react";
import type {
  AppStorageState,
  FifthGuardianSubmission,
  GuardianId,
} from "@/types/guardian";
import {
  awakenGuardian as awakenGuardianStore,
  readState,
  resetState as resetStore,
  saveUserName as setNameStore,
  submitFifthGuardian as submitFifthGuardianStore,
} from "@/utils/storage";

let currentState: AppStorageState | null = readState();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppStorageState | null {
  return currentState;
}

function getServerSnapshot(): AppStorageState | null {
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

  const awaken = useCallback((id: GuardianId, answers: Record<string, string>) => {
    awakenGuardianStore(id, answers);
    emitChanges();
  }, []);

  const submitFifthGuardian = useCallback(
    (submission: Omit<FifthGuardianSubmission, "completedAt">) => {
      submitFifthGuardianStore(submission);
      emitChanges();
    },
    []
  );

  const reset = useCallback(() => {
    resetStore();
    emitChanges();
  }, []);

  return { state, setName, awaken, submitFifthGuardian, reset };
}