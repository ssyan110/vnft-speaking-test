import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computeWeight,
  weightedSample,
  sortByWeightWithJitter,
  DEFAULT_WEIGHT_CONFIG,
} from '../selectionEngine';
import type { ChineseCharacter, CharacterProgress } from '../../types';

const baseChar: ChineseCharacter = {
  character: '人',
  pinyin: 'rén',
  hanViet: 'nhân',
  meaning: 'person',
  radical: '人',
  characterType: 'pictographic',
  lesson: 1,
};

function makeProgress(
  overrides: Partial<CharacterProgress> = {},
): CharacterProgress {
  return {
    character: '人',
    seenCount: 10,
    hardCount: 3,
    easyCount: 7,
    isHard: false,
    completedCycle: 0,
    lastReviewedAt: Date.now() - 3600_000, // 1 hour ago
    ...overrides,
  };
}

describe('computeWeight', () => {
  const now = Date.now();
  const maxLesson = 5;

  it('returns baseWeight + full reviewGap when progress is undefined (never seen)', () => {
    const weight = computeWeight(baseChar, undefined, now, maxLesson);
    // errorRate = 0, normalizedGap = 1.0, lessonRecency = 1/5 = 0.2
    const expected =
      DEFAULT_WEIGHT_CONFIG.baseWeight +
      DEFAULT_WEIGHT_CONFIG.errorRateCoeff * 0 +
      DEFAULT_WEIGHT_CONFIG.reviewGapCoeff * 1.0 +
      DEFAULT_WEIGHT_CONFIG.lessonRecencyCoeff * 0.2;
    expect(weight).toBeCloseTo(expected);
  });

  it('returns baseWeight + full reviewGap when lastReviewedAt is null', () => {
    const progress = makeProgress({ lastReviewedAt: null, seenCount: 5, hardCount: 2 });
    const weight = computeWeight(baseChar, progress, now, maxLesson);
    // errorRate = 2/5 = 0.4, normalizedGap = 1.0, lessonRecency = 0.2
    const expected =
      DEFAULT_WEIGHT_CONFIG.baseWeight +
      DEFAULT_WEIGHT_CONFIG.errorRateCoeff * 0.4 +
      DEFAULT_WEIGHT_CONFIG.reviewGapCoeff * 1.0 +
      DEFAULT_WEIGHT_CONFIG.lessonRecencyCoeff * 0.2;
    expect(weight).toBeCloseTo(expected);
  });

  it('handles seenCount === 0 (errorRate = 0)', () => {
    const progress = makeProgress({ seenCount: 0, hardCount: 0, easyCount: 0 });
    const weight = computeWeight(baseChar, progress, now, maxLesson);
    // errorRate = 0
    expect(weight).toBeGreaterThanOrEqual(DEFAULT_WEIGHT_CONFIG.baseWeight);
  });

  it('handles maxLesson === 0 (lessonRecency = 0)', () => {
    const progress = makeProgress();
    const weight = computeWeight(baseChar, progress, now, 0);
    // lessonRecency = 0
    const timeSinceReview = now - progress.lastReviewedAt!;
    const normalizedGap =
      Math.min(timeSinceReview, DEFAULT_WEIGHT_CONFIG.maxReviewGapMs) /
      DEFAULT_WEIGHT_CONFIG.maxReviewGapMs;
    const errorRate = progress.hardCount / progress.seenCount;
    const expected =
      DEFAULT_WEIGHT_CONFIG.baseWeight +
      DEFAULT_WEIGHT_CONFIG.errorRateCoeff * errorRate +
      DEFAULT_WEIGHT_CONFIG.reviewGapCoeff * normalizedGap +
      DEFAULT_WEIGHT_CONFIG.lessonRecencyCoeff * 0;
    expect(weight).toBeCloseTo(expected);
  });

  it('caps review gap at maxReviewGapMs', () => {
    const longAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const progress = makeProgress({ lastReviewedAt: longAgo });
    const weight = computeWeight(baseChar, progress, now, maxLesson);
    // normalizedGap should be capped at 1.0
    const errorRate = progress.hardCount / progress.seenCount;
    const expected =
      DEFAULT_WEIGHT_CONFIG.baseWeight +
      DEFAULT_WEIGHT_CONFIG.errorRateCoeff * errorRate +
      DEFAULT_WEIGHT_CONFIG.reviewGapCoeff * 1.0 +
      DEFAULT_WEIGHT_CONFIG.lessonRecencyCoeff * (1 / 5);
    expect(weight).toBeCloseTo(expected);
  });

  it('accepts partial config overrides', () => {
    const progress = makeProgress({ seenCount: 4, hardCount: 4 }); // errorRate = 1.0
    const weight = computeWeight(baseChar, progress, now, maxLesson, {
      errorRateCoeff: 5.0,
    });
    // errorRate = 1.0, errorRateCoeff overridden to 5.0
    expect(weight).toBeGreaterThan(
      computeWeight(baseChar, progress, now, maxLesson),
    );
  });

  it('weight is always >= baseWeight', () => {
    // All factors are non-negative, so weight should always be >= baseWeight
    const progress = makeProgress({
      seenCount: 100,
      hardCount: 0,
      lastReviewedAt: now, // just reviewed
    });
    const char = { ...baseChar, lesson: 0 };
    const weight = computeWeight(char, progress, now, maxLesson);
    expect(weight).toBeGreaterThanOrEqual(DEFAULT_WEIGHT_CONFIG.baseWeight);
  });
});

