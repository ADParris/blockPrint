// src/hooks/useSpatialMouse.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnchorDirection, CanvasBlock } from '../state/types';
import { createConnectionKey, useProjectStore } from '../state/useProjectStore';

interface UseSpatialMouseProps {
  projectId: string | undefined;
  pageId: string | undefined;
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
  const [connectingDirection, setConnectingDirection] =
    useState<AnchorDirection | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });

  // 📸 Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 🖱️ Card Dragging State
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 🤠 🚀 New Lasso Selection State (Stored in World Coordinates!)
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState({ x: 0, y: 0 });
  const [lassoEnd, setLassoEnd] = useState({ x: 0, y: 0 });

  const mouseStartScreenPos = useRef<{ x: number; y: number } | null>(null);
  const dragDetected = useRef<boolean>(false);

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

  const bgFill = useMemo(() => `url(#dot-grid)`, []);

  // =========================================================================
  // 🗺️ REGISTRY: EDGE-HOVER VIEWPORT PANNING (State Lock & Sync Ref)
  // =========================================================================
  const hoverTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraOffsetRef = useRef(cameraOffset);
  const isLoopingRef = useRef(false);
  const vectorRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 🛑 This works now because native listeners can be explicitly non-passive!
      e.preventDefault();

      const zoomIntensity = 0.05;
      const currentScale = useProjectStore.getState().zoomScale ?? 1; // Pull fresh from store

      const nextScale =
        currentScale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
      setZoomScale(Math.min(Math.max(nextScale, 0.2), 2));
    };

    // 🎯 The secret sauce: { passive: false } explicitly tells the browser we ARE interrupting the scroll
    canvasEl.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      canvasEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [canvasRef, setZoomScale]);

  useEffect(() => {
    cameraOffsetRef.current = cameraOffset;
  }, [cameraOffset]);

  // The Continuous Self-Sustaining Frame Loop Engine
  const startAnimationLoop = () => {
    const { dx, dy } = vectorRef.current;
    if (dx !== 0 || dy !== 0) {
      setCameraOffset({
        x: cameraOffsetRef.current.x + dx,
        y: cameraOffsetRef.current.y + dy,
      });
      requestAnimationFrame(startAnimationLoop);
    } else {
      isLoopingRef.current = false;
    }
  };

  // 🎯 Evaluated strictly when the mouse moves inside the outer div viewport bounds
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    const panSpeed = 2;
    const edgeThreshold = 50;
    const hoverDelay = 350;

    let nextDx = 0;
    let nextDy = 0;

    // Check right inner boundary of visible canvas
    if (rect.width - relativeX < edgeThreshold && relativeX <= rect.width) {
      nextDx = -panSpeed;
    }
    // Check left inner boundary of visible canvas (Safely past the sidebar!)
    else if (relativeX < edgeThreshold && relativeX >= 0) {
      nextDx = panSpeed;
    }

    // Check bottom inner boundary of visible canvas
    if (rect.height - relativeY < edgeThreshold && relativeY <= rect.height) {
      nextDy = -panSpeed;
    }
    // Check top inner boundary of visible canvas
    else if (relativeY < edgeThreshold && relativeY >= 0) {
      nextDy = panSpeed;
    }

    // Exit vector match: If cursor moves back to center workspace, halt instantly
    if (nextDx === 0 && nextDy === 0) {
      if (hoverTimeoutId.current) {
        clearTimeout(hoverTimeoutId.current);
        hoverTimeoutId.current = null;
      }
      vectorRef.current = { dx: 0, dy: 0 };
      isLoopingRef.current = false;
      return;
    }

    // Keep active velocities fresh
    vectorRef.current = { dx: nextDx, dy: nextDy };

    // 🎯 THE HOOK PROTECTION:
    // If the pan animation loop is already running, exit immediately!
    if (isLoopingRef.current) return;

    // If the mouse is sliding around high-frequency near the edge,
    // drop the stale timer so they don't stack up concurrently.
    if (hoverTimeoutId.current) {
      clearTimeout(hoverTimeoutId.current);
    }

    // Queue up the single, isolated pass-through filter timer
    hoverTimeoutId.current = setTimeout(() => {
      hoverTimeoutId.current = null;

      // Double check right before spinning up the loop engine
      if (!isLoopingRef.current) {
        isLoopingRef.current = true;
        requestAnimationFrame(startAnimationLoop);
      }
    }, hoverDelay);
  };

  // Safe cleaner interceptor when the mouse leaves the outer div area completely
  const handleCanvasMouseLeave = () => {
    if (hoverTimeoutId.current) clearTimeout(hoverTimeoutId.current);
    hoverTimeoutId.current = null;
    vectorRef.current = { dx: 0, dy: 0 };
    isLoopingRef.current = false;
  };

  // 🎯 Helper function to map screen events cleanly to our SVG Canvas Space
  const getCanvasWorldPoint = (
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | null => {
    const svgElement = canvasRef.current?.querySelector(
      '#grid-bg',
    ) as SVGSVGElement | null;
    if (!svgElement) return null;

    const point = svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const screenCTM = svgElement.getScreenCTM();
    if (!screenCTM) return null;

    const invertedPoint = point.matrixTransform(screenCTM.inverse());
    return { x: invertedPoint.x, y: invertedPoint.y };
  };

  // 🛠️ Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    let isReconnecting = false;

    // 🎯 Left-Click Reconnecting an Existing Arrow
    const arrowLine = target.closest('[data-connection-id]');
    if (e.button === 0 && arrowLine) {
      const connectionId = arrowLine.getAttribute('data-connection-id')!;
      const parts = connectionId.split('__');

      // 🔒 Ensure we have all pieces of the key structure (conn__src__tgt__srcDir__tgtDir)
      if (parts.length >= 5) {
        e.stopPropagation();
        e.preventDefault();
        const sourceId = parts[1];
        const sourceBlock = blocks.find((b) => b.id === sourceId);

        if (sourceBlock) {
          // ⚡ THE FIX: Read the exact source direction directly from the string key!
          const originalDirection = parts[3] as AnchorDirection;

          // 🔒 Lock these details in instantly
          setConnectingFromId(sourceId);
          setConnectingDirection(originalDirection);

          const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY);
          if (worldPoint) setMouseCanvasPos(worldPoint);

          removeBlockConnectionByKey(projectId, pageId, connectionId);
          isReconnecting = true; // ⚡ Set our frame lock!
        }
      }
    }

    // 🛑 If we are reconnecting, BAIL OUT immediately. Do not process anchors or cards!
    if (isReconnecting) return;

    if (e.button === 2) return;

    const blockElement = target.closest('[data-canvas-block-id]');
    const direction = target.getAttribute(
      'data-anchor-dir',
    ) as AnchorDirection | null;

    // Clicked an anchor pin -> Connect mode
    if (direction && blockElement) {
      e.stopPropagation();
      const blockId = blockElement.getAttribute('data-canvas-block-id')!;
      setConnectingFromId(blockId);
      setConnectingDirection(direction);

      const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY);
      if (worldPoint) setMouseCanvasPos(worldPoint);
      return;
    }

    // Clicked a card -> Card drag mode
    if (blockElement) {
      const blockId = blockElement.getAttribute('data-canvas-block-id')!;
      const block = blocks.find((b) => b.id === blockId);

      if (block) {
        mouseStartScreenPos.current = { x: e.clientX, y: e.clientY };
        dragDetected.current = false;

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
      return;
    }

    // Clicked empty canvas space
    if (
      !blockElement &&
      (e.target === canvasRef.current ||
        target.id === 'grid-bg' ||
        target.tagName === 'rect' ||
        target.tagName === 'svg')
    ) {
      // Spacebar or Middle Mouse or Right Click could be panning, but let's assume left click empty space starts lasso!
      if (e.shiftKey || e.button === 1) {
        // Option to Pan with Shift or Middle click if desired, otherwise default to Panning vs Lassoing
        setIsPanning(true);
        setPanStart({
          x: e.clientX - cameraOffset.x,
          y: e.clientY - cameraOffset.y,
        });
      } else {
        // Default behavior: Left-clicking empty space kicks off selection lasso!
        const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY);
        if (worldPoint) {
          setIsLassoActive(true);
          setLassoStart(worldPoint);
          setLassoEnd(worldPoint);
        }
      }
    }
  };

  // 🛠️ Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingFromId) {
      const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY);
      if (worldPoint) setMouseCanvasPos(worldPoint);
    } else if (isLassoActive) {
      // Update lasso end in true world coordinates!
      const worldPoint = getCanvasWorldPoint(e.clientX, e.clientY);
      if (worldPoint) setLassoEnd(worldPoint);
    } else if (activeDragId) {
      if (mouseStartScreenPos.current && !dragDetected.current) {
        const deltaX = Math.abs(e.clientX - mouseStartScreenPos.current.x);
        const deltaY = Math.abs(e.clientY - mouseStartScreenPos.current.y);
        if (deltaX > 3 || deltaY > 3) {
          dragDetected.current = true;
        }
      }

      const normalizedX =
        (e.clientX - cameraOffset.x) / zoomScale - dragOffset.x;
      const normalizedY =
        (e.clientY - cameraOffset.y) / zoomScale - dragOffset.y;
      const GRID_SIZE = 40;

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
    mouseStartScreenPos.current = null;

    if (dragDetected.current) {
      setTimeout(() => {
        dragDetected.current = false;
      }, 50);
    }

    if (connectingFromId) {
      const target = e.target as HTMLElement;
      const blockElement = target.closest('[data-canvas-block-id]');

      // Try to find if they landed on a specific target pin
      const releasedAnchorDir = (target.getAttribute('data-anchor-dir') ||
        'top') as AnchorDirection;

      if (blockElement) {
        const targetBlockId = blockElement.getAttribute(
          'data-canvas-block-id',
        )!;
        if (targetBlockId !== connectingFromId) {
          // 🔒 GUARD: Force it to use the exact direction currently held in memory,
          // and do NOT let it fallback to a random card side if state is batching!
          const sourceDir = connectingDirection;
          const targetDir = releasedAnchorDir;

          if (sourceDir) {
            const connectionKey = createConnectionKey(
              connectingFromId,
              targetBlockId,
              sourceDir,
              targetDir,
            );
            addBlockConnectionByKey(projectId, pageId, connectionKey);
          }
        }
      }
    }

    // 🎯 Lasso Calculations Done
    if (isLassoActive) {
      // Calculate final selected boxes using lassoStart and lassoEnd world bounds
      const minX = Math.min(lassoStart.x, lassoEnd.x);
      const maxX = Math.max(lassoStart.x, lassoEnd.x);
      const minY = Math.min(lassoStart.y, lassoEnd.y);
      const maxY = Math.max(lassoStart.y, lassoEnd.y);

      const caughtBlocks = blocks.filter((block) => {
        const bx = block.position?.x ?? 0;
        const by = block.position?.y ?? 0;
        // Simple accurate world point overlap check (cards are typically 256px wide or custom size)
        return bx >= minX && bx <= maxX && by >= minY && by <= maxY;
      });

      console.log('Blocks caught inside world lasso:', caughtBlocks);
      // TODO: Connect caughtBlocks to a selection array in your store here!

      setIsLassoActive(false);
    }

    setIsPanning(false);
    setActiveDragId(null);
    setConnectingFromId(null);
    setConnectingDirection(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return {
    cameraOffset,
    zoomScale,
    bgFill,
    isDragActive: () => dragDetected.current,
    mouseState: {
      connectingFromId,
      connectingDirection,
      mouseCanvasPos,
      isPanning,
      activeDragId,
      isLassoActive,
      lassoStart,
      lassoEnd,
    },
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
        handleMouseMove(e); // Runs block drags/lasso selection
        handleCanvasMouseMove(e); // Runs edge panning calculations
      },
      onMouseUp: handleMouseUp,
      onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
        handleMouseUp(e);
        handleCanvasMouseLeave(); // Stops edge panning completely upon exit
      },
      onContextMenu: handleContextMenu,
    },
  };
};
