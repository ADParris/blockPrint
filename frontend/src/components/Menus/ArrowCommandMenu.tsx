// src/components/Menus/ArrowCommandMenu.tsx
import React from 'react';
import type { BlockConnectionColor } from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';

interface ArrowCommandMenuProps {
  projectId: string | undefined; // 🎯 Added project context prop
  pageId: string | undefined; // 🎯 Added page context prop
  connectionId: string;
  onClose: () => void;
}

const ArrowCommandMenu: React.FC<ArrowCommandMenuProps> = ({
  projectId,
  pageId,
  connectionId,
  onClose,
}) => {
  // 🎯 CONNECT TO UNIFORM ACTION: Grab our clean internal-unpacking slice action
  const removeBlockConnectionByKey = useProjectStore(
    (state) => state.removeBlockConnectionByKey,
  );
  const updateBlockConnectionColor = useProjectStore(
    (state) => state.updateBlockConnectionColor,
  );

  const colors = [
    {
      id: 'blue',
      label: 'Default Blue',
      textClass: 'text-blue-400',
      bgHover: 'hover:bg-blue-500/10',
    },
    {
      id: 'emerald',
      label: 'Green (Success)',
      textClass: 'text-emerald-400',
      bgHover: 'hover:bg-emerald-500/10',
    },
    {
      id: 'rose',
      label: 'Red (Error)',
      textClass: 'text-rose-400',
      bgHover: 'hover:bg-rose-500/10',
    },
    {
      id: 'amber',
      label: 'Yellow (Warning)',
      textClass: 'text-amber-400',
      bgHover: 'hover:bg-amber-500/10',
    },
  ] as const;

  const handleColorChange = (colorId: BlockConnectionColor) => {
    // 🎯 Pass explicit routing keys to fulfill the new slice method signature
    updateBlockConnectionColor(projectId, pageId, connectionId, colorId);
    onClose();
  };

  const handleDeleteConnection = () => {
    // 🎯 Pass explicit routing keys to fulfill the new slice method signature
    removeBlockConnectionByKey(projectId, pageId, connectionId);
    onClose();
  };

  return (
    <div className="w-48 bg-slate-950 border border-slate-800 rounded-lg shadow-xl py-1 flex flex-col text-xs text-slate-300">
      {/* Heading Section */}
      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
        Line Color
      </div>

      {/* Color Palette List */}
      {colors.map((color) => (
        <button
          key={color.id}
          onClick={() => handleColorChange(color.id)}
          className={`flex items-center gap-2 px-2.5 py-1.5 text-left w-full transition-colors duration-150 ${color.bgHover}`}
        >
          <span
            className={`h-2 w-2 rounded-full bg-current ${color.textClass}`}
          />
          <span>{color.label}</span>
        </button>
      ))}

      {/* Faint Horizontal Line Separator */}
      <div className="h-px bg-slate-800/60 my-1 mx-1" />

      {/* Danger / Action Row */}
      <button
        onClick={handleDeleteConnection}
        className="flex items-center gap-2 px-2.5 py-1.5 text-left w-full text-rose-400 hover:bg-rose-500/10 transition-colors duration-150"
      >
        <span>Delete Connection</span>
      </button>
    </div>
  );
};

export default ArrowCommandMenu;
