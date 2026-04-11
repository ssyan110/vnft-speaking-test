# Design Document: Spaced Repetition & Lesson-Based Practice System

## Overview

This feature transforms the character recognition practice mode from random selection to an intelligent, lesson-aware spaced repetition system. Three core changes are introduced:

1. **Lesson grouping** — Each character gets a `lesson` number. A new `LessonSelector` component lets students pick which lessons to practice.
2. **Weighted selection engine** — A pure function replaces the current `shuffleCharacters` random shuffle. It computes a weight per character from error rate, review gap, and lesson recency, then performs weighted random sampling.
3. **Progress transparency** — The progress map view shows each character's error rate, review gap, and lesson, sorted by weight.

The existing localStorage persistence layer, round-based session flow, and hard/easy rating UX remain unchanged. Backward compatibility with v1 and v2 storage formats is preserved through the existing migration logic in `loadStoredState()`.

### Design Rationale

- **Pure selection engine**: The weight calculation and sampling logic are extracted into pure functions (no React state, no side effects). This makes them independently testable and keeps the component thin.
- **Minimal type changes**: We add a `lesson` field to `ChineseCharacter` and a `LessonMetadata` map. `CharacterProgress` stays the same — `lastReviewedAt`, `hardCount`, `easyCount`, and `seenCount` already provide the data the weight formula needs.
- **No new dependencies**: The weighted sampling algorithm uses a simple cumulative-weight approach. No external library needed.

## Architecture

```mermaid
graph TD
    subgraph Data Layer
        A[constants/characters.ts] -->|lesson field added| B[ChineseCharacter[]]
        C[types.ts] -->|LessonMetadata type| D[Type Definitions]
    end

    subgraph Selection Engine - Pure Functions
        E[computeWeight] -->|per character| F[weightedSample]
        F --> G[sortByWeightWithJitter]
    end

    subgraph Storage Layer
        H[localStorage] -->|load/save| I[Progress Store]
        I -->|lesson selection| J[Lesson Selection Store]
    end

    subgraph UI Layer
        K[LessonSelector] -->|selected lessons| L[CharacterRecognition]
        L -->|calls| E
        L -->|reads/writes| I
        M[ProgressMapView] -->|reads| I
        M -->|reads| E
    end
```

### Module Boundaries

| Module | Responsibility | Location |
|--------|---------------|----------|
| `selectionEngine.ts` | Weight calculation, weighted sampling, round sorting | `utils/selectionEngine.ts` |
| `lessonData.ts` | `LESSON_METADATA` map, helper to group characters by lesson | `constants/lessonData.ts` |
| `LessonSelector.tsx` | Lesson picker UI with persist/restore | `components/LessonSelector.tsx` |
| `ProgressMapView.tsx` | Weighted progress display | `components/ProgressMapView.tsx` |
| `types.ts` | Updated `ChineseCharacter`, new `LessonMetadata` | `types.ts` |
| `CharacterRecognition.tsx` | Orchestrates selection engine + lesson filter | `components/CharacterRecognition.tsx` |

## Components and Interfaces

### 1. Selection Engine (`utils/selectionEngine.ts`)

All functions are pure — no side effects, no React imports.

