import type { BlockType } from '../state/useCanvasStore';
import useCanvasStore from '../state/useCanvasStore';
import useModalStore from '../state/useModalStore';

interface CommandItem {
  label: string;
  labelStyle: string;
  type: BlockType; // 👈 Enforce your store's strict BlockType here
}

const BlockCommandMenu: React.FC = () => {
  const { activeBlockId, deleteBlock, updateBlockType } = useCanvasStore(
    (state) => state,
  );
  const { closeMenu } = useModalStore((state) => state);

  const commands: CommandItem[] = [
    { label: 'Heading 1', labelStyle: 'font-bold', type: 'h1' },
    { label: 'Heading 2', labelStyle: 'font-semibold', type: 'h2' },
    { label: 'Heading 3', labelStyle: 'font-medium', type: 'h3' },
    { label: 'Paragraph', labelStyle: '', type: 'p' },
    {
      label: 'Code Block',
      labelStyle: 'text-emerald-400',
      type: 'code',
    },
    {
      label: 'Image Block',
      labelStyle: 'text-indigo-400 font-medium',
      type: 'image',
    },
  ];

  const handleCommandSelect = (type: BlockType) => {
    updateBlockType(activeBlockId, type);
    closeMenu();
  };

  const handleDeleteSelect = () => {
    if (activeBlockId) {
      deleteBlock(activeBlockId);
    }
    closeMenu();
  };

  return (
    <>
      {commands.map((command) => (
        <button
          className={`text-left p-1.5 hover:bg-slate-700 rounded text-sm ${command.labelStyle}`}
          key={command.type}
          onClick={() => handleCommandSelect(command.type)}
        >
          {command.label}
        </button>
      ))}
      <button
        className="border-t border-t-slate-500 text-left p-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded text-sm font-medium transition-colors"
        onClick={handleDeleteSelect}
      >
        🗑️ Delete block
      </button>
    </>
  );
};

export default BlockCommandMenu;
