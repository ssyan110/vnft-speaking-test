import React, { useMemo } from 'react';
import type { ChineseCharacter, ProgressMap } from '../types';
import { LESSON_METADATA } from '../constants/lessonData';

interface ProgressMapViewProps {
  characters: ChineseCharacter[];
  progressMap: ProgressMap;
  maxLesson: number;
}

function formatReviewGap(lastReviewedAt: number | null, now: number): string {
  if (lastReviewedAt === null) return 'Chưa ôn';
  const gapMs = now - lastReviewedAt;
  const minutes = Math.floor(gapMs / 60000);
  if (minutes < 1) return 'Vừa ôn';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function formatErrorRate(seenCount: number, hardCount: number): string {
  if (seenCount === 0) return '0%';
  return `${Math.round((hardCount / seenCount) * 100)}%`;
}

const ProgressMapView: React.FC<ProgressMapViewProps> = ({
  characters,
  progressMap,
}) => {
  const now = useMemo(() => Date.now(), []);

  const sortedCharacters = useMemo(() => {
    return characters
      .map((character) => ({
        character,
        seenCount: progressMap[character.character]?.seenCount ?? 0,
      }))
      .sort((a, b) => b.seenCount - a.seenCount);
  }, [characters, progressMap]);

  if (sortedCharacters.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-600">
        Không có chữ nào để hiển thị
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-emerald-800">
        Bản đồ tiến trình ({sortedCharacters.length} chữ)
      </div>
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
        {sortedCharacters.map(({ character, seenCount }) => {
          const progress = progressMap[character.character];
          const hardCount = progress?.hardCount ?? 0;
          const lastReviewedAt = progress?.lastReviewedAt ?? null;
          const lessonLabel = LESSON_METADATA[character.lesson] ?? `Bài ${character.lesson}`;

          return (
            <div
              key={character.character}
              className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-700">
                {character.character}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-800">{character.pinyin}</span>
                  <span className="text-xs text-emerald-600">{lessonLabel}</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>Lỗi: {formatErrorRate(seenCount, hardCount)}</span>
                  <span>{formatReviewGap(lastReviewedAt, now)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
                {seenCount > 0 ? `${seenCount} lần` : 'Mới'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressMapView;
