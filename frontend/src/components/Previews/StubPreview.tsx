// src/components/Previews/StubPreview.tsx
import React from 'react';

interface StubPreviewProps {
  content?: string;
}

const StubPreview: React.FC<StubPreviewProps> = ({ content }) => {
  const isLongProse = (content?.length ?? 0) > 60;

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden text-slate-300 rounded-xl relative ${
        isLongProse
          ? 'items-start justify-start text-left px-2 py-1'
          : 'items-center justify-center text-center p-2'
      }`}
    >
      <div className="select-none font-medium pr-10 wrap-break-word">
        {content || 'Actionable task stub...'}
      </div>

      {/* 🎯 Elegant Amber STUB indicator nested safely inside the component context */}
      <div className="absolute top-0 right-0 bg-amber-950/90 border-l border-b border-amber-500/30 backdrop-blur-sm px-1.5 py-0.5 rounded-bl text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider select-none shadow-sm">
        Stub
      </div>
    </div>
  );
};

export default StubPreview;
