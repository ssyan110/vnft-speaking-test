import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    if (isShuffling) return;

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
    <div className="min-h-screen bg-sky-50 text-sky-900 flex flex-col items-center justify-between p-4 sm:p-8 font-sans">
      <header className="w-full max-w-4xl text-center">
        <button
          onClick={onBack}
          className="mb-4 text-sky-600 hover:text-sky-700 font-semibold text-lg flex items-center gap-2"
        >
          ← Quay lại
        </button>
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-700 tracking-tight">VNFT Speaking Test</h1>
        <p className="text-lg text-sky-600 mt-2">Nhấn nút để chọn ngẫu nhiên một câu hỏi</p>
      </header>

      <main className="flex-grow flex items-center justify-center w-full max-w-4xl my-8">
        <QuestionDisplay 
          isShuffling={isShuffling}
          shufflingQuestion={shufflingQuestion}
          selectedQuestion={selectedQuestion}
        />
      </main>

      <footer className="w-full flex justify-center">
        <button
          onClick={startShuffle}
          disabled={isShuffling}
          className="bg-sky-500 text-white font-bold text-2xl py-4 px-12 rounded-lg shadow-lg hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all duration-300 ease-in-out disabled:bg-sky-300 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-100"
        >
          {isShuffling ? 'ĐANG CHỌN...' : 'BẮT ĐẦU'}
        </button>
      </footer>
    </div>
  );
};

export default SpeakingPractice;
