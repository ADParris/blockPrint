import type { KeyboardEvent } from 'react';
import { LayoutMode } from '../state/types';
import { useCanvasStore } from '../state/useCanvasStore';

export const useSpatialKeyboard = () => {
  const getActiveNotebook = useCanvasStore((state) => state.getActiveNotebook);

  // 🎯 Select individual stable references to prevent object recreation loops
  // const cameraOffset = useCanvasStore(
  //   (state) => state.cameraOffset ?? { x: 0, y: 0 },
  // );
  const zoomScale = useCanvasStore((state) => state.zoomScale ?? 1);
  const setCameraOffset = useCanvasStore((state) => state.setCameraOffset);
  const setZoomScale = useCanvasStore((state) => state.setZoomScale);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    const currentNotebook = getActiveNotebook();
    const layoutMode = currentNotebook?.layoutMode;

    if (layoutMode !== LayoutMode.SpatialCanvas) return false;

    // 🔍 1. Canvas Macro Modifiers (Ctrl/Cmd Bindings)
    if (e.metaKey || e.ctrlKey) {
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoomScale(Math.min(zoomScale + 0.1, 2));
        return true;
      }
      if (e.key === '-') {
        e.preventDefault();
        setZoomScale(Math.max(zoomScale - 0.1, 0.2));
        return true;
      }
      if (e.key === '0') {
        e.preventDefault();
        setCameraOffset({ x: 0, y: 0 });
        setZoomScale(1);
        return true;
      }
    }

    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLInputElement
    ) {
      return false;
    }

    if (e.key.toLowerCase() === 'r') {
      setCameraOffset({ x: 0, y: 0 });
      setZoomScale(1);
      return true;
    }

    return false;
  };
};
