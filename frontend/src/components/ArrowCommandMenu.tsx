// src/components/Menus/ArrowCommandMenu.tsx
import React from 'react';
import { useProjectStore } from '../state/useProjectStore';

interface ArrowCommandMenuProps {
  connectionId: string;
  onClose: () => void;
}

const ArrowCommandMenu: React.FC<ArrowCommandMenuProps> = ({
  connectionId,
  onClose,
}) => {
  // 🎯 CONNECT TO UNIFORM ACTION: Grab our clean internal-unpacking slice action
  const removeBlockConnectionByKey = useProjectStore(
    (state) => state.removeBlockConnectionByKey,
  );

  const handleDeleteConnection = () => {
    // 🎯 ZERO PARSING HERE: Let the store handle the token string directly!
    removeBlockConnectionByKey(connectionId);
    onClose();
  };

  return (
    <div className="w-56 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl text-slate-200">
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
        Connection Options
      </div>

      {/* Action: Color Customization Placeholder */}
      <button
        onClick={() => {
          /* Future styling logic */
          onClose();
        }}
        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 rounded-md transition-colors text-slate-300"
      >
        Change Line Color...
      </button>

      {/* Action: Delete Connection */}
      <button
        onClick={handleDeleteConnection}
        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
      >
        Delete Connection
      </button>
    </div>
  );
};

export default ArrowCommandMenu;
