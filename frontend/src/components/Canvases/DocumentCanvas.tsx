// src/components/Canvases/DocumentCanvas.tsx
import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useProjectStore } from '../../state/useProjectStore';
import BlockRenderer from '../BlockRenderer';
import PageHeader from '../PageHeader';
import SortableList from '../SortableList';
import { BaseElement } from '../../state/types';

const DocumentCanvas: React.FC = () => {
  // 🎯 1. Extract context directly from URL parameter strings
  const { projectId, pageId } = useParams<{
    projectId: string;
    pageId: string;
  }>();
  const location = useLocation();

  // 🎯 2. Atomic Selector Subscriptions
  const pages = useProjectStore((state) => state.pages);
  const moveBlockToIndex = useProjectStore((state) => state.moveBlockToIndex);
  const setActiveBlockId = useProjectStore((state) => state.setActiveBlockId);
  const updateBlockContent = useProjectStore(
    (state) => state.updateBlockContent,
  );

  // 3. Resolve the active page reference cleanly out of storage
  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  // 🎯 4. Auto-Scroll Listener Engine
  useEffect(() => {
    if (location.hash && location.hash.startsWith('#block-')) {
      const targetId = location.hash.replace('#', '');

      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(targetId);

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          const dynamicBlockId = targetId.replace('block-', '');
          setActiveBlockId(dynamicBlockId);

          element.classList.add(
            'ring-2',
            'ring-sky-500/20',
            'rounded-lg',
            'transition-all',
            'duration-300',
          );

          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-sky-500/20');
          }, 1200);
        }
      }, 150);

      return () => clearTimeout(scrollTimeout);
    }
  }, [location.hash, setActiveBlockId]);

  // 5. Guard Gate! Safe structural fallback
  if (!projectId || !pageId || !activePage) {
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
      updateBlockContent(projectId, pageId, blockId, text);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-12 pb-24">
      <div
        className="max-w-3xl mx-auto flex flex-col gap-2 pointer-events-auto"
        onBlur={handleContentChange}
        onFocus={handleFocus}
      >
        <PageHeader projectId={projectId} page={activePage} />

        {/* 🎯 Updated SortableList: Let generics infer T from activePage.blocks */}
        <SortableList
          items={activePage.blocks}
          projectId={projectId}
          dragType={BaseElement.Block} // 🎯 Explicitly specify the drag type for blocks
          onMoveItem={(sourceIndex, targetIndex) => {
            // 🎯 Find the actual string ID using the source number index
            const targetBlock = activePage.blocks[sourceIndex];
            if (!targetBlock) return;

            // 🎯 Pass the correct string ID into your store action!
            moveBlockToIndex(projectId, pageId, targetBlock.id, targetIndex);
          }}
          renderItem={(block, index) => (
            <BlockRenderer
              projectId={projectId}
              pageId={pageId}
              block={block}
              index={index}
            />
          )}
        />
        <div className="h-[40vh]" />
      </div>
    </div>
  );
};

export default DocumentCanvas;
