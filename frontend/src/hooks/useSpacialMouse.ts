// components/SpatialCanvas/useSpatialMouse.ts
import { useMemo, useState } from 'react';
import type { AnchorDirection, CanvasBlock } from '../state/types';
import { useCanvasStore } from '../state/useCanvasStore';

interface UseSpatialMouseProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  blocks: CanvasBlock[];
}

export const useSpatialMouse = ({
  canvasRef,
  blocks,
}: UseSpatialMouseProps) => {
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [connectingDirection, setConnectingDirection] = useState<string | null>(
    null,
  );
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  // 📸 Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 🖱️ Card Dragging State
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Atomic Canvas Store Selectors
  const cameraOffset = useCanvasStore(
    (state) => state.cameraOffset ?? { x: 0, y: 0 },
  );
  const zoomScale = useCanvasStore((state) => state.zoomScale ?? 1);
  const setCameraOffset = useCanvasStore((state) => state.setCameraOffset);
  const setZoomScale = useCanvasStore((state) => state.setZoomScale);
  const updateBlockPosition = useCanvasStore(
    (state) => state.updateBlockPosition,
  );
  const addBlockConnection = useCanvasStore(
    (state) => state.addBlockConnection,
  );
  // 🎯 Need this to delete the old route when a user picks up an existing arrow tip!
  const removeBlockConnection = useCanvasStore(
    (state) => state.removeBlockConnection,
  );

  const bgFill = useMemo(
    () => `url(#dot-grid-${Math.round(zoomScale * 100)})`,
    [zoomScale],
  );

  // 🛠️ Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // 🎯 FEATURE: Left-Click Reconnecting an Existing Arrow
    const arrowLine = target.closest('[data-connection-id]');
    if (e.button === 0 && arrowLine) {
      const connectionId = arrowLine.getAttribute('data-connection-id')!;
      const parts = connectionId.split('__');

      if (parts.length >= 3) {
        e.stopPropagation();

        const sourceId = parts[1]; // Clean source UUID
        const targetId = parts[2]; // Clean target UUID

        const sourceBlock = blocks.find((b) => b.id === sourceId);

        if (sourceBlock) {
          // 🎯 FIX: Find the actual connection record to preserve its original anchor face direction!
          const existingConn = sourceBlock.connections?.find(
            (c) => c.targetId === targetId,
          );
          const originalDirection = existingConn?.sourceDir || 'bottom'; // Fallback just in case

          // 1. Lock the origin down to the original source block
          setConnectingFromId(sourceId);

          // 2. 🎯 Use the authentic direction instead of a hardcoded 'top'
          setConnectingDirection(originalDirection);

          // 3. Pin the live line target to the precise mouse position
          const rect = canvasRef.current!.getBoundingClientRect();
          setMouseCanvasPos({
            x: (e.clientX - rect.left - cameraOffset.x) / zoomScale,
            y: (e.clientY - rect.top - cameraOffset.y) / zoomScale,
          });

          // 4. Sever the old connection record from the store
          removeBlockConnection(sourceId, targetId);
          return;
        }
      }
    }

    if (e.button === 2) return; // Maintain normal right-click flows for command menus

    const blockElement = target.closest('[data-canvas-block-id]');
    const direction = target.getAttribute('data-anchor-dir');

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
      updateBlockPosition(activeDragId, {
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

      if (blockElement) {
        const targetBlockId = blockElement.getAttribute(
          'data-canvas-block-id',
        )!;
        if (targetBlockId !== connectingFromId) {
          // 🎯 Pass your active anchor direction state here (e.g., connectingDirection)
          addBlockConnection(
            connectingFromId,
            targetBlockId,
            connectingDirection as AnchorDirection,
          );
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
