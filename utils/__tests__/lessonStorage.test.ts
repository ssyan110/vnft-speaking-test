import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  saveLessonSelection,
  loadLessonSelection,
  clearLessonSelection,
} from '../lessonStorage';

beforeEach(() => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
  // Ensure `typeof window !== 'undefined'` so the guards in lessonStorage pass
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
});

describe('Feature: spaced-repetition-practice, Property 1: Lesson selection round-trip', () => {
  /**
   * Validates: Requirements 2.4, 5.2
   * For any array of valid lesson numbers, saving and loading back produces an identical array.
   */
  it('saving any array of valid lesson numbers and loading it back produces an identical array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 20 })),
        (lessons) => {
          saveLessonSelection(lessons);
          const loaded = loadLessonSelection();
          expect(loaded).toEqual(lessons);
        },
      ),
      { numRuns: 100 },
    );
  });
});
