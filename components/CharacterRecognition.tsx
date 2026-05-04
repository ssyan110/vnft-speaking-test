import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CHINESE_CHARACTERS, CHARS_PER_LESSON } from '../constants/characters';
import { CharacterProgress, ChineseCharacter, PracticeRating, PracticeSessionStats } from '../types';
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  createProgressRecord,
  loadStoredState,
  applyRating,
} from '../utils/progressStore';
import type { ProgressMap } from '../utils/progressStore';
import { buildWeightedRound } from '../utils/selectionEngine';
import { loadLessonSelection, clearLessonSelection } from '../utils/lessonStorage';
import { getAvailableLessons } from '../constants/lessonData';
import { loadCustomCharacters, addCustomCharacter, clearCustomCharacters } from '../utils/customCharacters';
import type { RawCustomCharacter } from '../utils/customCharacters';
import LessonSelector from './LessonSelector';
import ProgressMapView from './ProgressMapView';
import AddCharacterForm from './AddCharacterForm';
import DataManager from './DataManager';

const ROUND_SIZE = 10;

type PracticeState = 'idle' | 'prompt' | 'answer' | 'round_complete' | 'all_done';
type ReviewMode = 'all' | 'hard';

interface CharacterRecognitionProps {
  onBack: () => void;
}

const createInitialStats = (): PracticeSessionStats => ({ reviewed: 0, hard: 0, easy: 0 });

/** Merge base characters with custom ones, auto-assigning lessons to custom chars */
function buildAllCharacters(customs: RawCustomCharacter[]): ChineseCharacter[] {
  if (customs.length === 0) return CHINESE_CHARACTERS;
  const baseCount = CHINESE_CHARACTERS.length;
  const customWithLesson = customs.map((c, i) => ({
    ...c,
    lesson: Math.floor((baseCount + i) / CHARS_PER_LESSON) + 1,
  }));
  return [...CHINESE_CHARACTERS, ...customWithLesson];
}

