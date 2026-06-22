import React, { useState } from 'react';

interface DropZoneProps {
  index: number;
  onDropBlock: (activeId: string, targetIndex: number) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ index, onDropBlock }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const draggedBlockId = e.dataTransfer.getData('text/plain');
    if (draggedBlockId) {
      onDropBlock(draggedBlockId, index);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative w-full h-8 -my-3 z-10 transition-all duration-150 select-none cursor-pointer"
    >
      {/* 💡 The visual landing strip line */}
      <div
        className={`absolute left-8 right-4 h-0.5 bg-sky-500 rounded transition-opacity duration-150 pointer-events-none ${
          isOver ? 'opacity-100 scale-y-150' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default DropZone;
