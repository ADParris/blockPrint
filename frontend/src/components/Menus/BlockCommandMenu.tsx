import type { BlockType } from '../../state/types';
import { useModalStore } from '../../state/useModalStore';
import { useProjectStore } from '../../state/useProjectStore';

interface CommandItem {
  label: string;
  labelStyle: string;
  type: BlockType;
}

const BlockCommandMenu: React.FC = () => {
  const { activeBlockId, deleteBlock, updateBlockType } = useProjectStore(
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
    if (activeBlockId) {
      updateBlockType(activeBlockId, type);
    }

    closeMenu();
  };

  const handleDeleteSelect = () => {
    if (activeBlockId) {
      deleteBlock(activeBlockId);
    }
    closeMenu();
  };

  return (
    <div className="flex flex-col min-w-42.5 bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-xl select-none">
      {commands.map((command) => (
        <div
          key={command.type}
          onClick={() => handleCommandSelect(command.type)}
          className={`w-full text-left px-3 py-2.5 hover:bg-slate-800/80 rounded-md transition-colors cursor-pointer text-sm ${command.labelStyle}`}
        >
          {command.label}
        </div>
      ))}

      <div className="h-px bg-slate-800/60 my-1 mx-1" />

      <div
        onClick={handleDeleteSelect}
        className="w-full text-left px-3 py-2.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-md transition-colors cursor-pointer text-sm font-medium"
      >
        🗑️ Delete block
      </div>
    </div>
  );
};

export default BlockCommandMenu;
