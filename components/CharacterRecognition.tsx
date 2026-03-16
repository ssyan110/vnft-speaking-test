import React, { useEffect, useState } from 'react';
import { CHINESE_CHARACTERS } from '../constants/characters';
import { CharacterProgress, ChineseCharacter, PracticeRating, PracticeSessionStats } from '../types';

const ROUND_SIZE = 10;
const STORAGE_KEY = 'vnft-character-progress-v2';
const LEGACY_STORAGE_KEY = 'vnft-character-progress-v1';

type PracticeState = 'idle' | 'prompt' | 'answer' | 'round_complete';
type ReviewMode = 'all' | 'hard';
type ProgressMap = Record<string, CharacterProgress>;

interface StoredPracticeState {
  currentCycle: number;
  progressMap: ProgressMap;
}

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
  hard: 0,
  easy: 0,
});

const createProgressRecord = (character: string): CharacterProgress => ({
  character,
  seenCount: 0,
  hardCount: 0,
  easyCount: 0,
  isHard: false,
  completedCycle: -1,
  lastReviewedAt: null,
});

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

    const entry = value as Partial<CharacterProgress> & {
      lapses?: unknown;
      streak?: unknown;
    };

    progressMap[character] = {
      character,
      seenCount: toNonNegativeNumber(entry.seenCount),
      hardCount: toNonNegativeNumber(entry.hardCount, toNonNegativeNumber(entry.lapses)),
      easyCount: toNonNegativeNumber(entry.easyCount, toNonNegativeNumber(entry.streak)),
      isHard: Boolean(entry.isHard),
      completedCycle:
        typeof entry.completedCycle === 'number' && Number.isFinite(entry.completedCycle)
          ? Math.floor(entry.completedCycle)
          : -1,
      lastReviewedAt:
        typeof entry.lastReviewedAt === 'number' && Number.isFinite(entry.lastReviewedAt)
          ? entry.lastReviewedAt
          : null,
    };

    return progressMap;
  }, {});
};

const loadStoredState = (): StoredPracticeState => {
  if (typeof window === 'undefined') {
    return {
      currentCycle: 0,
      progressMap: {},
    };
  }

  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current) as Partial<StoredPracticeState> | Record<string, unknown>;
      return {
        currentCycle:
          typeof parsed.currentCycle === 'number' && Number.isFinite(parsed.currentCycle)
            ? Math.max(0, Math.floor(parsed.currentCycle))
            : 0,
        progressMap: sanitizeProgress('progressMap' in parsed ? parsed.progressMap : parsed),
      };
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      return {
        currentCycle: 0,
        progressMap: sanitizeProgress(JSON.parse(legacy)),
      };
    }
  } catch {
    return {
      currentCycle: 0,
      progressMap: {},
    };
  }

  return {
    currentCycle: 0,
    progressMap: {},
  };
};

