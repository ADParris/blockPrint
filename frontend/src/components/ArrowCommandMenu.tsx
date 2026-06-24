interface ArrowCommandMenuProps {
  connectionId: string;
  onClose: () => void;
}

const ArrowCommandMenu: React.FC<ArrowCommandMenuProps> = ({
  connectionId,
  onClose,
}) => {
  return (
    <div className="w-56 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl text-slate-200">
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
        Connection Options
      </div>

      {/* Action: Delete Connection */}
      <button
        onClick={() => {
          // Assuming your Zustand store has a matching delete method
          // removeBlockConnection(activeMenuConnection.sourceId, activeMenuConnection.targetId);
          console.log(`Delete connection with ID: ${connectionId}`);
          onClose();
        }}
        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
      >
        Delete Connection
      </button>

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
    </div>
  );
};

export default ArrowCommandMenu;
