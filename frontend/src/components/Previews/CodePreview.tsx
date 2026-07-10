// src/components/Previews/CodePreview.tsx
import React from 'react';

interface CodePreviewProps {
  content?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ content }) => {
  return (
    <div className="w-full h-full bg-surface-elevated rounded-xl p-2 font-mono text-[11px] text-fg leading-normal overflow-hidden relative">
      <pre className="whitespace-pre-wrap break-all select-none opacity-80">
        {content || '// Empty code block...'}
      </pre>
      <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-bg-surface to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 bg-fg-emerald/20 border-l border-b border-fg-emerald/80 backdrop-blur-sm px-1.5 py-0.5 rounded-bl text-[10px] text-fg-emerald font-medium select-none">
        CODE
      </div>
    </div>
  );
};

export default CodePreview;
