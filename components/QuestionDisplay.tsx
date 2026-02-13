
import React from 'react';
import { Question } from '../types';

interface QuestionDisplayProps {
  isShuffling: boolean;
  shufflingQuestion: Question | null;
  selectedQuestion: Question | null;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ isShuffling, shufflingQuestion, selectedQuestion }) => {
  const renderContent = () => {
    if (isShuffling && shufflingQuestion) {
      return (
        <div className="text-center animate-pulse">
          <p className="text-xl sm:text-2xl text-sky-600 mb-4">{shufflingQuestion.pinyin}</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-sky-800">{shufflingQuestion.chinese}</h2>
        </div>
      );
    }

    if (selectedQuestion) {
      return (
        <div className="text-center animate-fade-in">
          <p className="text-xl sm:text-2xl text-sky-600 mb-4">{selectedQuestion.pinyin}</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-sky-800">{selectedQuestion.chinese}</h2>
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-medium text-sky-500">Chúc bạn may mắn!</h2>
      </div>
    );
  };
  
  return (
    <div className="w-full h-64 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 p-6 overflow-hidden">
      {renderContent()}
    </div>
  );
};

// Add keyframes for a simple fade-in animation to tailwind config if possible, or define here if not.
// For this self-contained example, we'll rely on browser defaults or assume a tailwind.config.js might add it.
// A simple way to get a similar effect without config is with CSS. Let's add a style tag in index.html for it.
// Or, even better, let's use tailwind classes that don't need config.
// The component structure will be simplified and animations will be handled via standard Tailwind classes.

const AnimatedQuestion: React.FC<{ question: Question }> = ({ question }) => (
    <div className="text-center transition-opacity duration-100 ease-in-out">
        <p className="text-xl sm:text-2xl text-sky-600 mb-4">{question.pinyin}</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-sky-800">{question.chinese}</h2>
    </div>
);

const FinalQuestion: React.FC<{ question: Question }> = ({ question }) => (
     <div className="text-center">
        <p className="text-xl sm:text-2xl text-sky-600 mb-4">{question.pinyin}</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-sky-800">{question.chinese}</h2>
    </div>
);


const QuestionDisplayWithKey: React.FC<QuestionDisplayProps> = ({ isShuffling, shufflingQuestion, selectedQuestion }) => {
    return (
        <div className="relative w-full h-64 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-sky-200 p-6 overflow-hidden">
            <div className="transition-all duration-200 ease-in-out">
                {isShuffling && shufflingQuestion && <AnimatedQuestion key={shufflingQuestion.pinyin} question={shufflingQuestion} />}
                
                {selectedQuestion && !isShuffling && <FinalQuestion key="final" question={selectedQuestion} />}

                {!isShuffling && !selectedQuestion && (
                    <div className="text-center">
                        <h2 className="text-2xl sm:text-3xl font-medium text-sky-500">Chúc bạn may mắn!</h2>
                    </div>
                )}
            </div>
        </div>
    );
};


export default QuestionDisplayWithKey;
