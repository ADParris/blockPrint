import React, { useEffect, useRef } from 'react';

interface ModalProps {
  children: React.ReactNode;
  handleClose: () => void;
  left?: number;
  menuPosition?: {
    top: number;
    left: number;
  } | null;
}

const Modal: React.FC<ModalProps> = ({
  menuPosition,
  children,
  handleClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const positioningStyle: React.CSSProperties =
    menuPosition === undefined || menuPosition === null
      ? {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
        }
      : {
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          position: 'absolute',
        };

  // 1. Reusable "Self-Closing" Logic (Click outside & Escape)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click is outside the modal container, trigger close
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  // 2. Reusable Visual Wrapper + Dynamic Positioning
  return (
    <div
      ref={modalRef}
      className="w-fit h-fit max-w-[90vw] max-h-[90vh] overflow-auto p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl"
      style={positioningStyle}
    >
      <div className="flex flex-col gap-1">
        {children} {/* 👈 Pass in BlockCommandMenu or anything else */}
      </div>
    </div>
  );
};

export default Modal;
