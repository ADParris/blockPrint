import React, { useEffect, useRef } from 'react';

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
          position: 'fixed',
        };

  // 1. Reusable "Self-Closing" Logic (Click outside & Escape)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click is outside the modal container, trigger close
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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 2. Reusable Visual Wrapper + Dynamic Positioning
  return (
    <div
      ref={modalRef}
      className="w-fit h-fit max-w-[90vw] max-h-[90vh] overflow-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50"
      style={positioningStyle}
    >
      <div className="flex flex-col">
        {children} {/* 👈 Pass in BlockCommandMenu or anything else */}
      </div>
    </div>
  );
};

export default Modal;
