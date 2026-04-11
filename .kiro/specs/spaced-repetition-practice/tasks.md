# Implementation Plan: Spaced Repetition & Lesson-Based Practice System

## Overview

Convert the feature design into incremental coding tasks that transform the character recognition mode from random selection to a lesson-aware, weighted spaced repetition system. Each task builds on the previous, starting with foundational types and pure logic, then layering in UI and integration. Vitest + fast-check are added for property-based and unit testing.

## Tasks

- [x] 1. Set up test infrastructure and update types
  - [x] 1.1 Install Vitest and fast-check, add test script to package.json
    - Run `npm install --save-dev vitest fast-check`
    - Add `"test": "vitest --run"` to `package.json` scripts
    - Verify `npx vitest --run` executes without errors
    - _Requirements: N/A (infrastructure)_

  - [x] 1.2 Add `lesson` field to `ChineseCharacter` type and `LessonMetadata` type to `types.ts`
    - Add `lesson: number` to the `ChineseCharacter` interface
    - Add `export type LessonMetadata = Record<number, string>` to `types.ts`
    - Add `export type ProgressMap = Record<string, CharacterProgress>` to `types.ts`
    - _Requirements: 1.1, 1.2_

  - [x] 1.3 Add `lesson` field to every character entry in `constants/characters.ts`
    - Assign `lesson: 0` to all existing characters (unassigned)
    - Group characters into lessons as appropriate (lesson 1, 2, etc.)
    - _Requirements: 1.1, 1.3_

- [x] 2. Implement selection engine (`utils/selectionEngine.ts`)
  - [x] 2.1 Implement `computeWeight` function
    - Create `utils/selectionEngine.ts`
    - Define `WeightConfig` interface and `DEFAULT_WEIGHT_CONFIG`
    - Implement `computeWeight` as a pure function computing weight from error rate, review gap, and lesson recency
    - Handle edge cases: `seenCount === 0`, `lastReviewedAt === null`, `maxLesson === 0`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Write property test for weight monotonicity
    - **Property 2: Weight monotonicity**
    - Test that higher error rate → higher weight (all else equal)
    - Test that longer review gap → higher weight (all else equal)
    - Test that higher lesson number → higher weight (all else equal)
    - Test that `lastReviewedAt === null` produces maximum review gap weight
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [x] 2.3 Implement `weightedSample` function
    - Weighted random sampling without replacement using cumulative-weight approach
    - Accept injectable `rng` parameter (default `Math.random`)
    - Return `min(count, candidates.length)` characters
    - Handle edge cases: empty candidates, all-zero weights (fallback to uniform)
    - _Requirements: 3.6, 3.7_

  - [x] 2.4 Write property test for sampling invariants
    - **Property 3: Sampling invariants**
    - Test that result length equals `min(n, candidates.length)`
    - Test that all returned characters are members of the candidate list
    - Test that no duplicates exist in the result
    - **Validates: Requirements 3.6, 3.7**

  - [x] 2.5 Implement `sortByWeightWithJitter` function
    - Sort characters by weight descending, then apply jitter factor
    - `jitterFactor` in [0, 1]: 0 = strict sort, 1 = fully random
    - Accept injectable `rng` parameter
    - _Requirements: 4.1, 4.2_

  - [x] 2.6 Write property test for sort correctness at zero jitter
    - **Property 4: Sort correctness at zero jitter**
    - Test that with `jitterFactor = 0` and distinct weights, output is strictly descending by weight
    - **Validates: Requirements 4.1**

  - [x] 2.7 Implement `buildWeightedRound` function
    - Filter characters by selected lessons
    - Compute weights for filtered characters
    - Sample `roundSize` characters via `weightedSample`
    - Sort result via `sortByWeightWithJitter`
    - Return empty array for empty candidates
    - _Requirements: 3.1, 3.6, 4.1, 4.2_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement lesson data and lesson selection storage
  - [x] 4.1 Create `constants/lessonData.ts`
    - Define `LESSON_METADATA` map (lesson number → label string, e.g., `0: 'Chưa phân bài'`, `1: 'Bài 1'`)
    - Implement `getCharactersByLesson` function
    - Implement `getAvailableLessons` function
    - _Requirements: 1.2_

  - [x] 4.2 Implement lesson selection storage helpers
    - Create `loadLessonSelection`, `saveLessonSelection`, `clearLessonSelection` in a suitable location (e.g., `utils/lessonStorage.ts`)
    - Use localStorage key `vnft-lesson-selection`
    - Handle corrupted/unparseable data by returning `null`
    - _Requirements: 2.4, 5.2, 5.4_

  - [x] 4.3 Write property test for lesson selection round-trip
    - **Property 1: Lesson selection round-trip**
    - Test that saving any array of valid lesson numbers and loading it back produces an identical array
    - **Validates: Requirements 2.4, 5.2**

