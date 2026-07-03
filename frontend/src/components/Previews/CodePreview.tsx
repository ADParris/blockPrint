// src/components/Previews/CodePreview.tsx
import React from 'react';

interface CodePreviewProps {
  content?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ content }) => {
  return (
    <div className="w-full h-full bg-[#1e1e1e] rounded-xl p-2 font-mono text-[11px] text-slate-300 leading-normal overflow-hidden relative">
      <pre className="whitespace-pre-wrap break-all select-none opacity-85">
        {content || '// Empty code block...'}
      </pre>
      <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-[#1e1e1e] to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 bg-slate-900/90 border-l border-b border-slate-700/60 backdrop-blur-sm px-1.5 py-0.5 rounded-bl text-[10px] text-emerald-400 font-medium select-none">
        CODE
      </div>
    </div>
  );
};

export default CodePreview;
