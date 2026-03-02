
import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import SpeakingPractice from './components/SpeakingPractice';
import CharacterRecognition from './components/CharacterRecognition';

type AppMode = 'menu' | 'speaking' | 'character';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('menu');

  const handleSelectCharacterRecognition = () => {
    setMode('character');
  };

  const handleSelectSpeaking = () => {
    setMode('speaking');
  };

  const handleBackToMenu = () => {
    setMode('menu');
  };

  return (
    <>
      {mode === 'menu' && (
        <MainMenu
          onSelectCharacterRecognition={handleSelectCharacterRecognition}
          onSelectSpeaking={handleSelectSpeaking}
        />
      )}
      {mode === 'speaking' && <SpeakingPractice onBack={handleBackToMenu} />}
      {mode === 'character' && <CharacterRecognition onBack={handleBackToMenu} />}
    </>
  );
};

export default App;
