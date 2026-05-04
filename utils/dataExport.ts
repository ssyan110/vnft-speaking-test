import type { RawCustomCharacter } from './customCharacters';
import { loadCustomCharacters, saveCustomCharacters } from './customCharacters';
import { STORAGE_KEY } from './progressStore';
import { loadLessonSelection, saveLessonSelection } from './lessonStorage';

interface ExportData {
  version: 1;
  exportedAt: string;
  customCharacters: RawCustomCharacter[];
  progress: unknown;
  lessonSelection: number[] | null;
}

/** Export all user data as a JSON string */
export function exportUserData(): string {
  const progress = typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY)
    : null;

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    customCharacters: loadCustomCharacters(),
    progress: progress ? JSON.parse(progress) : null,
    lessonSelection: loadLessonSelection(),
  };

  return JSON.stringify(data, null, 2);
}

/** Download export data as a file */
export function downloadExport(): void {
  const json = exportUserData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vnft-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import user data from a JSON string. Returns true on success. */
export function importUserData(json: string): boolean {
  try {
    const data = JSON.parse(json) as ExportData;
    if (!data || data.version !== 1) return false;

    // Restore custom characters
    if (Array.isArray(data.customCharacters)) {
      saveCustomCharacters(data.customCharacters);
    }

    // Restore progress
    if (data.progress) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.progress));
    }

    // Restore lesson selection
    if (Array.isArray(data.lessonSelection)) {
      saveLessonSelection(data.lessonSelection);
    }

    return true;
  } catch {
    return false;
  }
}
