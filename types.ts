
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

export type PracticeRating = 'again' | 'hard' | 'easy';

export interface CharacterProgress {
  character: string;
  box: number;
  streak: number;
  lapses: number;
  seenCount: number;
  lastReviewedAt: number | null;
  nextDueAt: number;
}

export interface PracticeSessionStats {
  reviewed: number;
  again: number;
  hard: number;
  easy: number;
  masteredThisRound: number;
}
