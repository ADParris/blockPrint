// src/hooks/useCanvasKeyboard.ts
import type { KeyboardEvent } from 'react';
import { useDocumentKeyboard } from './useDocumentKeyboard';
import { useGlobalKeyboard } from './useGlobalKeyboard';
import { useSpatialKeyboard } from './useSpatialKeyboard';

interface CanvasKeyboardArgs {
  projectId: string | undefined;
  pageId: string | undefined;
  isDocumentView: boolean;
  isCanvasView: boolean;
}

export const useCanvasKeyboard = ({
  projectId,
  pageId,
  isDocumentView,
  isCanvasView,
}: CanvasKeyboardArgs) => {
  const handleGlobal = useGlobalKeyboard();
  const handleDocument = useDocumentKeyboard(projectId, pageId, isDocumentView);

  // 🎯 Wire up the spatial canvas handler with its dependency match
  const handleSpatial = useSpatialKeyboard({ isCanvasView });

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (handleGlobal(e)) return;
    if (handleDocument(e)) return;
    if (handleSpatial(e)) return;
  };

  return { handleKeyDown };
};
