import React, { useRef } from 'react';

interface ImageControlsProps {
  onRemove: () => void;
  onSwap: (file: File) => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({
  onRemove,
  onSwap,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSwap(file);
      e.target.value = ''; // Reset input element
    }
  };

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out z-30">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 🔄 Swap Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-indigo-400 backdrop-blur-sm rounded-md border border-slate-700/50 transition-all cursor-pointer shadow-sm flex items-center gap-1"
      >
        <span>🔄</span> Swap
      </button>

      {/* 🗑️ Refactored Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-950/40 backdrop-blur-sm rounded-md border border-slate-700/50 hover:border-rose-900/50 transition-all cursor-pointer shadow-sm flex items-center gap-1"
      >
        <span>🗑️</span> Remove
      </button>
    </div>
  );
};
