const LESSON_SELECTION_KEY = 'vnft-lesson-selection';

/** Load lesson selection from localStorage. Returns null if no stored selection or data is corrupted. */
export function loadLessonSelection(): number[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(LESSON_SELECTION_KEY);
    if (raw === null) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every((v) => typeof v === 'number')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Save lesson selection to localStorage. */
export function saveLessonSelection(lessons: number[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LESSON_SELECTION_KEY, JSON.stringify(lessons));
}

/** Clear lesson selection from localStorage. */
export function clearLessonSelection(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LESSON_SELECTION_KEY);
}
