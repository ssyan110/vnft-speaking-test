import React, { useEffect, useState } from 'react';
import { CHINESE_CHARACTERS } from '../constants/characters';
import {
  CharacterProgress,
  ChineseCharacter,
  PracticeRating,
  PracticeSessionStats,
} from '../types';

const ROUND_SIZE = 10;
const STORAGE_KEY = 'vnft-character-progress-v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BOX = 4;
const BOX_INTERVALS_MS = [0, DAY_MS, 3 * DAY_MS, 7 * DAY_MS, 14 * DAY_MS];

type PracticeState = 'idle' | 'prompt' | 'answer' | 'round_complete';
type ProgressMap = Record<string, CharacterProgress>;
type RoundStruggleMap = Record<string, { again: number; hard: number }>;

interface CharacterRecognitionProps {
  onBack: () => void;
}

const CHARACTER_LOOKUP = CHINESE_CHARACTERS.reduce<Record<string, ChineseCharacter>>((lookup, entry) => {
  lookup[entry.character] = entry;
  return lookup;
}, {});

const CHARACTER_KEYS = new Set(CHINESE_CHARACTERS.map(({ character }) => character));

const createInitialStats = (): PracticeSessionStats => ({
  reviewed: 0,
  again: 0,
  hard: 0,
  easy: 0,
  masteredThisRound: 0,
});

const createProgressRecord = (character: string): CharacterProgress => ({
  character,
  box: 0,
  streak: 0,
  lapses: 0,
  seenCount: 0,
  lastReviewedAt: null,
  nextDueAt: 0,
});

const clampBox = (value: number) => Math.min(MAX_BOX, Math.max(0, value));

const toNonNegativeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

const sanitizeProgress = (raw: unknown): ProgressMap => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  return Object.entries(raw as Record<string, unknown>).reduce<ProgressMap>((progressMap, [character, value]) => {
    if (!CHARACTER_KEYS.has(character) || !value || typeof value !== 'object' || Array.isArray(value)) {
      return progressMap;
    }

    const entry = value as Partial<CharacterProgress>;
    const box = clampBox(toNonNegativeNumber(entry.box));

    progressMap[character] = {
      character,
      box,
      streak: toNonNegativeNumber(entry.streak),
      lapses: toNonNegativeNumber(entry.lapses),
      seenCount: toNonNegativeNumber(entry.seenCount),
      lastReviewedAt:
        typeof entry.lastReviewedAt === 'number' && Number.isFinite(entry.lastReviewedAt)
          ? entry.lastReviewedAt
          : null,
      nextDueAt: toNonNegativeNumber(entry.nextDueAt),
    };

    return progressMap;
  }, {});
};

const loadProgress = (): ProgressMap => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawProgress = window.localStorage.getItem(STORAGE_KEY);
    return rawProgress ? sanitizeProgress(JSON.parse(rawProgress)) : {};
  } catch {
    return {};
  }
};

const compareDueCards = (left: ChineseCharacter, right: ChineseCharacter, progressMap: ProgressMap) => {
  const leftProgress = progressMap[left.character];
  const rightProgress = progressMap[right.character];

  if (!leftProgress || !rightProgress) {
    return left.character.localeCompare(right.character);
  }

  return (
    leftProgress.box - rightProgress.box ||
    leftProgress.nextDueAt - rightProgress.nextDueAt ||
    rightProgress.lapses - leftProgress.lapses ||
    left.character.localeCompare(right.character)
  );
};

