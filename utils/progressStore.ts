import { CharacterProgress } from '../types';
import { CHINESE_CHARACTERS } from '../constants/characters';
import type { ChineseCharacter, PracticeRating } from '../types';

export type ProgressMap = Record<string, CharacterProgress>;

export interface StoredPracticeState {
  currentCycle: number;
  progressMap: ProgressMap;
}

export const STORAGE_KEY = 'vnft-character-progress-v2';
export const LEGACY_STORAGE_KEY = 'vnft-character-progress-v1';

export const CHARACTER_LOOKUP = CHINESE_CHARACTERS.reduce<Record<string, ChineseCharacter>>((lookup, entry) => {
  lookup[entry.character] = entry;
  return lookup;
}, {});

export const CHARACTER_KEYS = new Set(CHINESE_CHARACTERS.map(({ character }) => character));

export const createProgressRecord = (character: string): CharacterProgress => ({
  character,
  seenCount: 0,
  hardCount: 0,
  easyCount: 0,
  isHard: false,
  completedCycle: -1,
  lastReviewedAt: null,
});

const toNonNegativeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

export const sanitizeProgress = (raw: unknown): ProgressMap => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  return Object.entries(raw as Record<string, unknown>).reduce<ProgressMap>((progressMap, [character, value]) => {
    if (!CHARACTER_KEYS.has(character) || !value || typeof value !== 'object' || Array.isArray(value)) {
      return progressMap;
    }

    const entry = value as Partial<CharacterProgress> & {
      lapses?: unknown;
      streak?: unknown;
    };

    progressMap[character] = {
      character,
      seenCount: toNonNegativeNumber(entry.seenCount),
      hardCount: toNonNegativeNumber(entry.hardCount, toNonNegativeNumber(entry.lapses)),
      easyCount: toNonNegativeNumber(entry.easyCount, toNonNegativeNumber(entry.streak)),
      isHard: Boolean(entry.isHard),
      completedCycle:
        typeof entry.completedCycle === 'number' && Number.isFinite(entry.completedCycle)
          ? Math.floor(entry.completedCycle)
          : -1,
      lastReviewedAt:
        typeof entry.lastReviewedAt === 'number' && Number.isFinite(entry.lastReviewedAt)
          ? entry.lastReviewedAt
          : null,
    };

    return progressMap;
  }, {});
};

export const loadStoredState = (): StoredPracticeState => {
  if (typeof window === 'undefined') {
    return {
      currentCycle: 0,
      progressMap: {},
    };
  }

  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current) as Partial<StoredPracticeState> | Record<string, unknown>;
      return {
        currentCycle:
          typeof parsed.currentCycle === 'number' && Number.isFinite(parsed.currentCycle)
            ? Math.max(0, Math.floor(parsed.currentCycle))
            : 0,
        progressMap: sanitizeProgress('progressMap' in parsed ? parsed.progressMap : parsed),
      };
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      return {
        currentCycle: 0,
        progressMap: sanitizeProgress(JSON.parse(legacy)),
      };
    }
  } catch {
    return {
      currentCycle: 0,
      progressMap: {},
    };
  }

  return {
    currentCycle: 0,
    progressMap: {},
  };
};

export function applyRating(
  progress: CharacterProgress,
  rating: PracticeRating,
  now: number,
): CharacterProgress {
  if (rating === 'hard') {
    return {
      ...progress,
      seenCount: progress.seenCount + 1,
      hardCount: progress.hardCount + 1,
      isHard: true,
      lastReviewedAt: now,
    };
  }
  return {
    ...progress,
    seenCount: progress.seenCount + 1,
    easyCount: progress.easyCount + 1,
    isHard: false,
    lastReviewedAt: now,
  };
}
