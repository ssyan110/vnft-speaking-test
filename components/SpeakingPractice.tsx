import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QUESTIONS } from '../constants/questions';
import { Question } from '../types';
import QuestionDisplay from './QuestionDisplay';

const SHUFFLE_DURATION_MS = 1500;
const SHUFFLE_INTERVAL_MS = 75;

interface SpeakingPracticeProps {
  onBack: () => void;
}

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ onBack }) => {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [shufflingQuestion, setShufflingQuestion] = useState<Question | null>(null);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const shuffleIntervalRef = useRef<number | null>(null);
  const shuffleTimeoutRef = useRef<number | null>(null);

  const stopShuffle = useCallback(() => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
    setIsShuffling(false);
  }, []);

  const startShuffle = useCallback(() => {
    if (isShuffling) {
      return;
    }

    setIsShuffling(true);
    setSelectedQuestion(null);

    shuffleIntervalRef.current = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
      setShufflingQuestion(QUESTIONS[randomIndex]);
    }, SHUFFLE_INTERVAL_MS);

    shuffleTimeoutRef.current = window.setTimeout(() => {
      stopShuffle();
      const finalRandomIndex = Math.floor(Math.random() * QUESTIONS.length);
      setSelectedQuestion(QUESTIONS[finalRandomIndex]);
      setShufflingQuestion(null);
    }, SHUFFLE_DURATION_MS);
  }, [isShuffling, stopShuffle]);

  useEffect(() => {
    return () => {
      stopShuffle();
    };
  }, [stopShuffle]);

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,_#f5fbff,_#dfefff_55%,_#d4ebff)] text-sky-950 flex flex-col overflow-hidden font-sans">
      <header className="border-b border-sky-200/80 bg-sky-50/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="shrink-0 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition-colors"
            >
              ← Quay lại
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-sky-800 sm:text-2xl">VNFT Speaking Test</h1>
              <p className="truncate text-xs text-sky-600 sm:text-sm">
                Chọn nhanh một câu hỏi ngẫu nhiên trong một màn hình gọn.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <div className="mx-auto grid h-full max-w-6xl gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-h-0 overflow-hidden rounded-[28px] border border-sky-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(20,80,120,0.08)] backdrop-blur sm:p-6">
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-sky-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">
                  Random speaking prompt
                </p>
                <p className="mt-1 text-sm text-sky-700">
                  Nhấn nút bên dưới để chọn một câu hỏi mới cho phần luyện nói.
                </p>
              </div>

              <div className="min-h-0 flex-1 pt-5">
                <QuestionDisplay
                  isShuffling={isShuffling}
                  shufflingQuestion={shufflingQuestion}
                  selectedQuestion={selectedQuestion}
                />
              </div>
            </div>
          </section>

          <aside className="hidden lg:flex lg:flex-col lg:gap-4">
            <div className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Cách dùng</p>
              <div className="mt-3 space-y-3 text-sm text-sky-800">
                <p>1 câu hỏi cho mỗi lượt luyện.</p>
                <p>Đọc pinyin, rồi nói phần tiếng Trung hoàn chỉnh.</p>
                <p>Nếu chưa vừa ý, bấm lại để lấy câu mới ngay.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Mẹo mobile</p>
              <p className="mt-3 text-sm text-sky-800">
                Nút hành động luôn nằm dưới cùng để không phải cuộn xuống khi dùng điện thoại.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-sky-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={startShuffle}
            disabled={isShuffling}
            className="w-full sm:w-auto bg-sky-500 text-white font-bold text-lg sm:text-xl py-4 px-10 rounded-2xl shadow-lg hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all disabled:bg-sky-300 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isShuffling ? 'ĐANG CHỌN...' : 'CHỌN CÂU HỎI'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SpeakingPractice;
