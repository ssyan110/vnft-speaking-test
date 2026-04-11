# Requirements Document

## Introduction

The Chinese character recognition app currently selects practice characters purely at random from a flat database of 85+ characters. As the database grows, students cannot reliably review newly learned characters — new additions may rarely appear in a session. This feature introduces lesson-based grouping, lesson filtering, and a weighted spaced repetition algorithm so that newer, weaker, and less-recently-reviewed characters appear more frequently, making practice sessions effective for retention.

## Glossary

- **App**: The React-based Chinese character recognition and speaking practice application.
- **Character_Database**: The array of `ChineseCharacter` objects defined in `constants/characters.ts`.
- **Lesson**: A named group (e.g., "Lesson 1", "Lesson 2") to which one or more characters belong, identified by a `lesson` field on each character.
- **Lesson_Selector**: A UI component that allows the student to choose which lessons to include in a practice session.
- **Selection_Engine**: The module responsible for choosing which characters appear in a practice round, replacing the current random shuffle.
- **Weight**: A numeric score assigned to each character that determines its probability of being selected for a practice round. Higher weight means higher selection probability.
- **Error_Rate**: The ratio of a character's `hardCount` to its `seenCount`, representing how often the student marked the character as difficult.
- **Review_Gap**: The elapsed time since a character's `lastReviewedAt` timestamp.
- **Progress_Store**: The localStorage-based persistence layer that stores `CharacterProgress` records and session metadata.
- **Practice_Round**: A set of characters (currently 10) presented to the student in a single practice session.
- **Student**: The end user practicing Chinese character recognition.

## Requirements

### Requirement 1: Lesson Field on Characters

**User Story:** As a student, I want each character to belong to a lesson, so that I can practice characters from specific lessons.

#### Acceptance Criteria

1. THE Character_Database SHALL include a `lesson` field of type `number` on every `ChineseCharacter` object.
2. THE App SHALL define a `LessonMetadata` type that maps each lesson number to a human-readable label (e.g., 1 → "Bài 1").
3. WHEN a character has no explicit lesson assignment, THE Character_Database SHALL assign that character to lesson 0 (labeled "Chưa phân bài").

### Requirement 2: Lesson Selection UI

**User Story:** As a student, I want to pick which lessons to practice, so that I can focus on recently learned characters.

#### Acceptance Criteria

1. WHEN the student opens the Character Recognition mode, THE Lesson_Selector SHALL display all available lessons with their labels and character counts.
2. THE Lesson_Selector SHALL allow the student to select one or more lessons, or select all lessons at once.
3. THE Lesson_Selector SHALL default to all lessons selected when no prior selection is stored.
4. WHEN the student changes the lesson selection, THE Lesson_Selector SHALL persist the selection to localStorage.
5. WHEN the student returns to the Character Recognition mode, THE Lesson_Selector SHALL restore the previously persisted lesson selection.
6. WHEN the student selects zero lessons, THE Lesson_Selector SHALL disable the start button and display a message indicating at least one lesson is required.

### Requirement 3: Weighted Character Selection

**User Story:** As a student, I want the app to prioritize characters I struggle with and haven't seen recently, so that my practice sessions are more effective for retention.

#### Acceptance Criteria

1. WHEN building a Practice_Round, THE Selection_Engine SHALL compute a Weight for each character in the selected lessons using three factors: Error_Rate, Review_Gap, and lesson recency.
2. THE Selection_Engine SHALL assign higher Weight to characters with a higher Error_Rate.
3. THE Selection_Engine SHALL assign higher Weight to characters with a longer Review_Gap.
4. THE Selection_Engine SHALL assign higher Weight to characters belonging to higher-numbered (more recent) lessons.
5. WHEN a character has never been reviewed, THE Selection_Engine SHALL assign that character the maximum Review_Gap weight.
6. THE Selection_Engine SHALL select characters for a Practice_Round using weighted random sampling, where the probability of selecting a character is proportional to its Weight.
7. THE Selection_Engine SHALL prevent duplicate characters within a single Practice_Round.

### Requirement 4: Front-Loading New and Weak Characters

**User Story:** As a student, I want newer and weaker characters to appear earlier in a practice round, so that I engage with the most important characters first while my focus is highest.

#### Acceptance Criteria

1. WHEN a Practice_Round is built, THE Selection_Engine SHALL sort the selected characters so that characters with higher Weight appear earlier in the round.
2. THE Selection_Engine SHALL introduce a randomization factor within the sorted order so that the sequence is not fully deterministic across sessions.

### Requirement 5: Progress Data Persistence

**User Story:** As a student, I want my practice history and lesson selections to be saved across browser sessions, so that the app remembers my progress.

#### Acceptance Criteria

1. THE Progress_Store SHALL persist the full `CharacterProgress` record for every reviewed character to localStorage.
2. THE Progress_Store SHALL persist the student's current lesson selection to localStorage.
3. WHEN the student opens the app, THE Progress_Store SHALL load previously stored progress data and lesson selection.
4. IF the stored progress data is corrupted or unparseable, THEN THE Progress_Store SHALL discard the corrupted data, initialize with empty defaults, and allow the student to continue without error.
5. WHEN the student resets progress, THE Progress_Store SHALL clear all stored progress data and lesson selections.

### Requirement 6: Updated Character Progress Tracking

**User Story:** As a student, I want the app to track when and how I reviewed each character, so that the spaced repetition algorithm has accurate data.

#### Acceptance Criteria

1. WHEN the student rates a character, THE App SHALL update the character's `lastReviewedAt` timestamp to the current time.
2. WHEN the student rates a character as "hard", THE App SHALL increment the character's `hardCount` by 1.
3. WHEN the student rates a character as "easy", THE App SHALL increment the character's `easyCount` by 1.
4. WHEN the student rates a character, THE App SHALL increment the character's `seenCount` by 1.

### Requirement 7: Backward Compatibility

**User Story:** As an existing student, I want my current progress to be preserved when the app is updated, so that I do not lose my review history.

#### Acceptance Criteria

1. WHEN the App loads and finds progress data in the existing storage format (v2), THE Progress_Store SHALL migrate the data to the new format without data loss.
2. WHEN the App loads and finds progress data in the legacy storage format (v1), THE Progress_Store SHALL migrate the data to the new format without data loss.
3. IF migration encounters an unrecognized storage format, THEN THE Progress_Store SHALL initialize with empty defaults and log a warning to the console.

### Requirement 8: Weight Calculation Transparency

**User Story:** As a student, I want to understand why certain characters appear more often, so that I trust the system and stay motivated.

#### Acceptance Criteria

1. WHERE the student views the progress map, THE App SHALL display each character's current Error_Rate, Review_Gap, and lesson number.
2. WHERE the student views the progress map, THE App SHALL sort characters by their computed Weight in descending order by default.
