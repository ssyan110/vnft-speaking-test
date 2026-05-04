import type { ChineseCharacter } from '../types';

const CUSTOM_CHARS_KEY = 'vnft-custom-characters';

export type RawCustomCharacter = Omit<ChineseCharacter, 'lesson'>;

/** Load custom characters from localStorage */
export function loadCustomCharacters(): RawCustomCharacter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CHARS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c: unknown) =>
        c && typeof c === 'object' &&
        typeof (c as any).character === 'string' &&
        typeof (c as any).pinyin === 'string',
    );
  } catch {
    return [];
  }
}

/** Save custom characters to localStorage */
export function saveCustomCharacters(chars: RawCustomCharacter[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_CHARS_KEY, JSON.stringify(chars));
}

/** Add a custom character (returns false if duplicate) */
export function addCustomCharacter(
  char: RawCustomCharacter,
  existingChars: ChineseCharacter[],
): boolean {
  const allExisting = new Set(existingChars.map((c) => c.character));
  if (allExisting.has(char.character)) return false;

  const customs = loadCustomCharacters();
  customs.push(char);
  saveCustomCharacters(customs);
  return true;
}

/** Remove a custom character by its character string */
export function removeCustomCharacter(character: string): void {
  const customs = loadCustomCharacters();
  saveCustomCharacters(customs.filter((c) => c.character !== character));
}

/** Clear all custom characters */
export function clearCustomCharacters(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOM_CHARS_KEY);
}
