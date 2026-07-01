// src/hooks/useSpatialKeyboard.ts
import type { KeyboardEvent } from 'react';
import { useProjectStore } from '../state/useProjectStore';

interface SpatialKeyboardArgs {
  isCanvasView: boolean;
}

export const useSpatialKeyboard = ({ isCanvasView }: SpatialKeyboardArgs) => {
  const zoomScale = useProjectStore((state) => state.zoomScale ?? 1);
  const setCameraOffset = useProjectStore((state) => state.setCameraOffset);
  const setZoomScale = useProjectStore((state) => state.setZoomScale);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    // 🎯 Guard cleanly using the view state flag passed down from the route layout boundary
    if (!isCanvasView) return false;

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
