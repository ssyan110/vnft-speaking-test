import React from 'react';

interface MainMenuProps {
  onSelectCharacterRecognition: () => void;
  onSelectSpeaking: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectCharacterRecognition, onSelectSpeaking }) => {
  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,_#f4fbff,_#dbeefe_50%,_#d2f0ea)] text-sky-950 px-4 py-6 sm:px-6 sm:py-8 font-sans">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-5xl flex-col justify-center">
        <header className="text-center">
          <img
            src="/vnft-logo.webp"
            alt="VNFT Group Logo"
            className="mx-auto mb-6 w-28 sm:w-40 lg:w-48"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">VNFT Practice</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-sky-800 sm:text-5xl lg:text-6xl">
            Ứng dụng luyện tập
          </h1>
        </header>

        <main className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
          <button
            onClick={onSelectCharacterRecognition}
            className="group rounded-[28px] bg-white/90 p-6 text-left shadow-[0_20px_50px_rgba(20,80,120,0.12)] ring-1 ring-sky-100 transition-all hover:-translate-y-1 hover:bg-white"
          >
            <h2 className="mt-3 text-2xl font-bold text-sky-900 sm:text-3xl">Tập nhận diện chữ Hán</h2>
            <div className="mt-6 flex items-center justify-end text-sm font-semibold text-sky-700">
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>

          <button
            onClick={onSelectSpeaking}
            className="group rounded-[28px] bg-sky-900 p-6 text-left shadow-[0_20px_50px_rgba(14,54,92,0.2)] transition-all hover:-translate-y-1 hover:bg-sky-800"
          >
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Tập nói</h2>
            <div className="mt-6 flex items-center justify-end text-sm font-semibold text-sky-100">
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </button>
        </main>
      </div>
    </div>
  );
};

export default MainMenu;
