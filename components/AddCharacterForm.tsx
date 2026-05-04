import React, { useState } from 'react';
import type { ChineseCharacter } from '../types';
import type { RawCustomCharacter } from '../utils/customCharacters';

interface AddCharacterFormProps {
  allCharacters: ChineseCharacter[];
  onAdd: (char: RawCustomCharacter) => void;
  onClose: () => void;
}

const AddCharacterForm: React.FC<AddCharacterFormProps> = ({ allCharacters, onAdd, onClose }) => {
  const [character, setCharacter] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [hanViet, setHanViet] = useState('');
  const [meaning, setMeaning] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = character.trim();
    if (!trimmed) { setError('Nhập chữ Hán'); return; }
    if (!pinyin.trim()) { setError('Nhập pinyin'); return; }
    if (!meaning.trim()) { setError('Nhập nghĩa'); return; }

    if (allCharacters.some((c) => c.character === trimmed)) {
      setError(`"${trimmed}" đã có trong danh sách`);
      return;
    }

    onAdd({
      character: trimmed,
      pinyin: pinyin.trim(),
      hanViet: hanViet.trim() || '',
      meaning: meaning.trim(),
    });

    setCharacter('');
    setPinyin('');
    setHanViet('');
    setMeaning('');
    setError('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-emerald-900">Thêm chữ mới</div>
        <button onClick={onClose} className="text-sm text-emerald-600 hover:text-emerald-800">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={character}
          onChange={(e) => { setCharacter(e.target.value); setError(''); }}
          placeholder="Chữ Hán (例: 学)"
          className="rounded-xl border border-emerald-200 px-3 py-2 text-lg text-center focus:border-emerald-400 focus:outline-none"
          maxLength={2}
        />
        <input
          value={pinyin}
          onChange={(e) => setPinyin(e.target.value)}
          placeholder="Pinyin (例: xué)"
          className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
        <input
          value={hanViet}
          onChange={(e) => setHanViet(e.target.value)}
          placeholder="Hán Việt (tùy chọn)"
          className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
        <input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Nghĩa (例: học)"
          className="rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
        />
      </div>

      {error && <div className="text-xs text-red-500 text-center">{error}</div>}

      <button
        onClick={handleSubmit}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
      >
        Thêm
      </button>
    </div>
  );
};

export default AddCharacterForm;
