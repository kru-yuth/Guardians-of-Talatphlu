export type GuardianId = "fire" | "earth" | "wind" | "water";

export interface Guardian {
  id: GuardianId;
  /** English element name, e.g. "Fire" */
  element: string;
  /** Thai element name, e.g. "ไฟ" */
  elementThai: string;
  /** Guardian title, e.g. "ผู้พิทักษ์ไฟ" */
  title: string;
  /** Community descriptor in English, e.g. "Chinese Guardian" */
  community: string;
  /** Community descriptor in Thai, e.g. "ผู้พิทักษ์จีน" */
  communityThai: string;
  /** Compass direction in English, e.g. "North" */
  directionEn: string;
  /** Compass direction in Thai, e.g. "ทิศเหนือ" */
  directionThai: string;
  /** Motif in English, e.g. "Lion" */
  motif: string;
  /** Motif in Thai, e.g. "สิงโต" */
  motifThai: string;
  /** One-line blessing assigned to this element */
  blessing: string;
  /** Primary theme color, hex */
  primary: string;
  /** Accent theme color, hex */
  accent: string;
  /** Static artwork asset, e.g. "/images/card-fire.jpg" */
  image: string;
  /** The 3 pre-defined commitment / blessing choices */
  choices: string[];
}

export interface CollectedCard {
  guardianId: GuardianId;
  playerName: string;
  blessing: string;
  /** ISO 8601 timestamp of the unlock */
  unlockedAt: string;
}

/**
 * Persisted user state, stored under `talatphlu_guardians_state_v1`
 * in localStorage. All keys are present so lookups never need guards.
 */
export interface GuardiansState {
  version: 1;
  playerName: string;
  cards: Record<GuardianId, CollectedCard | null>;
  /** Set once the user lands on /final-card with all 4 guardians */
  completedAt?: string;
  createdAt: string;
}