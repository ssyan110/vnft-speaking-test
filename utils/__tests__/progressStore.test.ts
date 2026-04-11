import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { CHINESE_CHARACTERS } from '../../constants/characters';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  CHARACTER_KEYS,
  loadStoredState,
  applyRating,
} from '../progressStore';
import type { ProgressMap } from '../progressStore';
import type { CharacterProgress, PracticeRating } from '../../types';

const characterKeysArray = Array.from(CHARACTER_KEYS);

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
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis;
  }
});

/**
 * Arbitrary for a single CharacterProgress record given a character key.
 */
const arbCharacterProgress = (character: string): fc.Arbitrary<CharacterProgress> =>
  fc.record({
    character: fc.constant(character),
    seenCount: fc.nat({ max: 1000 }),
    hardCount: fc.nat({ max: 1000 }),
    easyCount: fc.nat({ max: 1000 }),
    isHard: fc.boolean(),
    completedCycle: fc.integer({ min: -1, max: 100 }),
    lastReviewedAt: fc.oneof(
      fc.constant(null),
      fc.nat({ max: 2_000_000_000_000 }),
    ),
  });

/**
 * Arbitrary for a valid ProgressMap using actual character keys.
 */
const arbProgressMap: fc.Arbitrary<ProgressMap> = fc
  .subarray(characterKeysArray, { minLength: 0, maxLength: characterKeysArray.length })
  .chain((keys) => {
    if (keys.length === 0) return fc.constant({} as ProgressMap);
    const entries = keys.map((key) =>
      arbCharacterProgress(key).map((progress) => [key, progress] as const),
    );
    return fc.tuple(...(entries as [typeof entries[0], ...typeof entries])).map((pairs) =>
      Object.fromEntries(pairs) as ProgressMap,
    );
  });

