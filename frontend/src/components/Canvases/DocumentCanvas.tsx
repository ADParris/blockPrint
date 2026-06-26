import { useCanvasStore } from '../../state/useCanvasStore';
import BlockRenderer from '../BlockRenderer';
import NotebookHeader from '../NotebookHeader';
import SortableList from '../SortableList';

const DocumentCanvas: React.FC = () => {
  const {
    getActiveNotebook,
    moveBlockToIndex,
    setActiveBlockId,
    updateBlockContent,
  } = useCanvasStore((state) => state);

  // 1. Get the notebook reference (might be undefined initially)
  const notebook = getActiveNotebook();

  // 2. Fetch Modal store configurations

  // 3. Initialize your keyboard controller
  // 🛡️ Safe Option: If notebook is missing, we pass an empty array '[]' so it doesn't crash!

  // 4. 🛡️ The Guard Gate! All hooks have run, so now it is 100% legal to return early.
  if (!notebook) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="font-medium">No notebook selected</p>
          <p className="text-sm text-slate-500 mt-1">
            Select a notebook from the sidebar to begin editing.
          </p>
        </div>
      </div>
    );
  }

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    const blockId = e.target.getAttribute('data-block-id');
    if (blockId) {
      setActiveBlockId(blockId);
    }
  };

  const handleContentChange = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const blockId = target.getAttribute('data-block-id');
    const text = target.value;

    if (blockId) {
      updateBlockContent(blockId, text);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-12 pb-24">
      {' '}
      {/* 👈 Added top padding here */}
      <div
        className="max-w-3xl mx-auto flex flex-col gap-2 pointer-events-auto"
        onBlur={handleContentChange}
        onFocus={handleFocus}
      >
        <NotebookHeader notebook={notebook} />
        <SortableList
          items={notebook.blocks}
          onMoveItem={moveBlockToIndex}
          renderItem={(block) => <BlockRenderer block={block} />}
        />
        <div className="h-[40vh]" />
      </div>
    </div>
  );
};

export default DocumentCanvas;