```typescript
/** Tunable coefficients for the weight formula */
interface WeightConfig {
  errorRateCoeff: number;    // default: 2.0
  reviewGapCoeff: number;    // default: 1.5
  lessonRecencyCoeff: number; // default: 1.0
  baseWeight: number;         // default: 1.0
  maxReviewGapMs: number;     // default: 7 * 24 * 60 * 60 * 1000 (7 days)
}

const DEFAULT_WEIGHT_CONFIG: WeightConfig = {
  errorRateCoeff: 2.0,
  reviewGapCoeff: 1.5,
  lessonRecencyCoeff: 1.0,
  baseWeight: 1.0,
  maxReviewGapMs: 7 * 24 * 60 * 60 * 1000,
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
 *   (1.0 if never reviewed)
 * - normalizedLessonRecency = lessonNumber / maxLessonNumber
 */
function computeWeight(
  character: ChineseCharacter,
  progress: CharacterProgress | undefined,
  now: number,
  maxLesson: number,
  config?: Partial<WeightConfig>,
): number;

/**
 * Weighted random sampling without replacement.
 * Returns `count` characters from `candidates`, where selection probability
 * is proportional to each character's weight.
 */
function weightedSample(
  candidates: Array<{ character: ChineseCharacter; weight: number }>,
  count: number,
  rng?: () => number,
): ChineseCharacter[];

/**
 * Sort selected characters by weight descending, then apply a jitter
 * factor so the order isn't fully deterministic.
 * jitterFactor in [0, 1]: 0 = strict sort, 1 = fully random.
 */
function sortByWeightWithJitter(
  characters: Array<{ character: ChineseCharacter; weight: number }>,
  jitterFactor?: number, // default: 0.3
  rng?: () => number,
): ChineseCharacter[];

/**
 * Build a full practice round:
 * 1. Filter characters by selected lessons
 * 2. Compute weights
 * 3. Sample `roundSize` characters
 * 4. Sort with jitter
 */
function buildWeightedRound(
  allCharacters: ChineseCharacter[],
  progressMap: ProgressMap,
  selectedLessons: number[],
  now: number,
  roundSize?: number,       // default: 10
  config?: Partial<WeightConfig>,
  rng?: () => number,
): ChineseCharacter[];
```

The `rng` parameter defaults to `Math.random` but can be injected for deterministic testing.

### 2. Lesson Data (`constants/lessonData.ts`)

```typescript
/** Maps lesson number → human-readable label */
export const LESSON_METADATA: Record<number, string> = {
  0: 'Chưa phân bài',
  1: 'Bài 1',
  2: 'Bài 2',
  // ... grows as lessons are added
};

/** Group characters by lesson number */
function getCharactersByLesson(
  characters: ChineseCharacter[],
): Record<number, ChineseCharacter[]>;

/** Get sorted list of unique lesson numbers from character data */
function getAvailableLessons(
  characters: ChineseCharacter[],
): number[];
```

### 3. Lesson Selector Component (`components/LessonSelector.tsx`)

```typescript
interface LessonSelectorProps {
  characters: ChineseCharacter[];
  selectedLessons: number[];
  onSelectionChange: (lessons: number[]) => void;
}
```

- Renders a list of lesson chips/buttons with character counts
- "Select All" toggle
- Disables start when `selectedLessons.length === 0`
- Persists selection to `localStorage` key `vnft-lesson-selection`

### 4. Progress Map View (`components/ProgressMapView.tsx`)

```typescript
interface ProgressMapViewProps {
  characters: ChineseCharacter[];
  progressMap: ProgressMap;
  maxLesson: number;
}
```

- Displays each character with error rate, review gap (human-readable), and lesson number
- Sorted by computed weight descending by default

### 5. Updated `ChineseCharacter` Type

```typescript
export interface ChineseCharacter {
  character: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  radical: string;
  characterType: string;
  lesson: number; // NEW — lesson group number
}
```

### 6. Lesson Selection Storage

```typescript
const LESSON_SELECTION_KEY = 'vnft-lesson-selection';

function loadLessonSelection(): number[] | null;  // null = no stored selection
function saveLessonSelection(lessons: number[]): void;
function clearLessonSelection(): void;
```

Stored as `JSON.stringify(number[])`. On load, if parsing fails, return `null` (fall back to all lessons).

## Data Models

### Character with Lesson Field

The existing `ChineseCharacter` interface gains one field:

```typescript
interface ChineseCharacter {
  // ... existing fields unchanged ...
  lesson: number;  // 0 = unassigned, 1+ = lesson number
}
```

Each entry in `constants/characters.ts` will be updated with a `lesson` value. Characters not yet assigned to a lesson get `lesson: 0`.