describe('Feature: spaced-repetition-practice, Property 2: Weight monotonicity', () => {
  const now = Date.now();

  /**
   * Validates: Requirements 3.2
   * Higher error rate → higher weight (all else equal)
   */
  it('higher error rate produces higher weight', () => {
    fc.assert(
      fc.property(
        // Generate two distinct error rates via hardCount pairs, with a shared seenCount >= 2
        fc.integer({ min: 2, max: 200 }),       // seenCount
        fc.integer({ min: 1, max: 10 }),         // lesson
        fc.integer({ min: 10, max: 20 }),        // maxLesson
        fc.integer({ min: 1, max: 48 }),         // hoursAgo for lastReviewedAt
        (seenCount, lesson, maxLesson, hoursAgo) => {
          // Ensure two distinct hardCounts: lowHard < highHard, both <= seenCount
          const lowHard = Math.floor(seenCount * 0.2);
          const highHard = Math.min(seenCount, Math.floor(seenCount * 0.8));
          if (lowHard >= highHard) return; // skip degenerate cases

          const char: ChineseCharacter = {
            character: '人', pinyin: 'rén', hanViet: 'nhân',
            meaning: 'person', radical: '人', characterType: 'pictographic',
            lesson,
          };

          const lastReviewedAt = now - hoursAgo * 3600_000;

          const progressLow: CharacterProgress = {
            character: '人', seenCount, hardCount: lowHard,
            easyCount: seenCount - lowHard, isHard: false,
            completedCycle: 0, lastReviewedAt,
          };
          const progressHigh: CharacterProgress = {
            character: '人', seenCount, hardCount: highHard,
            easyCount: seenCount - highHard, isHard: false,
            completedCycle: 0, lastReviewedAt,
          };

          const weightLow = computeWeight(char, progressLow, now, maxLesson);
          const weightHigh = computeWeight(char, progressHigh, now, maxLesson);

          expect(weightHigh).toBeGreaterThan(weightLow);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Validates: Requirements 3.3
   * Longer review gap → higher weight (all else equal)
   */
  it('longer review gap produces higher weight', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),        // seenCount
        fc.integer({ min: 0, max: 50 }),          // hardCount (will be clamped)
        fc.integer({ min: 1, max: 10 }),          // lesson
        fc.integer({ min: 10, max: 20 }),         // maxLesson
        fc.integer({ min: 1, max: 100 }),         // recentHoursAgo
        fc.integer({ min: 101, max: 300 }),       // olderHoursAgo (always > recentHoursAgo)
        (seenCount, hardCountRaw, lesson, maxLesson, recentHoursAgo, olderHoursAgo) => {
          const hardCount = Math.min(hardCountRaw, seenCount);

          const char: ChineseCharacter = {
            character: '人', pinyin: 'rén', hanViet: 'nhân',
            meaning: 'person', radical: '人', characterType: 'pictographic',
            lesson,
          };

          const progressRecent: CharacterProgress = {
            character: '人', seenCount, hardCount,
            easyCount: seenCount - hardCount, isHard: false,
            completedCycle: 0, lastReviewedAt: now - recentHoursAgo * 3600_000,
          };
          const progressOlder: CharacterProgress = {
            character: '人', seenCount, hardCount,
            easyCount: seenCount - hardCount, isHard: false,
            completedCycle: 0, lastReviewedAt: now - olderHoursAgo * 3600_000,
          };

          const weightRecent = computeWeight(char, progressRecent, now, maxLesson);
          const weightOlder = computeWeight(char, progressOlder, now, maxLesson);

          expect(weightOlder).toBeGreaterThan(weightRecent);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Validates: Requirements 3.4
   * Higher lesson number → higher weight (all else equal)
   */
  it('higher lesson number produces higher weight', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),        // seenCount
        fc.integer({ min: 0, max: 50 }),          // hardCount (will be clamped)
        fc.integer({ min: 1, max: 48 }),          // hoursAgo
        fc.integer({ min: 1, max: 8 }),           // lowLesson
        fc.integer({ min: 9, max: 20 }),          // highLesson (always > lowLesson)
        (seenCount, hardCountRaw, hoursAgo, lowLesson, highLesson) => {
          const hardCount = Math.min(hardCountRaw, seenCount);
          const maxLesson = highLesson + 5; // ensure both lessons are within range

          const lastReviewedAt = now - hoursAgo * 3600_000;

          const progress: CharacterProgress = {
            character: '人', seenCount, hardCount,
            easyCount: seenCount - hardCount, isHard: false,
            completedCycle: 0, lastReviewedAt,
          };

          const charLow: ChineseCharacter = {
            character: '人', pinyin: 'rén', hanViet: 'nhân',
            meaning: 'person', radical: '人', characterType: 'pictographic',
            lesson: lowLesson,
          };
          const charHigh: ChineseCharacter = {
            character: '人', pinyin: 'rén', hanViet: 'nhân',
            meaning: 'person', radical: '人', characterType: 'pictographic',
            lesson: highLesson,
          };

          const weightLow = computeWeight(charLow, progress, now, maxLesson);
          const weightHigh = computeWeight(charHigh, progress, now, maxLesson);

          expect(weightHigh).toBeGreaterThan(weightLow);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Validates: Requirements 3.5
   * lastReviewedAt === null produces maximum review gap weight
   */
  it('null lastReviewedAt produces maximum review gap weight', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),        // seenCount
        fc.integer({ min: 0, max: 50 }),          // hardCount (will be clamped)
        fc.integer({ min: 1, max: 10 }),          // lesson
        fc.integer({ min: 10, max: 20 }),         // maxLesson
        fc.integer({ min: 1, max: 300 }),         // hoursAgo for the non-null case
        (seenCount, hardCountRaw, lesson, maxLesson, hoursAgo) => {
          const hardCount = Math.min(hardCountRaw, seenCount);

          const char: ChineseCharacter = {
            character: '人', pinyin: 'rén', hanViet: 'nhân',
            meaning: 'person', radical: '人', characterType: 'pictographic',
            lesson,
          };

          const progressWithNull: CharacterProgress = {
            character: '人', seenCount, hardCount,
            easyCount: seenCount - hardCount, isHard: false,
            completedCycle: 0, lastReviewedAt: null,
          };
          const progressWithTimestamp: CharacterProgress = {
            character: '人', seenCount, hardCount,
            easyCount: seenCount - hardCount, isHard: false,
            completedCycle: 0, lastReviewedAt: now - hoursAgo * 3600_000,
          };

          const weightNull = computeWeight(char, progressWithNull, now, maxLesson);
          const weightTimestamp = computeWeight(char, progressWithTimestamp, now, maxLesson);

          // null lastReviewedAt should produce weight >= any timestamp-based weight
          expect(weightNull).toBeGreaterThanOrEqual(weightTimestamp);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Arbitrary generator for a ChineseCharacter with a unique character string.
 */
function arbChineseCharacter(index: number): ChineseCharacter {
  return {
    character: `char_${index}`,
    pinyin: `pin_${index}`,
    hanViet: `hv_${index}`,
    meaning: `meaning_${index}`,
    radical: `rad_${index}`,
    characterType: 'pictographic',
    lesson: 1,
  };
}

describe('Feature: spaced-repetition-practice, Property 3: Sampling invariants', () => {
  // Deterministic rng for reproducibility (simple linear congruential)
  function makeDeterministicRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return (s >>> 0) / 4294967296;
    };
  }

  /**
   * Validates: Requirements 3.6, 3.7
   * Result length equals min(n, candidates.length)
   */
  it('result length equals min(n, candidates.length)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),  // number of candidates
        fc.integer({ min: 0, max: 100 }), // requested count
        fc.integer({ min: 1, max: 10000 }), // rng seed
        (numCandidates, count, seed) => {
          const candidates = Array.from({ length: numCandidates }, (_, i) => ({
            character: arbChineseCharacter(i),
            weight: 1 + (i % 5), // positive weights
          }));

          const rng = makeDeterministicRng(seed);
          const result = weightedSample(candidates, count, rng);

          expect(result.length).toBe(Math.min(count, candidates.length));
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Validates: Requirements 3.6, 3.7
   * All returned characters are members of the candidate list
   */
  it('all returned characters are members of the candidate list', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),  // number of candidates
        fc.integer({ min: 1, max: 100 }), // requested count
        fc.integer({ min: 1, max: 10000 }), // rng seed
        (numCandidates, count, seed) => {
          const candidates = Array.from({ length: numCandidates }, (_, i) => ({
            character: arbChineseCharacter(i),
            weight: 1 + (i % 3),
          }));

          const candidateChars = new Set(
            candidates.map((c) => c.character.character),
          );

          const rng = makeDeterministicRng(seed);
          const result = weightedSample(candidates, count, rng);

          for (const char of result) {
            expect(candidateChars.has(char.character)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Validates: Requirements 3.6, 3.7
   * No duplicates exist in the result
   */
  it('no duplicates exist in the result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),  // number of candidates
        fc.integer({ min: 1, max: 100 }), // requested count
        fc.integer({ min: 1, max: 10000 }), // rng seed
        (numCandidates, count, seed) => {
          const candidates = Array.from({ length: numCandidates }, (_, i) => ({
            character: arbChineseCharacter(i),
            weight: 1 + (i % 7),
          }));

          const rng = makeDeterministicRng(seed);
          const result = weightedSample(candidates, count, rng);

          const charStrings = result.map((c) => c.character);
          const uniqueChars = new Set(charStrings);
          expect(uniqueChars.size).toBe(result.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Feature: spaced-repetition-practice, Property 4: Sort correctness at zero jitter', () => {
  /**
   * Validates: Requirements 4.1
   * With jitterFactor = 0 and distinct weights, output is strictly descending by weight.
   */
  it('returns characters in strictly descending weight order when jitterFactor is 0', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.double({ min: 0.01, max: 100, noNaN: true }), {
          minLength: 2,
          maxLength: 50,
          comparator: (a, b) => a === b,
        }),
        fc.integer({ min: 1, max: 10000 }), // rng seed (unused at jitter=0, but provided for completeness)
        (distinctWeights, _seed) => {
          const candidates = distinctWeights.map((w, i) => ({
            character: arbChineseCharacter(i),
            weight: w,
          }));

          const result = sortByWeightWithJitter(candidates, 0);

          // Verify strictly descending: each element's weight > next element's weight
          // Map result characters back to their weights
          const charToWeight = new Map(
            candidates.map((c) => [c.character.character, c.weight]),
          );
          const resultWeights = result.map((c) => charToWeight.get(c.character)!);

          for (let i = 0; i < resultWeights.length - 1; i++) {
            expect(resultWeights[i]).toBeGreaterThan(resultWeights[i + 1]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
