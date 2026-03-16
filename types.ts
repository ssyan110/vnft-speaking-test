
export interface Question {
  pinyin: string;
  chinese: string;
}

export interface ChineseCharacter {
  character: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  radical: string;
  characterType: string;
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