### LessonMetadata

```typescript
type LessonMetadata = Record<number, string>;
// Example: { 0: 'Chưa phân bài', 1: 'Bài 1', 2: 'Bài 2' }
```

### CharacterProgress (unchanged)

The existing `CharacterProgress` type already contains all fields needed by the weight formula:

```typescript
interface CharacterProgress {
  character: string;
  seenCount: number;
  hardCount: number;
  easyCount: number;
  isHard: boolean;
  completedCycle: number;
  lastReviewedAt: number | null;
}
```

No migration is needed for progress data — the new selection engine reads the same fields.

### Lesson Selection Storage Format

```typescript
// localStorage key: 'vnft-lesson-selection'
// Value: JSON array of lesson numbers
// Example: [1, 2, 3]
// null/missing = default to all lessons
```

### Weight Computation Model

For a character `c` with progress `p` at time `now`:

| Factor | Formula | Range |
|--------|---------|-------|
| Error Rate | `p.seenCount > 0 ? p.hardCount / p.seenCount : 0` | [0, 1] |
| Review Gap | `p.lastReviewedAt ? min(now - p.lastReviewedAt, maxGap) / maxGap : 1.0` | [0, 1] |
| Lesson Recency | `c.lesson / maxLesson` | [0, 1] |
| **Total Weight** | `base + errCoeff * errorRate + gapCoeff * reviewGap + lessonCoeff * lessonRecency` | [1.0, 5.5] |

All three factors are normalized to [0, 1] before being combined, ensuring no single factor dominates regardless of scale.



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Lesson selection round-trip

*For any* array of valid lesson numbers, saving the selection to localStorage and then loading it back SHALL produce an identical array.

**Validates: Requirements 2.4, 5.2**

### Property 2: Weight monotonicity

*For any* two characters that are identical in all respects except one factor, `computeWeight` SHALL return a higher weight for the character with:
- a higher error rate (higher `hardCount / seenCount`), OR
- a longer review gap (older `lastReviewedAt`, or `null` vs. any timestamp), OR
- a higher lesson number.

When `lastReviewedAt` is `null` (never reviewed), the review gap component SHALL equal its maximum value (1.0).

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 3: Sampling invariants

*For any* non-empty candidate list with positive weights and a requested count `n`, `weightedSample` SHALL return exactly `min(n, candidates.length)` characters, all of which are members of the candidate list, with no duplicates.

**Validates: Requirements 3.6, 3.7**

### Property 4: Sort correctness at zero jitter

*For any* list of characters with distinct weights, `sortByWeightWithJitter` with `jitterFactor = 0` SHALL return the characters in strictly descending weight order.

**Validates: Requirements 4.1**

### Property 5: Progress data round-trip

*For any* valid `ProgressMap` (mapping character strings to `CharacterProgress` records), saving to localStorage under the v2 key and loading via `loadStoredState` SHALL produce a `ProgressMap` with identical field values for every character.

**Validates: Requirements 5.1, 7.1**

### Property 6: Corrupted data resilience

*For any* arbitrary string stored in the progress localStorage key (including invalid JSON, random bytes, empty strings, and malformed objects), `loadStoredState` SHALL return a valid state with an empty `progressMap` and `currentCycle = 0` without throwing an exception.

**Validates: Requirements 5.4, 7.3**

### Property 7: Rating update correctness

*For any* `CharacterProgress` record and *for any* rating ("hard" or "easy"), applying the rating SHALL:
- increment `seenCount` by exactly 1,
- increment `hardCount` by 1 if the rating is "hard" (unchanged otherwise),
- increment `easyCount` by 1 if the rating is "easy" (unchanged otherwise),
- set `lastReviewedAt` to the current timestamp.

**Validates: Requirements 6.2, 6.3, 6.4**

### Property 8: v1 migration preserves data

