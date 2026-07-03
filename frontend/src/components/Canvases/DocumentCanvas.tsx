// src/components/Canvases/DocumentCanvas.tsx
import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useProjectStore } from '../../state/useProjectStore';
import BlockRenderer from '../BlockRenderer';
import PageHeader from '../PageHeader';
import SortableList from '../SortableList';

const DocumentCanvas: React.FC = () => {
  // 🎯 1. Extract context directly from URL parameter strings
  const { projectId, pageId } = useParams<{
    projectId: string;
    pageId: string;
  }>();
  const location = useLocation();

  // 🎯 2. Atomic Selector Subscriptions (Prevents unnecessary re-renders)
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
    // Look for incoming target hash references (e.g., #block-1782864...)
    if (location.hash && location.hash.startsWith('#block-')) {
      const targetId = location.hash.replace('#', '');

      // Give SortableList/BlockRenderer a micro-task tick to ensure the DOM is painted
      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(targetId);

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Centers the text node perfectly on the viewport axis
          });

          // Focus the block active id state inside Zustand automatically
          const dynamicBlockId = targetId.replace('block-', '');
          setActiveBlockId(dynamicBlockId);

          // Spark a smooth visual ring to guide the writer's eye
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

  // 5. Guard Gate! Safe structural fallback if no page matches the route path
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
      // 🎯 Pass explicit context downstream to the decoupled action
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

        <SortableList
          items={activePage.blocks}
          // 🎯 Currying the project and page IDs straight into our reorder action
          onMoveItem={(activeId, targetIndex) =>
            moveBlockToIndex(projectId, pageId, activeId, targetIndex)
          }
          renderItem={(block) => (
            <BlockRenderer
              projectId={projectId}
              pageId={pageId}
              block={block}
            />
          )}
        />
        <div className="h-[40vh]" />
      </div>
    </div>
  );
};

export default DocumentCanvas;
