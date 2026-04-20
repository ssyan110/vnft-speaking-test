import { describe, it, expect } from 'vitest';
import { LESSON_METADATA, getCharactersByLesson, getAvailableLessons } from '../lessonData';
import { CHINESE_CHARACTERS } from '../characters';
import type { ChineseCharacter } from '../../types';

const makeChar = (character: string, lesson: number): ChineseCharacter => ({
  character,
  pinyin: 'test',
  hanViet: 'test',
  meaning: 'test',
  lesson,
});

describe('LESSON_METADATA', () => {
  it('has a label for every lesson in the character data', () => {
    const lessons = getAvailableLessons(CHINESE_CHARACTERS);
    for (const lesson of lessons) {
      expect(LESSON_METADATA[lesson]).toBeDefined();
      expect(typeof LESSON_METADATA[lesson]).toBe('string');
    }
  });

  it('labels follow "Bài N" format', () => {
    for (const [key, label] of Object.entries(LESSON_METADATA)) {
      expect(label).toBe(`Bài ${key}`);
    }
  });
});

describe('auto-lesson assignment', () => {
  it('assigns 9 characters per lesson', () => {
    const byLesson = getCharactersByLesson(CHINESE_CHARACTERS);
    const lessons = Object.keys(byLesson).map(Number).sort((a, b) => a - b);
    // All lessons except possibly the last should have exactly 9
    for (let i = 0; i < lessons.length - 1; i++) {
      expect(byLesson[lessons[i]]).toHaveLength(9);
    }
    // Last lesson can have 1–9
    const lastLesson = lessons[lessons.length - 1];
    expect(byLesson[lastLesson].length).toBeGreaterThanOrEqual(1);
    expect(byLesson[lastLesson].length).toBeLessThanOrEqual(9);
  });
});

describe('getCharactersByLesson', () => {
  it('groups characters by their lesson number', () => {
    const chars = [makeChar('一', 1), makeChar('人', 2), makeChar('二', 1)];
    const grouped = getCharactersByLesson(chars);
    expect(Object.keys(grouped).map(Number).sort()).toEqual([1, 2]);
    expect(grouped[1]).toHaveLength(2);
    expect(grouped[2]).toHaveLength(1);
  });

  it('returns empty object for empty input', () => {
    expect(getCharactersByLesson([])).toEqual({});
  });
});

describe('getAvailableLessons', () => {
  it('returns sorted unique lesson numbers', () => {
    const chars = [makeChar('一', 3), makeChar('人', 1), makeChar('二', 3), makeChar('好', 2)];
    expect(getAvailableLessons(chars)).toEqual([1, 2, 3]);
  });

  it('returns empty array for empty input', () => {
    expect(getAvailableLessons([])).toEqual([]);
  });
});
