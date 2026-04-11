import React, { useEffect, useMemo, useState } from 'react';
import type { ChineseCharacter } from '../types';
import { getCharactersByLesson, getAvailableLessons, LESSON_METADATA } from '../constants/lessonData';
import { saveLessonSelection, loadLessonSelection } from '../utils/lessonStorage';

interface LessonSelectorProps {
  characters: ChineseCharacter[];
  selectedLessons: number[];
  onSelectionChange: (lessons: number[]) => void;
}

const LessonSelector: React.FC<LessonSelectorProps> = ({
  characters,
  selectedLessons,
  onSelectionChange,
}) => {
  const availableLessons = useMemo(() => getAvailableLessons(characters), [characters]);
  const charactersByLesson = useMemo(() => getCharactersByLesson(characters), [characters]);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  useEffect(() => {
    const stored = loadLessonSelection();
    if (stored !== null) {
      const valid = stored.filter((l) => availableLessons.includes(l));
      if (valid.length > 0) {
        onSelectionChange(valid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveLessonSelection(selectedLessons);
  }, [selectedLessons]);

  const allSelected = availableLessons.length > 0 && availableLessons.every((l) => selectedLessons.includes(l));

  const handleToggleLesson = (lesson: number) => {
    const next = selectedLessons.includes(lesson)
      ? selectedLessons.filter((l) => l !== lesson)
      : [...selectedLessons, lesson];
    onSelectionChange(next);
  };

  const handleToggleAll = () => {
    onSelectionChange(allSelected ? [] : [...availableLessons]);
  };

  const handleToggleExpand = (lesson: number) => {
    setExpandedLesson(expandedLesson === lesson ? null : lesson);
  };

  const selectedCharacterCount = selectedLessons.reduce((sum, lesson) => {
    return sum + (charactersByLesson[lesson]?.length ?? 0);
  }, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-emerald-900">Chọn bài để luyện</div>
        <button
          onClick={handleToggleAll}
          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          {allSelected ? 'Bỏ chọn hết' : 'Chọn hết'}
        </button>
      </div>

      {/* Lesson list */}
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
        {availableLessons.map((lesson) => {
          const isSelected = selectedLessons.includes(lesson);
          const chars = charactersByLesson[lesson] ?? [];
          const label = LESSON_METADATA[lesson] ?? `Bài ${lesson}`;
          const isExpanded = expandedLesson === lesson;
          const preview = chars.map((c) => c.character).join(' ');

          return (
            <div key={lesson} className="flex flex-col">
              {/* Lesson row */}
              <div
                className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {/* Checkbox area */}
                <button
                  onClick={() => handleToggleLesson(lesson)}
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border text-xs font-bold transition-colors ${
                    isSelected
                      ? 'border-white/40 bg-white/20 text-white'
                      : 'border-emerald-300 bg-white text-emerald-500'
                  }`}
                  aria-label={isSelected ? `Bỏ chọn ${label}` : `Chọn ${label}`}
                >
                  {isSelected ? '✓' : ''}
                </button>

                {/* Lesson info — tap to expand */}
                <button
                  onClick={() => handleToggleExpand(lesson)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left"
                >
                  <div className="flex w-full items-baseline gap-2">
                    <span className="text-sm font-bold">{label}</span>
                    <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-emerald-500'}`}>
                      {chars.length} chữ
                    </span>
                  </div>
                  <div className={`mt-0.5 truncate text-xs ${isSelected ? 'text-white/80' : 'text-emerald-600'}`}>
                    {preview}
                  </div>
                </button>

                {/* Expand arrow */}
                <button
                  onClick={() => handleToggleExpand(lesson)}
                  className={`flex-shrink-0 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                    isSelected ? 'text-white/60' : 'text-emerald-400'
                  }`}
                  aria-label={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                >
                  ▶
                </button>
              </div>

              {/* Expanded character detail */}
              {isExpanded && (
                <div className="mx-2 mt-1 mb-1 rounded-xl border border-emerald-100 bg-white p-3">
                  <div className="flex flex-wrap gap-2">
                    {chars.map((c) => (
                      <div
                        key={c.character}
                        className="flex flex-col items-center rounded-lg bg-emerald-50 px-2 py-1.5 min-w-[3.5rem]"
                      >
                        <span className="text-lg font-bold text-emerald-800">{c.character}</span>
                        <span className="text-[10px] text-emerald-600">{c.pinyin}</span>
                        <span className="text-[10px] text-emerald-500 truncate max-w-[4rem]">{c.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer status */}
      {selectedLessons.length === 0 ? (
        <div className="rounded-xl bg-amber-50 p-2.5 text-center text-sm font-semibold text-amber-700">
          Chọn ít nhất một bài để bắt đầu
        </div>
      ) : (
        <div className="text-center text-xs text-emerald-600">
          Đã chọn {selectedLessons.length} bài · {selectedCharacterCount} chữ
        </div>
      )}
    </div>
  );
};

export default LessonSelector;
