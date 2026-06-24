// components/SpatialCanvas/useSpatialMouse.ts
import { useState, useMemo } from 'react';
import { useCanvasStore } from '../state/useCanvasStore';
import type { CanvasBlock } from '../state/types';

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

  // Background pattern string optimization
  const bgFill = useMemo(
    () => `url(#dot-grid-${Math.round(zoomScale * 100)})`,
    [zoomScale],
  );

  // 🛠️ Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return;
    const target = e.target as HTMLElement;
    const blockElement = target.closest('[data-canvas-block-id]');
    const direction = target.getAttribute('data-anchor-dir');

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
          addBlockConnection(connectingFromId, targetBlockId);
        }
      }
    }

    setIsPanning(false);
    setActiveDragId(null);
    setConnectingFromId(null);
    setConnectingDirection(null);
  };

  // 🛠️ Wheel/Trackpad Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.05;

    setZoomScale((prevScale) => {
      const nextScale =
        prevScale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
      return Math.min(Math.max(nextScale, 0.2), 2);
    });
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
    },
  };
};
