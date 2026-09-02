export type GuardianId = 'earth' | 'fire' | 'water' | 'wind';

export interface QuestionOption {
  label: string;
  value: string;
}

export interface GuardianQuestion {
  id: string;
  questionTh: string;
  questionEn: string;
  type: 'text' | 'number' | 'radio';
  options?: string[];
  placeholderTh?: string;
}

export interface GuardianMeta {
  id: GuardianId;
  name: string;
  titleTh: string;
  titleEn: string;
  culture: string;
  direction: string;
  element: string;
  colorName: string;
  themeColor: {
    primary: string;
    secondary: string;
    accent: string;
    bgGradient: string;
  };
  quote: {
    th: string;
    en: string;
  };
  storyTh: string;
  cardImageUrl: string;
  questions: GuardianQuestion[];
  finalMessageTh: string;
  finalMessageEn: string;
  talismanDownloadName: string;
}

export interface UserProgress {
  unlocked: boolean;
  unlockedAt: string | null;
  answers: Record<string, string>;
}

export interface FifthGuardianSubmission {
  talatphluBlessing: string;
  personalPromise: string;
  finalImageUrl: string;
  completedAt: string;
}

export interface AppStorageState {
  version: 2;
  userName: string;
  guardians: Record<GuardianId, UserProgress>;
  fifthGuardian: FifthGuardianSubmission | null;
  createdAt: string;
  lastActiveDate: string;
}