import type { KeyboardEvent } from 'react';
import { WorkspaceViewMode } from '../state/types';
import { useProjectStore } from '../state/useProjectStore';

export const useSpatialKeyboard = () => {
  // 🎯 Select your true, centralized workspace view mode from the store slice
  const activeViewMode = useProjectStore((state) => state.activeViewMode);
  const zoomScale = useProjectStore((state) => state.zoomScale ?? 1);
  const setCameraOffset = useProjectStore((state) => state.setCameraOffset);
  const setZoomScale = useProjectStore((state) => state.setZoomScale);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    // 🎯 Guard directly against the global active view mode
    if (activeViewMode !== WorkspaceViewMode.PageCanvas) return false;

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