describe('Feature: spaced-repetition-practice, Property 5: Progress data round-trip', () => {
  /**
   * Validates: Requirements 5.1, 7.1
   * For any valid ProgressMap, saving to localStorage under the v2 key
   * and loading via loadStoredState produces identical field values.
   */
  it('saving a valid ProgressMap and loading via loadStoredState produces identical field values', () => {
    fc.assert(
      fc.property(arbProgressMap, (progressMap) => {
        const stored = { currentCycle: 0, progressMap };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

        const loaded = loadStoredState();

        expect(loaded.currentCycle).toBe(0);

        const originalKeys = Object.keys(progressMap).sort();
        const loadedKeys = Object.keys(loaded.progressMap).sort();
        expect(loadedKeys).toEqual(originalKeys);

        for (const key of originalKeys) {
          const original = progressMap[key];
          const restored = loaded.progressMap[key];

          expect(restored.character).toBe(original.character);
          expect(restored.seenCount).toBe(original.seenCount);
          expect(restored.hardCount).toBe(original.hardCount);
          expect(restored.easyCount).toBe(original.easyCount);
          expect(restored.isHard).toBe(original.isHard);
          expect(restored.completedCycle).toBe(original.completedCycle);
          expect(restored.lastReviewedAt).toBe(original.lastReviewedAt);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('Feature: spaced-repetition-practice, Property 6: Corrupted data resilience', () => {
  /**
   * Validates: Requirements 5.4, 7.3
   * For any arbitrary string stored in the progress localStorage key
   * (including invalid JSON, random bytes, empty strings, and malformed objects),
   * loadStoredState SHALL return a valid state with an empty progressMap
   * and currentCycle = 0 without throwing an exception.
   */
  it('loadStoredState returns valid empty defaults for any arbitrary string in localStorage', () => {
    fc.assert(
      fc.property(fc.string(), (arbitraryString) => {
        localStorage.setItem(STORAGE_KEY, arbitraryString);

        let result: ReturnType<typeof loadStoredState>;
        expect(() => {
          result = loadStoredState();
        }).not.toThrow();

        expect(result!.currentCycle).toBe(0);
        expect(result!.progressMap).toEqual({});
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Arbitrary for a CharacterProgress record with a random valid character key.
 */
const arbProgressRecord: fc.Arbitrary<CharacterProgress> = fc
  .constantFrom(...characterKeysArray)
  .chain((character) => arbCharacterProgress(character));

/**
 * Arbitrary for a PracticeRating.
 */
const arbRating: fc.Arbitrary<PracticeRating> = fc.constantFrom('hard' as const, 'easy' as const);

describe('Feature: spaced-repetition-practice, Property 7: Rating update correctness', () => {
  /**
   * Validates: Requirements 6.2, 6.3, 6.4
   *
   * For any CharacterProgress record and for any rating ("hard" or "easy"),
   * applying the rating SHALL:
   * - increment seenCount by exactly 1,
   * - increment hardCount by 1 if the rating is "hard" (unchanged otherwise),
   * - increment easyCount by 1 if the rating is "easy" (unchanged otherwise),
   * - set lastReviewedAt to the current timestamp.
   */
  it('applying "hard" increments seenCount by 1 and hardCount by 1', () => {
    fc.assert(
      fc.property(arbProgressRecord, fc.nat({ max: 2_000_000_000_000 }), (progress, now) => {
        const result = applyRating(progress, 'hard', now);

        expect(result.seenCount).toBe(progress.seenCount + 1);
        expect(result.hardCount).toBe(progress.hardCount + 1);
        expect(result.easyCount).toBe(progress.easyCount);
        expect(result.lastReviewedAt).toBe(now);
        expect(result.isHard).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('applying "easy" increments seenCount by 1 and easyCount by 1', () => {
    fc.assert(
      fc.property(arbProgressRecord, fc.nat({ max: 2_000_000_000_000 }), (progress, now) => {
        const result = applyRating(progress, 'easy', now);

        expect(result.seenCount).toBe(progress.seenCount + 1);
        expect(result.easyCount).toBe(progress.easyCount + 1);
        expect(result.hardCount).toBe(progress.hardCount);
        expect(result.lastReviewedAt).toBe(now);
        expect(result.isHard).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('lastReviewedAt is set to the provided timestamp for any rating', () => {
    fc.assert(
      fc.property(arbProgressRecord, arbRating, fc.nat({ max: 2_000_000_000_000 }), (progress, rating, now) => {
        const result = applyRating(progress, rating, now);

        expect(result.lastReviewedAt).toBe(now);
        expect(result.seenCount).toBe(progress.seenCount + 1);
      }),
      { numRuns: 100 },
    );
  });
});


describe('Feature: spaced-repetition-practice, Property 8: v1 migration preserves data', () => {
  /**
   * Validates: Requirements 7.2
   *
   * For any valid v1-format progress record (using `lapses` and `streak` field names),
   * loading via loadStoredState SHALL produce a CharacterProgress where
   * hardCount equals the original lapses value and easyCount equals the original streak value.
   */

  /**
   * Arbitrary for a v1-format record for a given character key.
   * v1 records use `lapses` and `streak` instead of `hardCount` and `easyCount`.
   */
  const arbV1Record = (character: string) =>
    fc.record({
      character: fc.constant(character),
      seenCount: fc.nat({ max: 1000 }),
      lapses: fc.nat({ max: 1000 }),
      streak: fc.nat({ max: 1000 }),
      isHard: fc.boolean(),
      completedCycle: fc.integer({ min: -1, max: 100 }),
      lastReviewedAt: fc.oneof(
        fc.constant(null),
        fc.nat({ max: 2_000_000_000_000 }),
      ),
    });

  /**
   * Arbitrary for a v1-format ProgressMap (flat object mapping character keys to v1 records).
   */
  const arbV1ProgressMap = fc
    .subarray(characterKeysArray, { minLength: 1, maxLength: Math.min(20, characterKeysArray.length) })
    .chain((keys) => {
      const entries = keys.map((key) =>
        arbV1Record(key).map((record) => [key, record] as const),
      );
      return fc.tuple(...(entries as [typeof entries[0], ...typeof entries])).map((pairs) =>
        Object.fromEntries(pairs) as Record<string, unknown>,
      );
    });

  it('loading v1-format records maps lapses to hardCount and streak to easyCount', () => {
    fc.assert(
      fc.property(arbV1ProgressMap, (v1Map) => {
        // Store under LEGACY key only; v2 key must NOT be set
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(v1Map));

        const loaded = loadStoredState();

        for (const [key, v1Record] of Object.entries(v1Map)) {
          const v1 = v1Record as { lapses: number; streak: number; seenCount: number };
          const migrated = loaded.progressMap[key];

          expect(migrated).toBeDefined();
          expect(migrated.hardCount).toBe(v1.lapses);
          expect(migrated.easyCount).toBe(v1.streak);
          expect(migrated.seenCount).toBe(v1.seenCount);
        }
      }),
      { numRuns: 100 },
    );
  });
});