const shuffleCharacters = (characters: ChineseCharacter[]) => {
  const shuffled = [...characters];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const countCompletedInCycle = (progressMap: ProgressMap, currentCycle: number) =>
  CHINESE_CHARACTERS.filter(({ character }) => {
    const progress = progressMap[character];
    return progress ? progress.completedCycle >= currentCycle : false;
  }).length;

const getHardCharacters = (progressMap: ProgressMap) =>
  CHINESE_CHARACTERS.filter(({ character }) => progressMap[character]?.isHard);

const buildMainQueue = (progressMap: ProgressMap, currentCycle: number) => {
  const availableCharacters = CHINESE_CHARACTERS.filter(({ character }) => {
    const progress = progressMap[character];
    return progress ? progress.completedCycle < currentCycle : true;
  });

  return shuffleCharacters(availableCharacters).slice(0, ROUND_SIZE);
};

const buildHardQueue = (progressMap: ProgressMap) => shuffleCharacters(getHardCharacters(progressMap)).slice(0, ROUND_SIZE);

const CharacterRecognition: React.FC<CharacterRecognitionProps> = ({ onBack }) => {
  const storedState = loadStoredState();
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('all');
  const [roundQueue, setRoundQueue] = useState<ChineseCharacter[]>([]);
  const [progressMap, setProgressMap] = useState<ProgressMap>(storedState.progressMap);
  const [currentCycle, setCurrentCycle] = useState<number>(storedState.currentCycle);
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>(createInitialStats());
  const [showExtraInfo, setShowExtraInfo] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hasProgress = Object.keys(progressMap).length > 0 || currentCycle > 0;
    if (!hasProgress) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentCycle,
        progressMap,
      }),
    );
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, [currentCycle, progressMap]);

  const currentCard = roundQueue[0] ?? null;
  const currentProgress = currentCard ? progressMap[currentCard.character] ?? createProgressRecord(currentCard.character) : null;
  const hardCharacters = getHardCharacters(progressMap);
  const hardCount = hardCharacters.length;
  const doneCount = countCompletedInCycle(progressMap, currentCycle);
  const cardsLeft = practiceState === 'round_complete' ? 0 : roundQueue.length;
  const discoveredCount = Object.keys(progressMap).length;

  const resetRound = () => {
    setRoundQueue([]);
    setSessionStats(createInitialStats());
    setShowExtraInfo(false);
  };

  const startRound = (mode = reviewMode) => {
    let nextCycle = currentCycle;

    if (mode === 'all' && countCompletedInCycle(progressMap, currentCycle) === CHINESE_CHARACTERS.length) {
      nextCycle = currentCycle + 1;
      setCurrentCycle(nextCycle);
    }

    const nextQueue = mode === 'hard' ? buildHardQueue(progressMap) : buildMainQueue(progressMap, nextCycle);
    resetRound();
    setReviewMode(mode);
    setRoundQueue(nextQueue);
    setPracticeState(nextQueue.length > 0 ? 'prompt' : 'round_complete');
  };

  const selectMode = (mode: ReviewMode) => {
    if (mode === reviewMode) {
      return;
    }

    setReviewMode(mode);
    resetRound();
    setPracticeState('idle');
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
    const completedCycle =
      reviewMode === 'all' ? currentCycle : currentCardProgress.completedCycle;
    const updatedProgress: CharacterProgress =
      rating === 'hard'
        ? {
            ...currentCardProgress,
            seenCount: currentCardProgress.seenCount + 1,
            hardCount: currentCardProgress.hardCount + 1,
            isHard: true,
            completedCycle,
            lastReviewedAt: reviewedAt,
          }
        : {
            ...currentCardProgress,
            seenCount: currentCardProgress.seenCount + 1,
            easyCount: currentCardProgress.easyCount + 1,
            isHard: false,
            completedCycle,
            lastReviewedAt: reviewedAt,
          };

    setProgressMap((previousMap) => ({
      ...previousMap,
      [currentCard.character]: updatedProgress,
    }));

    setSessionStats((previousStats) => ({
      reviewed: previousStats.reviewed + 1,
      hard: previousStats.hard + (rating === 'hard' ? 1 : 0),
      easy: previousStats.easy + (rating === 'easy' ? 1 : 0),
    }));

    const nextQueue = roundQueue.slice(1);

    setRoundQueue(nextQueue);
    setShowExtraInfo(false);
    setPracticeState(nextQueue.length > 0 ? 'prompt' : 'round_complete');
  };

  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
      const shouldReset = window.confirm('Xóa toàn bộ tiến độ?');
      if (!shouldReset) {
        return;
      }

      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    setProgressMap({});
    setCurrentCycle(0);
    resetRound();
    setPracticeState('idle');
    setReviewMode('all');
  };

  const renderIdle = () => {
    if (reviewMode === 'hard' && hardCount === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl font-bold text-emerald-700">0</div>
          <div className="text-lg font-semibold text-emerald-900">Không có chữ khó</div>
        </div>
      );
    }

    if (reviewMode === 'hard') {
      return (
        <div className="flex h-full flex-col gap-5">
          <div className="text-center">
            <div className="text-5xl font-bold text-emerald-700">{hardCount}</div>
            <div className="mt-2 text-lg font-semibold text-emerald-900">Chữ khó</div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex flex-wrap gap-2">
              {hardCharacters.map((character) => (
                <div
                  key={character.character}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700"
                >
                  {character.character}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl font-bold text-emerald-700">
          {reviewMode === 'hard' ? hardCount : CHINESE_CHARACTERS.length - doneCount}
        </div>
        <div className="text-lg font-semibold text-emerald-900">
          {reviewMode === 'hard' ? 'Chữ khó' : 'Chữ còn lại'}
        </div>
      </div>
    );
  };

  const renderPrompt = () => {
    if (!currentCard) {
      return null;
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <div className="text-[6rem] font-bold leading-none text-emerald-700 sm:text-[8rem] lg:text-[10rem]">
          {currentCard.character}
        </div>
        <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
          Nói pinyin + nghĩa
        </div>
      </div>
    );
  };

  const renderAnswer = () => {
    if (!currentCard) {
      return null;
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-5xl font-bold text-emerald-700 sm:text-6xl">{currentCard.character}</div>
          <button
            onClick={() => setShowExtraInfo((previous) => !previous)}
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            {showExtraInfo ? 'Ẩn' : 'Thêm'}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Pinyin</div>
            <div className="mt-2 text-3xl font-bold text-emerald-900">{currentCard.pinyin}</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Nghĩa</div>
            <div className="mt-2 text-xl font-semibold text-emerald-900 sm:text-2xl">{currentCard.meaning}</div>
          </div>
        </div>

        {showExtraInfo && (
          <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-white p-4 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Hán Việt</div>
              <div className="mt-1 font-semibold text-emerald-900">{currentCard.hanViet}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Bộ thủ</div>
              <div className="mt-1 text-sm text-emerald-700">{currentCard.radical}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Loại chữ</div>
              <div className="mt-1 text-sm font-semibold text-emerald-700">{currentCard.characterType}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRoundComplete = () => {
    const visibleHardCharacters = hardCharacters.slice(0, 8);

    return (
      <div className="flex h-full flex-col gap-5">
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-900">Xong vòng</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Đã xem</div>
            <div className="mt-2 text-2xl font-bold text-emerald-800">{sessionStats.reviewed}</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-amber-500">Khó</div>
            <div className="mt-2 text-2xl font-bold text-amber-700">{sessionStats.hard}</div>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-600">Dễ</div>
            <div className="mt-2 text-2xl font-bold text-emerald-700">{sessionStats.easy}</div>
          </div>
        </div>

        {hardCount > 0 && (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="mb-3 text-sm font-semibold text-emerald-800">Chữ khó</div>
            <div className="flex flex-wrap gap-2">
              {visibleHardCharacters.map((character) => (
                <button
                  key={character.character}
                  onClick={() => {
                    setReviewMode('hard');
                    setPracticeState('idle');
                    resetRound();
                  }}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700"
                >
                  {character.character}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (practiceState === 'idle') {
      return renderIdle();
    }

    if (practiceState === 'prompt') {
      return renderPrompt();
    }

    if (practiceState === 'answer') {
      return renderAnswer();
    }

    return renderRoundComplete();
  };

  const renderFooterActions = () => {
    if (practiceState === 'idle') {
      return (
        <button
          onClick={() => startRound(reviewMode)}
          disabled={reviewMode === 'hard' && hardCount === 0}
          className="w-full sm:w-auto rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          Bắt đầu
        </button>
      );
    }

    if (practiceState === 'prompt') {
      return (
        <button
          onClick={handleShowAnswer}
          className="w-full sm:w-auto rounded-2xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-amber-600"
        >
          Xem đáp án
        </button>
      );
    }

    if (practiceState === 'answer') {
      return (
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <button
            onClick={() => handleRateCard('hard')}
            className="rounded-2xl bg-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-amber-600 sm:text-lg"
          >
            Từ này khó
          </button>
          <button
            onClick={() => handleRateCard('easy')}
            className="rounded-2xl bg-emerald-500 px-5 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 sm:text-lg"
          >
            Từ này dễ
          </button>
        </div>
      );
    }

    return (
      <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
        <button
          onClick={() => startRound(reviewMode)}
          className="rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 sm:text-lg"
        >
          Vòng mới
        </button>
        <button
          onClick={() => {
            if (reviewMode === 'all') {
              startRound('hard');
              return;
            }

            selectMode('all');
          }}
          disabled={reviewMode === 'all' && hardCount === 0}
          className="rounded-2xl border border-emerald-200 bg-white px-8 py-4 text-base font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-emerald-300 sm:text-lg"
        >
          {reviewMode === 'all' ? 'Ôn chữ khó' : 'Luyện tất cả'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,_#f7fef9,_#dff5e6_55%,_#d7efe0)] text-emerald-950 flex flex-col overflow-hidden font-sans">
      <header className="border-b border-emerald-200/80 bg-emerald-50/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              ← Quay lại
            </button>

            <div className="min-w-0 flex-1 text-center">
              <h1 className="truncate text-xl font-bold text-emerald-800 sm:text-2xl">Tập nhận diện chữ Hán</h1>
            </div>

            <button
              onClick={handleResetProgress}
              className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => selectMode('all')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                reviewMode === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-200'
              }`}
            >
              Luyện tất cả
            </button>
            <button
              onClick={() => selectMode('hard')}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                reviewMode === 'hard'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-200'
              }`}
            >
              Ôn chữ khó
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100">
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Trong vòng</div>
              <div className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{cardsLeft}</div>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100">
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Chữ khó</div>
              <div className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{hardCount}</div>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100">
              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Đã xong</div>
              <div className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{doneCount}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <div className="mx-auto flex h-full max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <section className="min-h-0 w-full overflow-hidden rounded-[28px] border border-emerald-200 bg-white/92 shadow-[0_20px_60px_rgba(16,72,40,0.08)] backdrop-blur">
            <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="text-sm font-semibold text-emerald-700">
                  {reviewMode === 'all' ? 'Tất cả' : 'Chữ khó'}
                </div>
                {currentProgress && (
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {currentProgress.seenCount} lần
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pt-5">
                {renderContent()}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-emerald-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          {renderFooterActions()}
        </div>
      </footer>
    </div>
  );
};

export default CharacterRecognition;
