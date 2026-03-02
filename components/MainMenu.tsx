import React from 'react';

interface MainMenuProps {
  onSelectCharacterRecognition: () => void;
  onSelectSpeaking: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectCharacterRecognition, onSelectSpeaking }) => {
  return (
    <div className="min-h-screen bg-sky-50 text-sky-900 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <header className="text-center mb-12">
        <img 
          src="/vnft-logo.webp" 
          alt="VNFT Group Logo" 
          className="w-48 sm:w-64 mx-auto mb-6"
        />
        <h1 className="text-5xl sm:text-6xl font-bold text-sky-700 tracking-tight mb-4">
          Ứng dụng luyện tập
        </h1>
        <p className="text-xl text-sky-600">Chọn chế độ học tập</p>
      </header>

      <main className="flex flex-col gap-6 w-full max-w-md">
        <button
          onClick={onSelectCharacterRecognition}
          className="bg-sky-500 text-white font-bold text-2xl py-6 px-8 rounded-lg shadow-lg hover:bg-sky-600 active:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-100"
        >
          Tập nhận diện chữ Hán
        </button>

        <button
          onClick={onSelectSpeaking}
          className="bg-emerald-500 text-white font-bold text-2xl py-6 px-8 rounded-lg shadow-lg hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-100"
        >
          Tập nói
        </button>
      </main>
    </div>
  );
};

export default MainMenu;
