import type { LessonMetadata, ChineseCharacter } from '../types';

/** Auto-generate lesson labels from character data */
export function buildLessonMetadata(characters: ChineseCharacter[]): LessonMetadata {
  const lessons = new Set(characters.map((c) => c.lesson));
  const metadata: LessonMetadata = {};
  for (const lesson of lessons) {
    metadata[lesson] = `Bài ${lesson}`;
  }
  return metadata;
}

/** Group characters by lesson number */
export function getCharactersByLesson(
  characters: ChineseCharacter[],
): Record<number, ChineseCharacter[]> {
  const grouped: Record<number, ChineseCharacter[]> = {};
  for (const char of characters) {
    if (!grouped[char.lesson]) {
      grouped[char.lesson] = [];
    }
    grouped[char.lesson].push(char);
  }
  return grouped;
}

/** Get sorted list of unique lesson numbers from character data */
export function getAvailableLessons(
  characters: ChineseCharacter[],
): number[] {
  const lessons = new Set<number>();
  for (const char of characters) {
    lessons.add(char.lesson);
  }
  return Array.from(lessons).sort((a, b) => a - b);
}

// Pre-built metadata from the actual character data
import { CHINESE_CHARACTERS } from './characters';
export const LESSON_METADATA: LessonMetadata = buildLessonMetadata(CHINESE_CHARACTERS);
