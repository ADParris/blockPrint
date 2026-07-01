// components/SpatialCanvas/useSpatialMouse.ts
import { useMemo, useState } from 'react';
import type { AnchorDirection, CanvasBlock } from '../state/types';
import { createConnectionKey, useProjectStore } from '../state/useProjectStore';

interface UseSpatialMouseProps {
  projectId: string | undefined; // 🎯 Added project scope parameter
  pageId: string | undefined; // 🎯 Added page scope parameter
  canvasRef: React.RefObject<HTMLDivElement | null>;
  blocks: CanvasBlock[];
}

export const useSpatialMouse = ({
  projectId,
  pageId,
  canvasRef,
  blocks,
}: UseSpatialMouseProps) => {
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  // 🎯 Type-hint state directly as AnchorDirection to resolve parsing errors downstream cleanly
  const [connectingDirection, setConnectingDirection] =
    useState<AnchorDirection | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  // 📸 Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 🖱️ Card Dragging State
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Atomic Canvas Store Selectors
  const cameraOffset = useProjectStore(
    (state) => state.cameraOffset ?? { x: 0, y: 0 },
  );
  const zoomScale = useProjectStore((state) => state.zoomScale ?? 1);
  const setCameraOffset = useProjectStore((state) => state.setCameraOffset);
  const setZoomScale = useProjectStore((state) => state.setZoomScale);

  const updateBlockPosition = useProjectStore(
    (state) => state.updateBlockPosition,
  );
  const addBlockConnectionByKey = useProjectStore(
    (state) => state.addBlockConnectionByKey,
  );
  const removeBlockConnectionByKey = useProjectStore(
    (state) => state.removeBlockConnectionByKey,
  );

  const bgFill = useMemo(
    () => `url(#dot-grid-${Math.round(zoomScale * 100)})`,
    [zoomScale],
  );

  // 🛠️ Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 🎯 Left-Click Reconnecting an Existing Arrow
    const arrowLine = target.closest('[data-connection-id]');
    if (e.button === 0 && arrowLine) {
      const connectionId = arrowLine.getAttribute('data-connection-id')!;
      const parts = connectionId.split('__');

      if (parts.length >= 3) {
        e.stopPropagation();

        const sourceId = parts[1];
        const targetId = parts[2];
        const sourceBlock = blocks.find((b) => b.id === sourceId);

        if (sourceBlock) {
          const existingConn = sourceBlock.connections?.find(
            (c) => c.targetId === targetId,
          );
          const originalDirection = existingConn?.sourceDir || 'bottom';

          setConnectingFromId(sourceId);
          setConnectingDirection(originalDirection);

          const rect = canvasRef.current!.getBoundingClientRect();
          setMouseCanvasPos({
            x: (e.clientX - rect.left - cameraOffset.x) / zoomScale,
            y: (e.clientY - rect.top - cameraOffset.y) / zoomScale,
          });

          // 🎯 Pass explicit routing keys to fulfill the new method signature
          removeBlockConnectionByKey(projectId, pageId, connectionId);
          return;
        }
      }
    }

    if (e.button === 2) return;

    const blockElement = target.closest('[data-canvas-block-id]');
    const direction = target.getAttribute(
      'data-anchor-dir',
    ) as AnchorDirection | null;

    // Standard Anchor Pin connecting logic
    if (direction && blockElement) {
      e.stopPropagation();
      const blockId = blockElement.getAttribute('data-canvas-block-id')!;

      setConnectingFromId(blockId);
      setConnectingDirection(direction);

      setMouseCanvasPos({
        x:
          (e.clientX -
            canvasRef.current!.getBoundingClientRect().left -
            cameraOffset.x) /
          zoomScale,
        y:
          (e.clientY -
            canvasRef.current!.getBoundingClientRect().top -
            cameraOffset.y) /
          zoomScale,
      });
      return;
    }

    // Standard card dragging setup
    if (blockElement) {
      const blockId = blockElement.getAttribute('data-canvas-block-id')!;
      const block = blocks.find((b) => b.id === blockId);

      if (block) {
        setDragOffset({
          x:
            (e.clientX - cameraOffset.x) / zoomScale -
            (block.position?.x ?? 100),
          y:
            (e.clientY - cameraOffset.y) / zoomScale -
            (block.position?.y ?? 100),
        });
        setActiveDragId(blockId);
      }
    } else if (e.target === canvasRef.current || target.id === 'grid-bg') {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - cameraOffset.x,
        y: e.clientY - cameraOffset.y,
      });
    }
  };

  // 🛠️ Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingFromId) {
      setMouseCanvasPos({
        x:
          (e.clientX -
            canvasRef.current!.getBoundingClientRect().left -
            cameraOffset.x) /
          zoomScale,
        y:
          (e.clientY -
            canvasRef.current!.getBoundingClientRect().top -
            cameraOffset.y) /
          zoomScale,
      });
    } else if (activeDragId) {
      const normalizedX =
        (e.clientX - cameraOffset.x) / zoomScale - dragOffset.x;
      const normalizedY =
        (e.clientY - cameraOffset.y) / zoomScale - dragOffset.y;
      const GRID_SIZE = 40;

      // 🎯 Pass explicit routing identifiers to update relative layout arrays
      updateBlockPosition(projectId, pageId, activeDragId, {
        x: Math.round(normalizedX / GRID_SIZE) * GRID_SIZE,
        y: Math.round(normalizedY / GRID_SIZE) * GRID_SIZE,
      });
    } else if (isPanning) {
      setCameraOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  // 🛠️ Mouse Up Event Handler
  const handleMouseUp = (e: React.MouseEvent) => {
    if (connectingFromId) {
      const target = e.target as HTMLElement;
      const blockElement = target.closest('[data-canvas-block-id]');
      const releasedAnchorDir = (target.getAttribute('data-anchor-dir') ||
        'top') as AnchorDirection;

      if (blockElement) {
        const targetBlockId = blockElement.getAttribute(
          'data-canvas-block-id',
        )!;

        if (targetBlockId !== connectingFromId) {
          const sourceDir = connectingDirection || 'top';
          const targetDir = releasedAnchorDir;

          const connectionKey = createConnectionKey(
            connectingFromId,
            targetBlockId,
            sourceDir,
            targetDir,
          );

          // 🎯 Pass explicit routing identifiers to add new persistent canvas arrows
          addBlockConnectionByKey(projectId, pageId, connectionKey);
        }
      }
    }

    setIsPanning(false);
    setActiveDragId(null);
    setConnectingFromId(null);
    setConnectingDirection(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.05;

    setZoomScale((prevScale) => {
      const nextScale =
        prevScale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
      return Math.min(Math.max(nextScale, 0.2), 2);
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return {
    cameraOffset,
    zoomScale,
    bgFill,
    mouseState: {
      connectingFromId,
      connectingDirection,
      mouseCanvasPos,
      isPanning,
      activeDragId,
    },
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
      onContextMenu: handleContextMenu,
    },
  };
};