*For any* valid v1-format progress record (using `lapses` and `streak` field names), loading via `loadStoredState` SHALL produce a `CharacterProgress` where `hardCount` equals the original `lapses` value and `easyCount` equals the original `streak` value.

**Validates: Requirements 7.2**

## Error Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Corrupted progress JSON in localStorage | `loadStoredState` catches parse errors, returns empty defaults. Existing behavior preserved. |
| Corrupted lesson selection in localStorage | `loadLessonSelection` catches parse errors, returns `null` → UI defaults to all lessons. |
| Unrecognized storage format | Returns empty defaults, logs `console.warn`. |
| Zero lessons selected | UI disables start button, shows message. Selection engine is never called. |
| Character with no progress record | `computeWeight` treats missing progress as never-reviewed (max review gap, zero error rate). |
| `seenCount` is 0 | Error rate formula returns 0 (avoids division by zero). |
| Fewer candidates than `roundSize` | `weightedSample` returns all available candidates (no error). |
| Empty candidate list | `buildWeightedRound` returns empty array, UI shows round-complete state immediately. |
| All weights are zero | Should not happen due to `baseWeight = 1.0`, but `weightedSample` handles it by falling back to uniform random selection. |

## Testing Strategy

### Approach

This feature is well-suited for a dual testing approach:

- **Property-based tests** for the pure selection engine functions (`computeWeight`, `weightedSample`, `sortByWeightWithJitter`, `buildWeightedRound`) and the storage round-trip logic. These functions have clear input/output behavior and universal properties that hold across a wide input space.
- **Example-based tests** for UI components (LessonSelector, ProgressMapView) and specific integration scenarios.

### Property-Based Testing Setup

Since the project has no test framework installed, we'll add [fast-check](https://github.com/dubzzz/fast-check) with Vitest as a lightweight test runner:

```bash
npm install --save-dev vitest fast-check
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest --run"
  }
}
```

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: spaced-repetition-practice, Property {N}: {title}`
- Deterministic `rng` injection for reproducible failures

### Test Plan

| Property | Test File | What's Tested |
|----------|-----------|---------------|
| Property 1: Lesson selection round-trip | `utils/__tests__/lessonStorage.test.ts` | `saveLessonSelection` → `loadLessonSelection` |
| Property 2: Weight monotonicity | `utils/__tests__/selectionEngine.test.ts` | `computeWeight` monotonic in each factor |
| Property 3: Sampling invariants | `utils/__tests__/selectionEngine.test.ts` | `weightedSample` count, membership, uniqueness |
| Property 4: Sort correctness | `utils/__tests__/selectionEngine.test.ts` | `sortByWeightWithJitter` with jitter=0 |
| Property 5: Progress round-trip | `utils/__tests__/progressStore.test.ts` | Save/load `ProgressMap` via localStorage |
| Property 6: Corrupted data resilience | `utils/__tests__/progressStore.test.ts` | `loadStoredState` with arbitrary strings |
| Property 7: Rating update correctness | `utils/__tests__/progressStore.test.ts` | Rating application logic |
| Property 8: v1 migration | `utils/__tests__/progressStore.test.ts` | v1 format → current format field mapping |

### Example-Based Tests

| Scenario | Test File |
|----------|-----------|
| LessonSelector renders all lessons with counts | `components/__tests__/LessonSelector.test.ts` |
| LessonSelector defaults to all selected | `components/__tests__/LessonSelector.test.ts` |
| Zero lessons disables start | `components/__tests__/LessonSelector.test.ts` |
| ProgressMapView shows error rate, gap, lesson | `components/__tests__/ProgressMapView.test.ts` |
| Reset clears all stored data | `utils/__tests__/progressStore.test.ts` |
| buildWeightedRound with empty candidates | `utils/__tests__/selectionEngine.test.ts` |

### What's NOT Property-Tested

- UI rendering and layout (LessonSelector, ProgressMapView) — use example-based tests
- localStorage API behavior itself — trust the browser
- Tailwind CSS styling — visual review only
