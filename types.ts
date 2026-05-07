
export interface ChineseCharacter {
  character: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  lesson: number;
}

export type PracticeRating = 'hard' | 'easy';

export interface CharacterProgress {
  character: string;
  seenCount: number;
  hardCount: number;
  easyCount: number;
  isHard: boolean;
  completedCycle: number;
  lastReviewedAt: number | null;
}

export interface PracticeSessionStats {
  reviewed: number;
  hard: number;
  easy: number;
}

export type LessonMetadata = Record<number, string>;

export type ProgressMap = Record<string, CharacterProgress>;