const shuffleCharacters = (characters: ChineseCharacter[]) => {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const buildRoundQueue = (progressMap: ProgressMap, now: number) => {
  const dueCards = CHINESE_CHARACTERS.filter(({ character }) => {
    const progress = progressMap[character];
    return progress ? progress.nextDueAt <= now : false;
  }).sort((left, right) => compareDueCards(left, right, progressMap));

  if (dueCards.length >= ROUND_SIZE) {
    return dueCards.slice(0, ROUND_SIZE);
  }

  const unseenCards = shuffleCharacters(
    CHINESE_CHARACTERS.filter(({ character }) => !progressMap[character]),
  );

  return [...dueCards, ...unseenCards.slice(0, ROUND_SIZE - dueCards.length)];
};

const getUpdatedProgress = (
  currentProgress: CharacterProgress,
  rating: PracticeRating,
  now: number,
): CharacterProgress => {
  if (rating === 'again') {
    return {
      ...currentProgress,
      box: 0,
      streak: 0,
      lapses: currentProgress.lapses + 1,
      seenCount: currentProgress.seenCount + 1,
      lastReviewedAt: now,
      nextDueAt: now,
    };
  }

  if (rating === 'hard') {
    const nextBox = clampBox(currentProgress.box - 1);

    return {
      ...currentProgress,
      box: nextBox,
      streak: 0,
      lapses: currentProgress.lapses + 1,
      seenCount: currentProgress.seenCount + 1,
      lastReviewedAt: now,
      nextDueAt: now + BOX_INTERVALS_MS[nextBox],
    };
  }

  const nextBox = clampBox(currentProgress.box + 1);

  return {
    ...currentProgress,
    box: nextBox,
    streak: currentProgress.streak + 1,
    seenCount: currentProgress.seenCount + 1,
    lastReviewedAt: now,
    nextDueAt: now + BOX_INTERVALS_MS[nextBox],
  };
};

const reinsertCard = (queue: ChineseCharacter[], card: ChineseCharacter, offset: number) => {
  const nextQueue = [...queue];
  nextQueue.splice(Math.min(offset, nextQueue.length), 0, card);
  return nextQueue;
};

const getDueCount = (progressMap: ProgressMap, now: number) =>
  CHINESE_CHARACTERS.filter(({ character }) => {
    const progress = progressMap[character];
    return progress ? progress.nextDueAt <= now : false;
  }).length;

const getMasteredCount = (progressMap: ProgressMap) =>
  CHINESE_CHARACTERS.filter(({ character }) => {
    const progress = progressMap[character];
    return progress ? progress.box >= MAX_BOX : false;
  }).length;

const CharacterRecognition: React.FC<CharacterRecognitionProps> = ({ onBack }) => {
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [roundQueue, setRoundQueue] = useState<ChineseCharacter[]>([]);
  const [progressMap, setProgressMap] = useState<ProgressMap>(() => loadProgress());
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>(() => createInitialStats());
  const [roundStruggles, setRoundStruggles] = useState<RoundStruggleMap>({});

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (Object.keys(progressMap).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  }, [progressMap]);

  const currentCard = roundQueue[0] ?? null;
  const now = Date.now();
  const dueCount = getDueCount(progressMap, now);
  const masteredCount = getMasteredCount(progressMap);
  const hasUnseenCards = CHINESE_CHARACTERS.some(({ character }) => !progressMap[character]);
  const hardestCards = Object.entries(roundStruggles)
    .map(([character, struggles]) => ({
      card: CHARACTER_LOOKUP[character],
      ...struggles,
      score: struggles.again * 2 + struggles.hard,
    }))
    .filter(({ card, score }) => Boolean(card) && score > 0)
    .sort((left, right) => right.score - left.score || right.again - left.again || right.hard - left.hard)
    .slice(0, 3);

  const startRound = () => {
    const nextQueue = buildRoundQueue(progressMap, Date.now());
    setRoundQueue(nextQueue);
    setSessionStats(createInitialStats());
    setRoundStruggles({});
    setPracticeState(nextQueue.length > 0 ? 'prompt' : 'round_complete');
  };

  const handleShowAnswer = () => {
    if (practiceState === 'prompt') {
      setPracticeState('answer');
    }
  };

  const handleRateCard = (rating: PracticeRating) => {
    if (!currentCard || practiceState !== 'answer') {
      return;
    }

    const reviewedAt = Date.now();
    const currentProgress = progressMap[currentCard.character] ?? createProgressRecord(currentCard.character);
    const updatedProgress = getUpdatedProgress(currentProgress, rating, reviewedAt);
    const nextProgressMap = {
      ...progressMap,
      [currentCard.character]: updatedProgress,
    };

    setProgressMap(nextProgressMap);

    const masteredIncrement =
      rating === 'easy' && currentProgress.box < MAX_BOX && updatedProgress.box === MAX_BOX ? 1 : 0;

    setSessionStats({
      reviewed: sessionStats.reviewed + 1,
      again: sessionStats.again + (rating === 'again' ? 1 : 0),
      hard: sessionStats.hard + (rating === 'hard' ? 1 : 0),
      easy: sessionStats.easy + (rating === 'easy' ? 1 : 0),
      masteredThisRound: sessionStats.masteredThisRound + masteredIncrement,
    });

    if (rating !== 'easy') {
      const currentStruggles = roundStruggles[currentCard.character] ?? { again: 0, hard: 0 };
      setRoundStruggles({
        ...roundStruggles,
        [currentCard.character]: {
          ...currentStruggles,
          [rating]: currentStruggles[rating] + 1,
        },
      });
    }

    const remainingQueue = roundQueue.slice(1);
    const nextQueue =
      rating === 'again'
        ? reinsertCard(remainingQueue, currentCard, 2)
        : rating === 'hard'
          ? reinsertCard(remainingQueue, currentCard, 4)
          : remainingQueue;

    setRoundQueue(nextQueue);
    setPracticeState(nextQueue.length > 0 ? 'prompt' : 'round_complete');
  };

  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
      const shouldReset = window.confirm('Xóa toàn bộ tiến độ luyện chữ đã lưu trên trình duyệt này?');
      if (!shouldReset) {
        return;
      }

      window.localStorage.removeItem(STORAGE_KEY);
    }

    setProgressMap({});
    setRoundQueue([]);
    setSessionStats(createInitialStats());
    setRoundStruggles({});
    setPracticeState('idle');
  };

  const cardsLeftInRound = practiceState === 'round_complete' ? 0 : roundQueue.length;
  const hasAvailableCards = dueCount > 0 || hasUnseenCards;

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 flex flex-col p-4 sm:p-8 font-sans">
      <header className="w-full max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 text-emerald-600 hover:text-emerald-700 font-semibold text-lg flex items-center gap-2"
        >
          ← Quay lại
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-emerald-700 tracking-tight">
              Tập nhận diện chữ Hán
            </h1>
            <p className="text-lg text-emerald-600 mt-2 max-w-2xl">
              Nhìn chữ, đọc pinyin và nói nghĩa trước khi xem đáp án. Chữ khó sẽ quay lại sớm hơn để
              tăng ghi nhớ.
            </p>
          </div>

          <button
            onClick={handleResetProgress}
            className="self-start lg:self-auto bg-white text-emerald-700 font-semibold py-3 px-5 rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition-colors"
          >
            Đặt lại tiến độ
          </button>
        </div>

        <div className="grid gap-3 mt-6 sm:grid-cols-3">
          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Trong vòng</p>
            <p className="text-3xl font-bold text-emerald-800 mt-2">{cardsLeftInRound}</p>
            <p className="text-sm text-emerald-600 mt-1">Mỗi vòng tối đa {ROUND_SIZE} chữ</p>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Đến hạn</p>
            <p className="text-3xl font-bold text-emerald-800 mt-2">{dueCount}</p>
            <p className="text-sm text-emerald-600 mt-1">Ưu tiên các chữ yếu trước</p>
          </div>

          <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Đã vững</p>
            <p className="text-3xl font-bold text-emerald-800 mt-2">{masteredCount}</p>
            <p className="text-sm text-emerald-600 mt-1">Hộp 4 trên tổng {CHINESE_CHARACTERS.length} chữ</p>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto flex items-center justify-center py-8">
        {practiceState === 'idle' && (
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-emerald-200 p-8 sm:p-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
              Active Recall
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-emerald-800 mt-4">Bắt đầu một vòng luyện</h2>
            <p className="text-lg text-emerald-600 mt-4 max-w-2xl mx-auto">
              Mỗi lượt hiển thị một chữ Hán. Học sinh tự gọi pinyin và nghĩa, sau đó tự chấm để hệ
              thống lặp lại các chữ còn yếu.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={startRound}
                className="bg-emerald-500 text-white font-bold text-2xl py-4 px-10 rounded-2xl shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
              >
                Bắt đầu vòng học
              </button>
              <p className="text-sm text-emerald-600">
                Đã mở: {Object.keys(progressMap).length}/{CHINESE_CHARACTERS.length} chữ
              </p>
            </div>
          </div>
        )}

        {practiceState === 'prompt' && currentCard && (
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-emerald-200 p-8 sm:p-12 text-center transition-all duration-200">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
              Tự trả lời trước khi lật
            </p>
            <p className="text-lg text-emerald-600 mt-4">Đọc pinyin và nói nghĩa của chữ này.</p>

            <div className="text-[7rem] sm:text-[9rem] font-bold text-emerald-700 leading-none mt-8">
              {currentCard.character}
            </div>

            <p className="mt-6 text-sm sm:text-base text-emerald-600">
              Mục tiêu nhớ: <span className="font-semibold text-emerald-800">pinyin + nghĩa</span>
            </p>

            <button
              onClick={handleShowAnswer}
              className="mt-8 bg-amber-500 text-white font-bold text-2xl py-4 px-10 rounded-2xl shadow-lg hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all"
            >
              Xem đáp án
            </button>
          </div>
        )}

        {practiceState === 'answer' && currentCard && (
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-emerald-200 p-8 sm:p-12 transition-all duration-200">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
                Tự chấm sau khi đã trả lời
              </p>
              <div className="text-6xl sm:text-7xl font-bold text-emerald-700 mt-5">{currentCard.character}</div>
            </div>

            <div className="mt-8 bg-emerald-50 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Pinyin</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">{currentCard.pinyin}</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Nghĩa</p>
                <p className="text-2xl font-semibold text-emerald-900 mt-1">{currentCard.meaning}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-200 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Thông tin thêm</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm sm:text-base">
                <div>
                  <p className="font-semibold text-emerald-800">Hán Việt</p>
                  <p className="text-emerald-700">{currentCard.hanViet}</p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Bộ thủ</p>
                  <p className="text-emerald-700">{currentCard.radical}</p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Loại chữ</p>
                  <p className="text-emerald-700">{currentCard.characterType}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => handleRateCard('again')}
                className="bg-rose-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-lg hover:bg-rose-600 active:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all"
              >
                Lặp lại ngay
              </button>
              <button
                onClick={() => handleRateCard('hard')}
                className="bg-amber-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-lg hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all"
              >
                Khó
              </button>
              <button
                onClick={() => handleRateCard('easy')}
                className="bg-emerald-500 text-white font-bold text-xl py-4 px-6 rounded-2xl shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
              >
                Dễ
              </button>
            </div>
          </div>
        )}

        {practiceState === 'round_complete' && (
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-emerald-200 p-8 sm:p-12">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">
                Round Complete
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-emerald-800 mt-4">Kết thúc vòng học</h2>
              <p className="text-lg text-emerald-600 mt-4">
                {sessionStats.reviewed > 0
                  ? `Bạn đã xử lý ${sessionStats.reviewed} lượt trong vòng này.`
                  : hasAvailableCards
                    ? 'Vòng hiện tại chưa có lượt chấm điểm. Hãy bắt đầu lại để lấy bộ thẻ mới.'
                    : 'Hiện chưa có chữ mới hoặc chữ đến hạn trong trình duyệt này.'}
              </p>
            </div>

            <div className="grid gap-3 mt-8 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-600">Reviewed</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{sessionStats.reviewed}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4 text-center">
                <p className="text-sm text-rose-600">Again</p>
                <p className="text-2xl font-bold text-rose-700 mt-1">{sessionStats.again}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-center">
                <p className="text-sm text-amber-600">Hard</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{sessionStats.hard}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-4 text-center">
                <p className="text-sm text-emerald-600">Easy</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{sessionStats.easy}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4 text-center">
                <p className="text-sm text-sky-600">Mastered</p>
                <p className="text-2xl font-bold text-sky-700 mt-1">{sessionStats.masteredThisRound}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-emerald-800">Chữ cần ôn thêm</h3>
              {hardestCards.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {hardestCards.map(({ card, again, hard, score }) => (
                    <div
                      key={card.character}
                      className="flex items-center justify-between rounded-2xl border border-emerald-200 p-4"
                    >
                      <div>
                        <p className="text-3xl font-bold text-emerald-800">{card.character}</p>
                        <p className="text-sm text-emerald-600">
                          {card.pinyin} • {card.meaning}
                        </p>
                      </div>
                      <div className="text-right text-sm text-emerald-700">
                        <p>Điểm khó: {score}</p>
                        <p>Again: {again}</p>
                        <p>Hard: {hard}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-emerald-600">Không có chữ nào bị đánh dấu Again hoặc Hard trong vòng này.</p>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={startRound}
                className="bg-emerald-500 text-white font-bold text-xl py-4 px-8 rounded-2xl shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
              >
                Tiếp tục vòng mới
              </button>
              <button
                onClick={handleResetProgress}
                className="bg-white text-emerald-700 font-bold text-xl py-4 px-8 rounded-2xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition-all"
              >
                Đặt lại tiến độ
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CharacterRecognition;
