// src/hooks/useSpatialKeyboard.ts
import type { KeyboardEvent } from 'react';
import { useProjectStore } from '../state/useProjectStore';

interface SpatialKeyboardArgs {
  isCanvasView: boolean;
}

export const useSpatialKeyboard = ({ isCanvasView }: SpatialKeyboardArgs) => {
  const zoomScale = useProjectStore((state) => state.zoomScale ?? 1);
  const cameraOffset = useProjectStore(
    (state) => state.cameraOffset ?? { x: 0, y: 0 },
  );
  const setCameraOffset = useProjectStore((state) => state.setCameraOffset);
  const setZoomScale = useProjectStore((state) => state.setZoomScale);

  // 🎯 Clean, single-responsibility key handler returned directly to your Canvas event layer
  return (e: KeyboardEvent<HTMLElement>): boolean => {
    // 🔒 GUARD 1: Bail immediately if the canvas viewport isn't active
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

    // 🔒 GUARD 2: Safety shield against interrupting content inputs or editable blocks
    const target = e.target as HTMLElement;
    if (
      target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA'
    ) {
      return false;
    }

    // 🔍 2. Macro Reset Key ('R' to Recenters Viewport)
    if (e.key.toLowerCase() === 'r') {
      setCameraOffset({ x: 0, y: 0 });
      setZoomScale(1);
      return true;
    }

    // 🔍 3. Snappy Arrow Key Panning Engine
    const keyboardPanSpeed = 30;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setCameraOffset({
          x: cameraOffset.x,
          y: cameraOffset.y + keyboardPanSpeed,
        });
        return true;
      case 'ArrowDown':
        e.preventDefault();
        setCameraOffset({
          x: cameraOffset.x,
          y: cameraOffset.y - keyboardPanSpeed,
        });
        return true;
      case 'ArrowLeft':
        e.preventDefault();
        setCameraOffset({
          x: cameraOffset.x + keyboardPanSpeed,
          y: cameraOffset.y,
        });
        return true;
      case 'ArrowRight':
        e.preventDefault();
        setCameraOffset({
          x: cameraOffset.x - keyboardPanSpeed,
          y: cameraOffset.y,
        });
        return true;
      default:
        return false;
    }
  };
};
