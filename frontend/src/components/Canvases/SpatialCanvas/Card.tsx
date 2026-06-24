// components/SpatialCanvas/SpatialCard.tsx
import React from 'react';
import type { CanvasBlock } from '../../../state/types';

interface SpatialCardProps {
  block: CanvasBlock;
  index: number;
  isPanning: boolean;
  isActiveDrag: boolean;
}

const SpatialCard: React.FC<SpatialCardProps> = ({
  block,
  index,
  isPanning,
  isActiveDrag,
}) => {
  const posX = block?.position?.x ?? 100 + index * 20;
  const posY = block?.position?.y ?? 100 + index * 20;

  return (
    <div
      data-canvas-block-id={block.id}
      style={{
        position: 'absolute',
        left: `${posX}px`,
        top: `${posY}px`,
        cursor: isPanning ? 'grabbing' : 'grab',
      }}
      className={`group w-64 bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-200 text-sm transition-shadow duration-100 ${
        isActiveDrag ? 'shadow-2xl ring-2 ring-blue-500/50' : 'shadow-xl'
      }`}
    >
      {/* ⚪ Interactive Anchor Pins */}
      <div
        data-anchor-dir="top"
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-n-resize"
      />
      <div
        data-anchor-dir="right"
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-e-resize"
      />
      <div
        data-anchor-dir="bottom"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-s-resize"
      />
      <div
        data-anchor-dir="left"
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 hover:scale-125 cursor-w-resize"
      />

      <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1 pointer-events-none">
        {block.type || 'p'} Element
      </div>
      <div className="pointer-events-none">
        {block.content || (
          <span className="text-slate-600 italic">Empty block</span>
        )}
      </div>
    </div>
  );
};

export default SpatialCard;
