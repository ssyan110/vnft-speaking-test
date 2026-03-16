import React from 'react';
import { Question } from '../types';

interface QuestionDisplayProps {
  isShuffling: boolean;
  shufflingQuestion: Question | null;
  selectedQuestion: Question | null;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  isShuffling,
  shufflingQuestion,
  selectedQuestion,
}) => {
  const currentQuestion = isShuffling ? shufflingQuestion : selectedQuestion;

  return (
    <div className="h-full min-h-[18rem] rounded-[24px] bg-sky-50/70 border border-sky-100 p-5 sm:min-h-[22rem] sm:p-8">
      <div className="flex h-full flex-col items-center justify-center text-center">
        {!currentQuestion && (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">Ready</p>
            <h2 className="mt-4 text-2xl font-bold text-sky-800 sm:text-3xl">Chúc bạn may mắn</h2>
            <p className="mt-3 max-w-md text-sm text-sky-700 sm:text-base">
              Chọn một câu hỏi bất kỳ để bắt đầu phần luyện nói.
            </p>
          </>
        )}

        {currentQuestion && (
          <div className={`w-full ${isShuffling ? 'animate-pulse' : ''}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">
              {isShuffling ? 'Đang chọn...' : 'Câu hỏi đã chọn'}
            </p>
            <p className="mt-6 text-2xl font-bold text-sky-700 sm:text-3xl lg:text-4xl">
              {currentQuestion.pinyin}
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-sky-900 sm:text-4xl lg:text-5xl">
              {currentQuestion.chinese}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDisplay;
