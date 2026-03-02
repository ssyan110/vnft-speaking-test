import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CHINESE_CHARACTERS } from '../constants/characters';
import { ChineseCharacter } from '../types';

const SHUFFLE_DURATION_MS = 1500;
const SHUFFLE_INTERVAL_MS = 75;
const DISPLAY_DURATION_MS = 3000;

interface CharacterRecognitionProps {
  onBack: () => void;
}

const CharacterRecognition: React.FC<CharacterRecognitionProps> = ({ onBack }) => {
  const [selectedCharacter, setSelectedCharacter] = useState<ChineseCharacter | null>(null);
  const [shufflingCharacter, setShufflingCharacter] = useState<ChineseCharacter | null>(null);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [canShowAnswerButton, setCanShowAnswerButton] = useState<boolean>(false);
  const [remainingCharacters, setRemainingCharacters] = useState<ChineseCharacter[]>([...CHINESE_CHARACTERS]);
  const shuffleIntervalRef = useRef<number | null>(null);
  const shuffleTimeoutRef = useRef<number | null>(null);
  const displayTimeoutRef = useRef<number | null>(null);

  const stopShuffle = useCallback(() => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }
    setIsShuffling(false);
  }, []);

  const startShuffle = useCallback(() => {
    if (isShuffling) return;

    // Clear any existing display timeout
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
      displayTimeoutRef.current = null;
    }

    setIsShuffling(true);
    setSelectedCharacter(null);
    setShowAnswer(false);
    setCanShowAnswerButton(false);

    // Use current remaining characters for shuffling animation
    const charactersToUse = remainingCharacters.length > 0 ? remainingCharacters : CHINESE_CHARACTERS;

    shuffleIntervalRef.current = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * charactersToUse.length);
      setShufflingCharacter(charactersToUse[randomIndex]);
    }, SHUFFLE_INTERVAL_MS);

    shuffleTimeoutRef.current = window.setTimeout(() => {
      stopShuffle();
      
      // If no remaining characters, reset the session
      const availableCharacters = remainingCharacters.length > 0 ? remainingCharacters : [...CHINESE_CHARACTERS];
      
      const finalRandomIndex = Math.floor(Math.random() * availableCharacters.length);
      const finalCharacter = availableCharacters[finalRandomIndex];
      
      // Remove the selected character from remaining characters
      const updatedRemaining = availableCharacters.filter((_, index) => index !== finalRandomIndex);
      setRemainingCharacters(updatedRemaining);
      
      setSelectedCharacter(finalCharacter);
      setShufflingCharacter(null);
      setIsShuffling(false);

      // After 3 seconds, show the "Xem đáp án" button
      displayTimeoutRef.current = window.setTimeout(() => {
        setCanShowAnswerButton(true);
      }, DISPLAY_DURATION_MS);
    }, SHUFFLE_DURATION_MS);
  }, [isShuffling, stopShuffle, remainingCharacters]);
  
  useEffect(() => {
    return () => {
      stopShuffle();
    };
  }, [stopShuffle]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 flex flex-col items-center justify-between p-4 sm:p-8 font-sans">
      <header className="w-full max-w-4xl text-center">
        <button
          onClick={onBack}
          className="mb-4 text-emerald-600 hover:text-emerald-700 font-semibold text-lg flex items-center gap-2"
        >
          ← Quay lại
        </button>
        <h1 className="text-4xl sm:text-5xl font-bold text-emerald-700 tracking-tight">
          Tập nhận diện chữ Hán
        </h1>
        <p className="text-lg text-emerald-600 mt-2">Nhấn nút để bắt đầu luyện tập</p>
        <div className="mt-4 text-emerald-700 font-semibold">
          {remainingCharacters.length === 0 ? (
            <p className="text-emerald-600">🎉 Phiên mới bắt đầu!</p>
          ) : (
            <p>Còn lại: {remainingCharacters.length}/{CHINESE_CHARACTERS.length} chữ</p>
          )}
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center w-full max-w-4xl my-8">
        {(isShuffling || selectedCharacter) ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 w-full max-w-2xl border-4 border-emerald-200">
            {isShuffling && shufflingCharacter && (
              <div className="text-center">
                <div className="text-9xl font-bold text-emerald-600 mb-4 animate-pulse">
                  {shufflingCharacter.character}
                </div>
              </div>
            )}

            {!isShuffling && selectedCharacter && (
              <div className="text-center">
                <div className="text-9xl font-bold text-emerald-700 mb-6">
                  {selectedCharacter.character}
                </div>

                {showAnswer && (
                  <div className="mt-8 text-left bg-emerald-50 p-6 rounded-lg space-y-3">
                    <div className="text-2xl">
                      <span className="font-bold text-emerald-800">Pinyin:</span>{' '}
                      <span className="text-emerald-900">{selectedCharacter.pinyin}</span>
                    </div>
                    <div className="text-xl">
                      <span className="font-semibold text-emerald-700">(Hán Việt: {selectedCharacter.hanViet})</span>
                    </div>
                    <div className="text-xl">
                      <span className="font-bold text-emerald-800">Nghĩa:</span>{' '}
                      <span className="text-emerald-900">{selectedCharacter.meaning}</span>
                    </div>
                    <div className="text-lg">
                      <span className="font-bold text-emerald-800">Bộ thủ:</span>{' '}
                      <span className="text-emerald-900">{selectedCharacter.radical}</span>
                    </div>
                    <div className="text-lg">
                      <span className="font-bold text-emerald-800">Loại chữ:</span>{' '}
                      <span className="text-emerald-900">{selectedCharacter.characterType}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-2xl text-emerald-600 font-semibold">
            Nhấn nút bên dưới để bắt đầu
          </div>
        )}
      </main>

      <footer className="w-full flex justify-center gap-4">
        <button
          onClick={startShuffle}
          disabled={isShuffling}
          className="bg-emerald-500 text-white font-bold text-2xl py-4 px-12 rounded-lg shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out disabled:bg-emerald-300 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-100"
        >
          {isShuffling ? 'ĐANG CHỌN...' : 'Nhấn để tập'}
        </button>

        {canShowAnswerButton && !showAnswer && (
          <button
            onClick={handleShowAnswer}
            className="bg-amber-500 text-white font-bold text-2xl py-4 px-12 rounded-lg shadow-lg hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-100"
          >
            Xem đáp án
          </button>
        )}
      </footer>
    </div>
  );
};

export default CharacterRecognition;
