import type { KeyboardEvent } from 'react';
import { LayoutMode } from '../state/types';
import { useProjectStore } from '../state/useProjectStore';

export const useSpatialKeyboard = () => {
  // 🎯 Pull our active IDs and pages dictionary directly from the modern multi-project store
  const { activeProjectId, activePageId, pages } = useProjectStore(
    (state) => state,
  );

  const zoomScale = useProjectStore((state) => state.zoomScale ?? 1);
  const setCameraOffset = useProjectStore((state) => state.setCameraOffset);
  const setZoomScale = useProjectStore((state) => state.setZoomScale);

  return (e: KeyboardEvent<HTMLElement>): boolean => {
    // 🔍 Safe structural lookup for the active page layout mode
    const activePage =
      activeProjectId && activePageId && pages[activeProjectId]
        ? pages[activeProjectId].find((p) => p.id === activePageId)
        : null;

    const layoutMode = activePage?.layoutMode ?? LayoutMode.DocumentCanvas;

    // 🎯 If we aren't explicitly on the infinite block canvas layout, ignore macro overrides entirely!
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
