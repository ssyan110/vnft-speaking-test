import type { ChineseCharacter, CharacterProgress, ProgressMap } from '../types';

/** Tunable coefficients for the weight formula */
export interface WeightConfig {
  errorRateCoeff: number;
  reviewGapCoeff: number;
  lessonRecencyCoeff: number;
  baseWeight: number;
  maxReviewGapMs: number;
}

export const DEFAULT_WEIGHT_CONFIG: WeightConfig = {
  errorRateCoeff: 2.0,
  reviewGapCoeff: 1.5,
  lessonRecencyCoeff: 1.0,
  baseWeight: 1.0,
  maxReviewGapMs: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Compute the selection weight for a single character.
 *
 * weight = baseWeight
 *        + errorRateCoeff * errorRate
 *        + reviewGapCoeff * normalizedGap
 *        + lessonRecencyCoeff * normalizedLessonRecency
 *
 * - errorRate = hardCount / seenCount (0 if seenCount === 0)
 * - normalizedGap = min(timeSinceLastReview, maxReviewGapMs) / maxReviewGapMs
 *   (1.0 if never reviewed, i.e. lastReviewedAt === null)
 * - normalizedLessonRecency = lessonNumber / maxLessonNumber (0 if maxLesson === 0)
 */
export function computeWeight(
  character: ChineseCharacter,
  progress: CharacterProgress | undefined,
  now: number,
  maxLesson: number,
  config?: Partial<WeightConfig>,
): number {
  const cfg: WeightConfig = { ...DEFAULT_WEIGHT_CONFIG, ...config };

  // Error rate: hardCount / seenCount, or 0 if never seen
  const errorRate =
    progress && progress.seenCount > 0
      ? progress.hardCount / progress.seenCount
      : 0;

  // Normalized review gap: 1.0 if never reviewed, otherwise capped at maxReviewGapMs
  let normalizedGap: number;
  if (!progress || progress.lastReviewedAt === null) {
    normalizedGap = 1.0;
  } else {
    const timeSinceReview = now - progress.lastReviewedAt;
    normalizedGap =
      Math.min(timeSinceReview, cfg.maxReviewGapMs) / cfg.maxReviewGapMs;
  }

  // Normalized lesson recency: lessonNumber / maxLessonNumber, or 0 if maxLesson === 0
  const normalizedLessonRecency =
    maxLesson > 0 ? character.lesson / maxLesson : 0;

  return (
    cfg.baseWeight +
    cfg.errorRateCoeff * errorRate +
    cfg.reviewGapCoeff * normalizedGap +
    cfg.lessonRecencyCoeff * normalizedLessonRecency
  );
}

/**
 * Weighted random sampling without replacement.
 * Returns `min(count, candidates.length)` characters, where selection
 * probability is proportional to each candidate's weight.
 *
 * If all weights are zero, falls back to uniform random selection.
 * If candidates is empty, returns [].
 */
export function weightedSample(
  candidates: Array<{ character: ChineseCharacter; weight: number }>,
  count: number,
  rng: () => number = Math.random,
): ChineseCharacter[] {
  if (candidates.length === 0) return [];

  const n = Math.min(count, candidates.length);
  const result: ChineseCharacter[] = [];

  // Work on a mutable copy so we can remove selected items
  const pool = candidates.map((c) => ({ ...c }));

  // Check if all weights are zero — fall back to uniform
  const allZero = pool.every((c) => c.weight === 0);
  if (allZero) {
    for (const c of pool) {
      c.weight = 1;
    }
  }

  for (let i = 0; i < n; i++) {
    // Build cumulative weights
    let totalWeight = 0;
    const cumulative: number[] = [];
    for (const c of pool) {
      totalWeight += c.weight;
      cumulative.push(totalWeight);
    }

    // Pick a random point in [0, totalWeight)
    const r = rng() * totalWeight;

    // Find the first index where cumulative weight exceeds r
    let selectedIdx = 0;
    for (let j = 0; j < cumulative.length; j++) {
      if (r < cumulative[j]) {
        selectedIdx = j;
        break;
      }
    }

    result.push(pool[selectedIdx].character);
    pool.splice(selectedIdx, 1);
  }

  return result;
}

/**
 * Sort characters by weight descending, then apply a jitter factor
 * so the order isn't fully deterministic.
 *
 * For each character, a sort key is computed as:
 *   sortKey = weight + jitterFactor * rng() * maxWeight
 *
 * - jitterFactor = 0 → strict descending sort by weight
 * - jitterFactor = 1 → heavily randomized (weight still influences order)
 *
 * @param characters - Array of characters with their computed weights
 * @param jitterFactor - Amount of randomness in [0, 1], default 0.3
 * @param rng - Random number generator, default Math.random
 * @returns ChineseCharacter[] sorted by jittered weight descending
 */
export function sortByWeightWithJitter(
  characters: Array<{ character: ChineseCharacter; weight: number }>,
  jitterFactor: number = 0.3,
  rng: () => number = Math.random,
): ChineseCharacter[] {
  if (characters.length === 0) return [];

  const maxWeight = Math.max(...characters.map((c) => c.weight));

  const withSortKeys = characters.map((c) => ({
    character: c.character,
    sortKey: c.weight + jitterFactor * rng() * maxWeight,
  }));

  withSortKeys.sort((a, b) => b.sortKey - a.sortKey);

  return withSortKeys.map((c) => c.character);
}


/**
 * Build a full practice round:
 * 1. Filter characters by selected lessons
 * 2. Compute weights
 * 3. Sample `roundSize` characters
 * 4. Sort with jitter
 *
 * Returns empty array when no candidates match the selected lessons.
 */
export function buildWeightedRound(
  allCharacters: ChineseCharacter[],
  progressMap: ProgressMap,
  selectedLessons: number[],
  now: number,
  roundSize: number = 10,
  config?: Partial<WeightConfig>,
  rng?: () => number,
): ChineseCharacter[] {
  // 1. Filter characters by selected lessons
  const lessonSet = new Set(selectedLessons);
  const filtered = allCharacters.filter((c) => lessonSet.has(c.lesson));

  if (filtered.length === 0) return [];

  // 2. Find maxLesson from the filtered characters
  const maxLesson = Math.max(...filtered.map((c) => c.lesson));

  // 3. Compute weight for each filtered character
  const weighted = filtered.map((character) => ({
    character,
    weight: computeWeight(
      character,
      progressMap[character.character],
      now,
      maxLesson,
      config,
    ),
  }));

  // 4. Sample roundSize characters via weightedSample
  const sampled = weightedSample(weighted, roundSize, rng);

  // 5. Re-compute weights for sampled characters and sort with jitter
  const sampledWeighted = sampled.map((character) => ({
    character,
    weight: computeWeight(
      character,
      progressMap[character.character],
      now,
      maxLesson,
      config,
    ),
  }));

  return sortByWeightWithJitter(sampledWeighted, undefined, rng);
}
