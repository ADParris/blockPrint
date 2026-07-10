// src/components/Previews/TextPreview.tsx
import React from 'react';

interface TextPreviewProps {
  type?: string;
  content?: string;
}

const TextPreview: React.FC<TextPreviewProps> = ({ type = 'p', content }) => {
  const textStyles: Record<string, string> = {
    h1: 'text-base font-bold tracking-tight text-fg text-center w-full whitespace-normal break-words px-4',
    h2: 'text-sm font-semibold tracking-tight text-fg text-center w-full whitespace-normal break-words px-4',
    h3: 'text-xs font-medium tracking-tight text-fg text-center w-full whitespace-normal break-words px-4',
    bullet:
      'text-xs text-fg pl-7 pr-4 relative before:content-["•"] before:absolute before:left-4 before:text-fg self-start text-left whitespace-normal break-words',
    number:
      'text-xs text-fg pl-7 pr-4 relative before:content-["1."] before:absolute before:left-4 before:font-mono before:text-fg self-start text-left whitespace-normal break-words',
  };

  const isStandardText = !type || type === 'p';
  const isLongProse = isStandardText && (content?.length ?? 0) > 60;

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden text-fg rounded-xl relative ${
        isLongProse
          ? 'items-start justify-start text-left px-2 py-1'
          : 'items-center justify-center text-center p-2'
      }`}
    >
      <div
        className={`w-full text-xs leading-relaxed whitespace-normal wrap-break-word ${
          textStyles[type] || 'text-fg'
        }`}
      >
        {content || <span className="text-fg-muted italic">Empty block</span>}
      </div>

      {isLongProse && (
        <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-surface via-surface/80 to-transparent pointer-events-none rounded-b-xl" />
      )}
    </div>
  );
};

export default TextPreview;
