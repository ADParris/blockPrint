import type { KeyboardEvent } from 'react';
import { useDocumentKeyboard } from './useDocumentKeyboard';
import { useGlobalKeyboard } from './useGlobalKeyboard';
import { useSpatialKeyboard } from './useSpatialKeyboard';

export const useCanvasKeyboard = () => {
  const handleGlobal = useGlobalKeyboard();
  const handleDocument = useDocumentKeyboard();
  const handleSpatial = useSpatialKeyboard();

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (handleGlobal(e)) return;
    if (handleDocument(e)) return;
    if (handleSpatial(e)) return;
  };

  return { handleKeyDown };
};
