import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  menuPosition?: {
    top: number;
    left: number;
  } | null;
}

const Modal: React.FC<ModalProps> = ({ menuPosition, children, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 🎯 Track real-time adjustment states
  const [adjustedCoords, setAdjustedCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Determine if this instance is operating as a floating context menu
  const isContextMenu = menuPosition !== undefined && menuPosition !== null;

  // 🎯 SMART POSITIONING PASS: Run synchronously before the browser paints
  useLayoutEffect(() => {
    if (!isContextMenu || !menuPosition || !modalRef.current) {
      // If it's a centered modal, it's instantly ready
      setIsReady(true);
      return;
    }

    const rect = modalRef.current.getBoundingClientRect();
    const safetyMargin = 48; // Keep a clean gap from the absolute viewport edges

    let finalTop = menuPosition.top;
    let finalLeft = menuPosition.left;

    // Check bottom viewport collision
    if (finalTop + rect.height > window.innerHeight - safetyMargin) {
      // Pivot upwards by shifting the top coordinate up by the menu's height
      finalTop = window.innerHeight - rect.height - safetyMargin;
    }

    // Check right viewport collision (bonus guard rail for narrow viewports)
    if (finalLeft + rect.width > window.innerWidth - safetyMargin) {
      finalLeft = window.innerWidth - rect.width - safetyMargin;
    }

    // Guard rails for top/left bounds (just in case the menu is taller than the screen)
    if (finalTop < safetyMargin) finalTop = safetyMargin;
    if (finalLeft < safetyMargin) finalLeft = safetyMargin;

    setAdjustedCoords({ top: finalTop, left: finalLeft });
    setIsReady(true);
  }, [menuPosition, isContextMenu]);

  // Compute final styles based on mode and calculation readiness
  const positioningStyle: React.CSSProperties = !isContextMenu
    ? {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
      }
    : {
        top: adjustedCoords
          ? `${adjustedCoords.top}px`
          : `${menuPosition.top}px`,
        left: adjustedCoords
          ? `${adjustedCoords.left}px`
          : `${menuPosition.left}px`,
        position: 'fixed',
      };

  // Reusable "Self-Closing" Logic (Click outside & Escape)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // 🎯 NEW: Automatically dismiss when the user scrolls the document or panels
    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Use capture: true so we intercept scrolling in any sub-container/canvas panel
    window.addEventListener('scroll', handleScroll, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className={`w-fit h-fit max-w-[90vw] max-h-[90vh] overflow-auto bg-surface border border-line rounded-lg shadow-xl z-50 
        transition-all duration-100 ease-out 
        ${isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={positioningStyle}
    >
      <div className="flex flex-col">{children}</div>
    </div>
  );
};

export default Modal;
