import React, { useRef } from 'react';
import { downloadExport, importUserData } from '../utils/dataExport';

interface DataManagerProps {
  onImportSuccess: () => void;
}

const DataManager: React.FC<DataManagerProps> = ({ onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadExport();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ok = importUserData(text);
      if (ok) {
        alert('Nhập dữ liệu thành công! Trang sẽ tải lại.');
        onImportSuccess();
        window.location.reload();
      } else {
        alert('File không hợp lệ.');
      }
    };
    reader.readAsText(file);

    // Reset so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
      >
        📤 Xuất dữ liệu
      </button>
      <button
        onClick={handleImportClick}
        className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
      >
        📥 Nhập dữ liệu
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default DataManager;
