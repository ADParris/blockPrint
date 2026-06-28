// src/components/Canvases/DocumentCanvas.tsx
import { useProjectStore } from '../../state/useProjectStore';
import BlockRenderer from '../BlockRenderer';
import PageHeader from '../PageHeader';
import SortableList from '../SortableList';

const DocumentCanvas: React.FC = () => {
  const {
    activeProjectId,
    activePageId,
    pages,
    moveBlockToIndex,
    setActiveBlockId,
    updateBlockContent,
  } = useProjectStore((state) => state);

  // 1. Resolve the active page reference out of the nested storage
  const activePage =
    activeProjectId && activePageId && pages[activeProjectId]
      ? pages[activeProjectId].find((p) => p.id === activePageId)
      : null;

  // 2. 🛡️ The Guard Gate! Safe structural fallback if no page is active.
  if (!activePage) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="font-medium">No page selected</p>
          <p className="text-sm text-slate-500 mt-1">
            Select or create a page from the sidebar to begin editing.
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
      <div
        className="max-w-3xl mx-auto flex flex-col gap-2 pointer-events-auto"
        onBlur={handleContentChange}
        onFocus={handleFocus}
      >
        {/* 🎯 Re-routing data context downward to the layout sub-headers */}
        <PageHeader page={activePage} />

        <SortableList
          items={activePage.blocks}
          onMoveItem={moveBlockToIndex}
          renderItem={(block) => <BlockRenderer block={block} />}
        />
        <div className="h-[40vh]" />
      </div>
    </div>
  );
};

export default DocumentCanvas;
