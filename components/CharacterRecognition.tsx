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

const getBoxLabel = (box: number) => (box === 0 ? 'Mới / Yếu' : `Hộp ${box}`);

const CharacterRecognition: React.FC<CharacterRecognitionProps> = ({ onBack }) => {
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [roundQueue, setRoundQueue] = useState<ChineseCharacter[]>([]);
  const [progressMap, setProgressMap] = useState<ProgressMap>(() => loadProgress());
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>(() => createInitialStats());
  const [roundStruggles, setRoundStruggles] = useState<RoundStruggleMap>({});
  const [showExtraInfo, setShowExtraInfo] = useState(false);

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
  const currentProgress = currentCard ? progressMap[currentCard.character] ?? createProgressRecord(currentCard.character) : null;
  const now = Date.now();
  const dueCount = getDueCount(progressMap, now);
  const masteredCount = getMasteredCount(progressMap);
  const discoveredCount = Object.keys(progressMap).length;
  const hasUnseenCards = CHINESE_CHARACTERS.some(({ character }) => !progressMap[character]);
  const cardsLeftInRound = practiceState === 'round_complete' ? 0 : roundQueue.length;
  const hasAvailableCards = dueCount > 0 || hasUnseenCards;
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
    setShowExtraInfo(false);
    setPracticeState(nextQueue.length > 0 ? 'prompt' : 'round_complete');
  };

  const handleShowAnswer = () => {
    if (practiceState === 'prompt') {
      setShowExtraInfo(false);
      setPracticeState('answer');
    }
  };

  const handleRateCard = (rating: PracticeRating) => {
    if (!currentCard || practiceState !== 'answer') {
      return;
    }

    const reviewedAt = Date.now();
    const currentCardProgress = progressMap[currentCard.character] ?? createProgressRecord(currentCard.character);
    const updatedProgress = getUpdatedProgress(currentCardProgress, rating, reviewedAt);
    const nextProgressMap = {
      ...progressMap,
      [currentCard.character]: updatedProgress,
    };

    setProgressMap(nextProgressMap);

    const masteredIncrement =
      rating === 'easy' && currentCardProgress.box < MAX_BOX && updatedProgress.box === MAX_BOX ? 1 : 0;

    setSessionStats((previousStats) => ({
      reviewed: previousStats.reviewed + 1,
      again: previousStats.again + (rating === 'again' ? 1 : 0),
      hard: previousStats.hard + (rating === 'hard' ? 1 : 0),
      easy: previousStats.easy + (rating === 'easy' ? 1 : 0),
      masteredThisRound: previousStats.masteredThisRound + masteredIncrement,
    }));

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
    setShowExtraInfo(false);
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
    setShowExtraInfo(false);
    setPracticeState('idle');
  };

  const renderContent = () => {
    if (practiceState === 'idle') {
      return (
        <div className="h-full flex flex-col justify-center text-center gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">
              Mobile-first review
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-emerald-900">Một thẻ, một quyết định</h2>
            <p className="text-sm sm:text-base text-emerald-700 max-w-xl mx-auto">
              Màn hình đã được rút gọn để học sinh không phải cuộn trang. Nhìn chữ, nói pinyin + nghĩa,
              rồi chấm ngay để hệ thống lặp lại chữ còn yếu.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Bước 1</p>
              <p className="mt-2 font-semibold text-emerald-900">Nhìn chữ</p>
              <p className="mt-1 text-sm text-emerald-700">Tập trung vào mặt chữ trước khi lật.</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Bước 2</p>
              <p className="mt-2 font-semibold text-emerald-900">Tự nói</p>
              <p className="mt-1 text-sm text-emerald-700">Đọc pinyin và nói nghĩa thành tiếng.</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-left">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Bước 3</p>
              <p className="mt-2 font-semibold text-emerald-900">Tự chấm</p>
              <p className="mt-1 text-sm text-emerald-700">Chữ khó quay lại nhanh hơn trong vòng học.</p>
            </div>
          </div>

          <p className="text-sm text-emerald-600">
            Đã mở: {discoveredCount}/{CHINESE_CHARACTERS.length} chữ
          </p>
        </div>
      );
    }

    if (practiceState === 'prompt' && currentCard) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center gap-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">
              Tự trả lời trước khi lật
            </p>
            <p className="text-sm sm:text-base text-emerald-700">
              Đọc <span className="font-semibold text-emerald-900">pinyin + nghĩa</span> của chữ này.
            </p>
          </div>

          <div className="text-[6rem] leading-none font-bold text-emerald-700 sm:text-[8rem] lg:text-[10rem]">
            {currentCard.character}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {getBoxLabel(currentProgress?.box ?? 0)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Đã gặp {currentProgress?.seenCount ?? 0} lần
            </span>
          </div>
        </div>
      );
    }

    if (practiceState === 'answer' && currentCard) {
      return (
        <div className="h-full flex flex-col gap-4 sm:gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">Đáp án</p>
              <div className="mt-3 text-5xl font-bold text-emerald-700 sm:text-6xl">{currentCard.character}</div>
            </div>

            <button
              onClick={() => setShowExtraInfo((previous) => !previous)}
              className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {showExtraInfo ? 'Ẩn chi tiết' : 'Thông tin thêm'}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Pinyin</p>
              <p className="mt-2 text-3xl font-bold text-emerald-900">{currentCard.pinyin}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Nghĩa</p>
              <p className="mt-2 text-xl font-semibold text-emerald-900 sm:text-2xl">{currentCard.meaning}</p>
            </div>
          </div>

          {showExtraInfo && (
            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Hán Việt</p>
                  <p className="mt-1 font-semibold text-emerald-900">{currentCard.hanViet}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Bộ thủ</p>
                  <p className="mt-1 text-sm text-emerald-700">{currentCard.radical}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Loại chữ</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">{currentCard.characterType}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-emerald-100/70 px-4 py-3 text-sm text-emerald-800">
            Tự chấm ngay bên dưới. Chọn Lặp lại ngay nếu muốn đưa chữ này quay lại rất sớm trong vòng học.
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col gap-5">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">
            Round complete
          </p>
          <h2 className="mt-3 text-3xl font-bold text-emerald-900 sm:text-4xl">Kết thúc vòng học</h2>
          <p className="mt-3 text-sm sm:text-base text-emerald-700">
            {sessionStats.reviewed > 0
              ? `Bạn đã xử lý ${sessionStats.reviewed} lượt trong vòng này.`
              : hasAvailableCards
                ? 'Vòng hiện tại chưa có lượt chấm điểm. Bắt đầu lại để lấy bộ thẻ mới.'
                : 'Hiện chưa có chữ mới hoặc chữ đến hạn trong trình duyệt này.'}
          </p>
        </div>

        <div className="grid gap-3 grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-emerald-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Reviewed</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{sessionStats.reviewed}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-500">Again</p>
            <p className="mt-2 text-2xl font-bold text-rose-700">{sessionStats.again}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Hard</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{sessionStats.hard}</p>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Easy</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{sessionStats.easy}</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Mastered</p>
            <p className="mt-2 text-2xl font-bold text-sky-700">{sessionStats.masteredThisRound}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <h3 className="text-lg font-bold text-emerald-900">Chữ cần ôn thêm</h3>
          {hardestCards.length > 0 ? (
            <div className="mt-3 space-y-3">
              {hardestCards.map(({ card, again, hard, score }) => (
                <div
                  key={card.character}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-emerald-200"
                >
                  <div>
                    <p className="text-3xl font-bold text-emerald-800">{card.character}</p>
                    <p className="text-sm text-emerald-700">
                      {card.pinyin} • {card.meaning}
                    </p>
                  </div>
                  <div className="text-right text-xs sm:text-sm text-emerald-700">
                    <p>Điểm khó: {score}</p>
                    <p>Again: {again}</p>
                    <p>Hard: {hard}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-emerald-700">
              Không có chữ nào bị đánh dấu Again hoặc Hard trong vòng này.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCoachPanel = () => {
    if (practiceState === 'round_complete') {
      return (
        <>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Tiếp theo</p>
            <p className="mt-2 text-lg font-bold text-emerald-900">Bắt đầu vòng mới</p>
            <p className="mt-2 text-sm text-emerald-700">
              Hệ thống sẽ ưu tiên chữ đến hạn trước, sau đó thêm chữ mới nếu còn chỗ trong vòng.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Tiến độ</p>
            <div className="mt-3 space-y-3 text-sm text-emerald-800">
              <div className="flex items-center justify-between">
                <span>Đã vững</span>
                <span className="font-semibold">{masteredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Đến hạn</span>
                <span className="font-semibold">{dueCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Đã mở</span>
                <span className="font-semibold">{discoveredCount}</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (practiceState === 'answer' && currentCard && currentProgress) {
      return (
        <>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Thẻ hiện tại</p>
            <p className="mt-2 text-4xl font-bold text-emerald-800">{currentCard.character}</p>
            <p className="mt-1 text-sm text-emerald-700">{currentCard.pinyin}</p>
            <div className="mt-4 space-y-3 text-sm text-emerald-800">
              <div className="flex items-center justify-between">
                <span>Vị trí</span>
                <span className="font-semibold">{getBoxLabel(currentProgress.box)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Đã gặp</span>
                <span className="font-semibold">{currentProgress.seenCount} lần</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lapses</span>
                <span className="font-semibold">{currentProgress.lapses}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Mẹo chấm</p>
            <div className="mt-3 space-y-3 text-sm text-emerald-800">
              <p><span className="font-semibold">Lặp lại ngay:</span> quên hoặc đoán sai.</p>
              <p><span className="font-semibold">Khó:</span> nhớ được nhưng chậm hoặc thiếu chắc chắn.</p>
              <p><span className="font-semibold">Dễ:</span> gọi ra nhanh, đúng pinyin và nghĩa.</p>
            </div>
          </div>
        </>
      );
    }

    if (practiceState === 'prompt' && currentCard && currentProgress) {
      return (
        <>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Trong vòng</p>
            <p className="mt-2 text-4xl font-bold text-emerald-800">{cardsLeftInRound}</p>
            <p className="mt-1 text-sm text-emerald-700">Còn lại trước khi kết thúc vòng hiện tại.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Gợi ý</p>
            <div className="mt-3 space-y-3 text-sm text-emerald-800">
              <p>Nhìn chữ vài giây trước khi lật.</p>
              <p>Ưu tiên gọi đúng pinyin rồi mới nói nghĩa.</p>
              <p>Đừng bỏ qua chữ khó, vì nó sẽ quay lại nhanh hơn.</p>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="rounded-2xl border border-emerald-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Deck</p>
          <p className="mt-2 text-4xl font-bold text-emerald-800">{CHINESE_CHARACTERS.length}</p>
          <p className="mt-1 text-sm text-emerald-700">Tổng số chữ hiện có trong bộ luyện tập.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Nguyên tắc</p>
          <div className="mt-3 space-y-3 text-sm text-emerald-800">
            <p>Tập theo vòng ngắn để không bị quá tải trên điện thoại.</p>
            <p>Thanh hành động luôn nằm dưới cùng, không cần cuộn để bấm.</p>
            <p>Desktop giữ thêm bảng hỗ trợ bên phải để theo dõi tiến độ.</p>
          </div>
        </div>
      </>
    );
  };

  const renderFooterActions = () => {
    if (practiceState === 'idle') {
      return (
        <button
          onClick={startRound}
          className="w-full sm:w-auto bg-emerald-500 text-white font-bold text-lg sm:text-xl py-4 px-8 rounded-2xl shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
        >
          Bắt đầu vòng học
        </button>
      );
    }

    if (practiceState === 'prompt') {
      return (
        <button
          onClick={handleShowAnswer}
          className="w-full sm:w-auto bg-amber-500 text-white font-bold text-lg sm:text-xl py-4 px-8 rounded-2xl shadow-lg hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all"
        >
          Xem đáp án
        </button>
      );
    }

    if (practiceState === 'answer') {
      return (
        <div className="grid w-full gap-2 sm:grid-cols-3">
          <button
            onClick={() => handleRateCard('again')}
            className="bg-rose-500 text-white font-bold text-base sm:text-lg py-4 px-4 rounded-2xl shadow-lg hover:bg-rose-600 active:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-300 transition-all"
          >
            Lặp lại ngay
          </button>
          <button
            onClick={() => handleRateCard('hard')}
            className="bg-amber-500 text-white font-bold text-base sm:text-lg py-4 px-4 rounded-2xl shadow-lg hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all"
          >
            Khó
          </button>
          <button
            onClick={() => handleRateCard('easy')}
            className="bg-emerald-500 text-white font-bold text-base sm:text-lg py-4 px-4 rounded-2xl shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
          >
            Dễ
          </button>
        </div>
      );
    }

    return (
      <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
        <button
          onClick={startRound}
          className="bg-emerald-500 text-white font-bold text-base sm:text-lg py-4 px-8 rounded-2xl shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all"
        >
          Tiếp tục vòng mới
        </button>
        <button
          onClick={handleResetProgress}
          className="bg-white text-emerald-700 font-bold text-base sm:text-lg py-4 px-8 rounded-2xl border border-emerald-200 shadow-sm hover:bg-emerald-100 transition-all"
        >
          Đặt lại tiến độ
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,_#f7fef9,_#dff5e6_55%,_#d7efe0)] text-emerald-950 flex flex-col overflow-hidden font-sans">
      <header className="border-b border-emerald-200/80 bg-emerald-50/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              ← Quay lại
            </button>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="truncate text-xl font-bold text-emerald-800 sm:text-2xl">Tập nhận diện chữ Hán</h1>
              <p className="truncate text-xs text-emerald-600 sm:text-sm">
                Nhìn chữ, nói pinyin + nghĩa, rồi tự chấm ngay ở thanh dưới.
              </p>
            </div>

            <button
              onClick={handleResetProgress}
              className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Trong vòng</p>
              <p className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{cardsLeftInRound}</p>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Đến hạn</p>
              <p className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{dueCount}</p>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Đã vững</p>
              <p className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{masteredCount}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <div className="max-w-6xl mx-auto h-full px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="min-h-0 overflow-hidden rounded-[28px] border border-emerald-200 bg-white/90 shadow-[0_20px_60px_rgba(16,72,40,0.08)] backdrop-blur">
              <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500">
                      {practiceState === 'idle'
                        ? 'Adaptive Deck'
                        : practiceState === 'prompt'
                          ? 'Prompt'
                          : practiceState === 'answer'
                            ? 'Answer'
                            : 'Summary'}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      {practiceState === 'round_complete'
                        ? 'Kết quả vòng vừa xong'
                        : `Đã xử lý ${sessionStats.reviewed} lượt trong phiên này`}
                    </p>
                  </div>

                  {currentProgress && practiceState !== 'round_complete' && practiceState !== 'idle' && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {getBoxLabel(currentProgress.box)}
                    </span>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pt-5 pr-1">
                  {renderContent()}
                </div>
              </div>
            </section>

            <aside className="hidden min-h-0 flex-col gap-4 lg:flex">
              {renderCoachPanel()}
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-emerald-200/80 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          {renderFooterActions()}
        </div>
      </footer>
    </div>
  );
};

export default CharacterRecognition;