const CharacterRecognition: React.FC<CharacterRecognitionProps> = ({ onBack }) => {
  const storedState = loadStoredState();
  const [practiceState, setPracticeState] = useState<PracticeState>('idle');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('all');
  const [roundQueue, setRoundQueue] = useState<ChineseCharacter[]>([]);
  const [progressMap, setProgressMap] = useState<ProgressMap>(storedState.progressMap);
  const [currentCycle, setCurrentCycle] = useState<number>(storedState.currentCycle);
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats>(createInitialStats());
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [showProgressMap, setShowProgressMap] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sessionReviewed, setSessionReviewed] = useState<Set<string>>(new Set());
  const [customChars, setCustomChars] = useState<RawCustomCharacter[]>(() => loadCustomCharacters());

  // Merged character list (base + custom)
  const allCharacters = useMemo(() => buildAllCharacters(customChars), [customChars]);

  const [selectedLessons, setSelectedLessons] = useState<number[]>(() => {
    const stored = loadLessonSelection();
    return stored ?? getAvailableLessons(allCharacters);
  });

  const maxLesson = useMemo(() => Math.max(...allCharacters.map((c) => c.lesson)), [allCharacters]);

  const getHardChars = useCallback(
    () => allCharacters.filter(({ character }) => progressMap[character]?.isHard),
    [allCharacters, progressMap],
  );

  const getUnreviewed = useCallback(
    (lessons: number[], reviewed: Set<string>) => {
      const lessonSet = new Set(lessons);
      return allCharacters.filter((c) => lessonSet.has(c.lesson) && !reviewed.has(c.character));
    },
    [allCharacters],
  );

  const unreviewedCount = useMemo(
    () => getUnreviewed(selectedLessons, sessionReviewed).length,
    [getUnreviewed, selectedLessons, sessionReviewed],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasProgress = Object.keys(progressMap).length > 0 || currentCycle > 0;
    if (!hasProgress) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentCycle, progressMap }));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, [currentCycle, progressMap]);

  const currentCard = roundQueue[0] ?? null;
  const currentProgress = currentCard
    ? progressMap[currentCard.character] ?? createProgressRecord(currentCard.character)
    : null;
  const hardCharacters = getHardChars();
  const hardCount = hardCharacters.length;
  const cardsLeft = practiceState === 'round_complete' || practiceState === 'all_done' ? 0 : roundQueue.length;

  const resetRound = () => { setRoundQueue([]); setSessionStats(createInitialStats()); setShowExtraInfo(false); };

  const startRound = (mode = reviewMode) => {
    if (mode === 'hard') {
      const shuffled = [...getHardChars()].sort(() => Math.random() - 0.5).slice(0, ROUND_SIZE);
      resetRound(); setReviewMode(mode); setRoundQueue(shuffled);
      setPracticeState(shuffled.length > 0 ? 'prompt' : 'round_complete');
      return;
    }
    const unreviewed = getUnreviewed(selectedLessons, sessionReviewed);
    if (unreviewed.length === 0) { resetRound(); setReviewMode(mode); setPracticeState('all_done'); return; }
    const nextQueue = buildWeightedRound(unreviewed, progressMap, selectedLessons, Date.now(), Math.min(ROUND_SIZE, unreviewed.length));
    resetRound(); setReviewMode(mode); setRoundQueue(nextQueue);
    setPracticeState(nextQueue.length > 0 ? 'prompt' : 'all_done');
  };

  const selectMode = (mode: ReviewMode) => { if (mode === reviewMode) return; setReviewMode(mode); resetRound(); setPracticeState('idle'); };
  const handleShowAnswer = () => { if (practiceState === 'prompt') { setShowExtraInfo(false); setPracticeState('answer'); } };

  const handleRateCard = (rating: PracticeRating) => {
    if (!currentCard || practiceState !== 'answer') return;
    const reviewedAt = Date.now();
    const cardProgress = progressMap[currentCard.character] ?? createProgressRecord(currentCard.character);
    const completedCycle = reviewMode === 'all' ? currentCycle : cardProgress.completedCycle;
    const updated: CharacterProgress = { ...applyRating(cardProgress, rating, reviewedAt), completedCycle };
    setProgressMap((prev) => ({ ...prev, [currentCard.character]: updated }));
    setSessionStats((prev) => ({ reviewed: prev.reviewed + 1, hard: prev.hard + (rating === 'hard' ? 1 : 0), easy: prev.easy + (rating === 'easy' ? 1 : 0) }));
    setSessionReviewed((prev) => new Set(prev).add(currentCard.character));
    const nextQueue = roundQueue.slice(1);
    setRoundQueue(nextQueue); setShowExtraInfo(false);
    if (nextQueue.length > 0) { setPracticeState('prompt'); }
    else {
      const updatedReviewed = new Set(sessionReviewed); updatedReviewed.add(currentCard.character);
      setPracticeState(getUnreviewed(selectedLessons, updatedReviewed).length > 0 ? 'round_complete' : 'all_done');
    }
  };

  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
      if (!window.confirm('Xóa toàn bộ tiến độ?')) return;
      window.localStorage.removeItem(STORAGE_KEY); window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      clearLessonSelection(); clearCustomCharacters();
    }
    setProgressMap({}); setCurrentCycle(0); setCustomChars([]);
    setSelectedLessons(getAvailableLessons(CHINESE_CHARACTERS));
    setSessionReviewed(new Set()); resetRound(); setPracticeState('idle'); setReviewMode('all');
  };

  const handleBackToLessons = () => { setSessionReviewed(new Set()); resetRound(); setPracticeState('idle'); };
  const handleRedoLessons = () => { setSessionReviewed(new Set()); resetRound(); startRound('all'); };

  const handleAddChar = (raw: RawCustomCharacter) => {
    const ok = addCustomCharacter(raw, allCharacters);
    if (ok) setCustomChars(loadCustomCharacters());
  };

  // ─── Render helpers ───

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
              {hardCharacters.map((c) => (
                <div key={c.character} className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700">{c.character}</div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-4">
        {showProgressMap ? (
          <>
            <button onClick={() => setShowProgressMap(false)} className="self-start rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">Đóng</button>
            <ProgressMapView characters={allCharacters} progressMap={progressMap} maxLesson={maxLesson} />
          </>
        ) : showAddForm ? (
          <AddCharacterForm allCharacters={allCharacters} onAdd={handleAddChar} onClose={() => setShowAddForm(false)} />
        ) : (
          <>
            <LessonSelector characters={allCharacters} selectedLessons={selectedLessons} onSelectionChange={setSelectedLessons} />
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setShowAddForm(true)} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">➕ Thêm chữ</button>
              <button onClick={() => setShowProgressMap(true)} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">📊 Tiến trình</button>
            </div>
            <DataManager onImportSuccess={() => {}} />
          </>
        )}
      </div>
    );
  };

  const renderPrompt = () => {
    if (!currentCard) return null;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <div className="text-[6rem] font-bold leading-none text-emerald-700 sm:text-[8rem] lg:text-[10rem]">{currentCard.character}</div>
        <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Nói pinyin + nghĩa</div>
      </div>
    );
  };

  const renderAnswer = () => {
    if (!currentCard) return null;
    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-5xl font-bold text-emerald-700 sm:text-6xl">{currentCard.character}</div>
          <button onClick={() => setShowExtraInfo((p) => !p)} className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">{showExtraInfo ? 'Ẩn' : 'Xem thêm'}</button>
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
          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Hán Việt</div>
            <div className="mt-1 font-semibold text-emerald-900">{currentCard.hanViet}</div>
          </div>
        )}
      </div>
    );
  };

  const renderRoundComplete = () => (
    <div className="flex h-full flex-col gap-5">
      <div className="text-center">
        <div className="text-3xl font-bold text-emerald-900">Xong vòng!</div>
        <div className="mt-2 text-sm text-emerald-600">Còn {unreviewedCount} chữ chưa ôn</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4 text-center"><div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Đã xem</div><div className="mt-2 text-2xl font-bold text-emerald-800">{sessionStats.reviewed}</div></div>
        <div className="rounded-2xl bg-amber-50 p-4 text-center"><div className="text-xs uppercase tracking-[0.18em] text-amber-500">Khó</div><div className="mt-2 text-2xl font-bold text-amber-700">{sessionStats.hard}</div></div>
        <div className="rounded-2xl bg-emerald-100 p-4 text-center"><div className="text-xs uppercase tracking-[0.18em] text-emerald-600">Dễ</div><div className="mt-2 text-2xl font-bold text-emerald-700">{sessionStats.easy}</div></div>
      </div>
      {hardCount > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-800">Chữ khó</div>
          <div className="flex flex-wrap gap-2">{hardCharacters.slice(0, 8).map((c) => (<div key={c.character} className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700">{c.character}</div>))}</div>
        </div>
      )}
    </div>
  );

  const renderAllDone = () => (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="text-5xl">🎉</div>
      <div>
        <div className="text-2xl font-bold text-emerald-900">Đã ôn hết!</div>
        <div className="mt-2 text-sm text-emerald-600">Bạn đã luyện xong {sessionStats.reviewed} chữ trong các bài đã chọn</div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="rounded-2xl bg-emerald-50 p-3 text-center"><div className="text-xs uppercase tracking-[0.18em] text-emerald-500">Đã xem</div><div className="mt-1 text-xl font-bold text-emerald-800">{sessionStats.reviewed}</div></div>
        <div className="rounded-2xl bg-amber-50 p-3 text-center"><div className="text-xs uppercase tracking-[0.18em] text-amber-500">Khó</div><div className="mt-1 text-xl font-bold text-amber-700">{sessionStats.hard}</div></div>
        <div className="rounded-2xl bg-emerald-100 p-3 text-center"><div className="text-xs uppercase tracking-[0.18em] text-emerald-600">Dễ</div><div className="mt-1 text-xl font-bold text-emerald-700">{sessionStats.easy}</div></div>
      </div>
      {hardCount > 0 && (
        <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="mb-2 text-sm font-semibold text-emerald-800">Chữ khó ({hardCount})</div>
          <div className="flex flex-wrap gap-2">{hardCharacters.slice(0, 12).map((c) => (<div key={c.character} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700">{c.character}</div>))}</div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (practiceState === 'idle') return renderIdle();
    if (practiceState === 'prompt') return renderPrompt();
    if (practiceState === 'answer') return renderAnswer();
    if (practiceState === 'all_done') return renderAllDone();
    return renderRoundComplete();
  };

  const renderFooterActions = () => {
    if (practiceState === 'idle') return (
      <button onClick={() => startRound(reviewMode)} disabled={(reviewMode === 'hard' && hardCount === 0) || (reviewMode === 'all' && selectedLessons.length === 0)} className="w-full sm:w-auto rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300">Bắt đầu</button>
    );
    if (practiceState === 'prompt') return (
      <button onClick={handleShowAnswer} className="w-full sm:w-auto rounded-2xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-amber-600">Xem đáp án</button>
    );
    if (practiceState === 'answer') return (
      <div className="grid w-full gap-2 sm:grid-cols-2">
        <button onClick={() => handleRateCard('hard')} className="rounded-2xl bg-amber-500 px-5 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-amber-600 sm:text-lg">Từ này khó</button>
        <button onClick={() => handleRateCard('easy')} className="rounded-2xl bg-emerald-500 px-5 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 sm:text-lg">Từ này dễ</button>
      </div>
    );
    if (practiceState === 'all_done') return (
      <div className="grid w-full gap-2 sm:grid-cols-2">
        <button onClick={handleBackToLessons} className="rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 sm:text-lg">Chọn bài khác</button>
        <button onClick={handleRedoLessons} className="rounded-2xl border border-emerald-200 bg-white px-8 py-4 text-base font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 sm:text-lg">Luyện lại</button>
      </div>
    );
    return (
      <div className="grid w-full gap-2 sm:grid-cols-2">
        <button onClick={() => startRound(reviewMode)} className="rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-emerald-600 sm:text-lg">Vòng tiếp ({unreviewedCount} chữ)</button>
        <button onClick={handleBackToLessons} className="rounded-2xl border border-emerald-200 bg-white px-8 py-4 text-base font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 sm:text-lg">Về chọn bài</button>
      </div>
    );
  };

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,_#f7fef9,_#dff5e6_55%,_#d7efe0)] text-emerald-950 flex flex-col overflow-hidden font-sans">
      <header className="border-b border-emerald-200/80 bg-emerald-50/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <button onClick={onBack} className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">← Quay lại</button>
            <div className="min-w-0 flex-1 text-center"><h1 className="truncate text-xl font-bold text-emerald-800 sm:text-2xl">Tập nhận diện chữ Hán</h1></div>
            <button onClick={handleResetProgress} className="shrink-0 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">Reset</button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => selectMode('all')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${reviewMode === 'all' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>Luyện tất cả</button>
            <button onClick={() => selectMode('hard')} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${reviewMode === 'hard' ? 'bg-amber-500 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}>Ôn chữ khó</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100"><div className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Trong vòng</div><div className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{cardsLeft}</div></div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100"><div className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Chữ khó</div><div className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{hardCount}</div></div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-emerald-100"><div className="text-[10px] uppercase tracking-[0.18em] text-emerald-500 sm:text-xs">Đã ôn</div><div className="mt-1 text-lg font-bold text-emerald-800 sm:text-2xl">{sessionReviewed.size}</div></div>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <div className="mx-auto flex h-full max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <section className="min-h-0 w-full overflow-hidden rounded-[28px] border border-emerald-200 bg-white/92 shadow-[0_20px_60px_rgba(16,72,40,0.08)] backdrop-blur">
            <div className="flex h-full min-h-0 flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="text-sm font-semibold text-emerald-700">{reviewMode === 'all' ? 'Tất cả' : 'Chữ khó'}</div>
                {currentProgress && (<div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{currentProgress.seenCount} lần</div>)}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pt-5">{renderContent()}</div>
            </div>
          </section>
        </div>
      </main>
      <footer className="border-t border-emerald-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 sm:py-4">{renderFooterActions()}</div>
      </footer>
    </div>
  );
};

export default CharacterRecognition;