- [x] 5. Implement progress store property tests
  - [x] 5.1 Write property test for progress data round-trip
    - **Property 5: Progress data round-trip**
    - Test that saving a valid `ProgressMap` to localStorage under the v2 key and loading via `loadStoredState` produces identical field values
    - **Validates: Requirements 5.1, 7.1**

  - [x] 5.2 Write property test for corrupted data resilience
    - **Property 6: Corrupted data resilience**
    - Test that `loadStoredState` returns valid empty defaults for any arbitrary string in localStorage (invalid JSON, random bytes, empty strings, malformed objects)
    - **Validates: Requirements 5.4, 7.3**

  - [x] 5.3 Write property test for rating update correctness
    - **Property 7: Rating update correctness**
    - Test that applying "hard" increments `seenCount` by 1 and `hardCount` by 1
    - Test that applying "easy" increments `seenCount` by 1 and `easyCount` by 1
    - Test that `lastReviewedAt` is set to the current timestamp
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [x] 5.4 Write property test for v1 migration
    - **Property 8: v1 migration preserves data**
    - Test that loading v1-format records (with `lapses` and `streak` fields) produces `hardCount === lapses` and `easyCount === streak`
    - **Validates: Requirements 7.2**

- [x] 6. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement LessonSelector component
  - [x] 7.1 Create `components/LessonSelector.tsx`
    - Accept `characters`, `selectedLessons`, `onSelectionChange` props
    - Render lesson chips/buttons with character counts per lesson
    - Include "Select All" toggle
    - Disable start button when `selectedLessons.length === 0` and show a message
    - Persist selection to localStorage via `saveLessonSelection`
    - Restore selection from localStorage on mount via `loadLessonSelection`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 8. Implement ProgressMapView component
  - [x] 8.1 Create `components/ProgressMapView.tsx`
    - Accept `characters`, `progressMap`, `maxLesson` props
    - Display each character with error rate, human-readable review gap, and lesson number
    - Sort characters by computed weight descending by default using `computeWeight`
    - _Requirements: 8.1, 8.2_

- [x] 9. Integrate selection engine into CharacterRecognition
  - [x] 9.1 Refactor `CharacterRecognition.tsx` to use the new selection engine
    - Replace `shuffleCharacters` / `buildMainQueue` with `buildWeightedRound`
    - Add lesson selection state, load from `loadLessonSelection` on mount
    - Integrate `LessonSelector` component into the idle/pre-round UI
    - Pass selected lessons to `buildWeightedRound`
    - Update `handleResetProgress` to also call `clearLessonSelection`
    - Remove the `ProgressMap` type alias from the component (use the one from `types.ts`)
    - _Requirements: 2.1, 2.5, 3.1, 5.3, 5.5_

  - [x] 9.2 Add ProgressMapView to CharacterRecognition
    - Add a toggle or tab to show the progress map view
    - Wire `ProgressMapView` with current `progressMap` and character data
    - _Requirements: 8.1, 8.2_

- [x] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 8 universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The `rng` parameter on selection engine functions enables deterministic testing
