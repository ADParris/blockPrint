// src/components/Previews/ImagePreview.tsx
import { useImageBlob } from '../../hooks/useImageBlob'; // Adjust to matching relative path

interface ImagePreviewProps {
  blockId: string;
  content: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ blockId, content }) => {
  // Use your same unified data layer hook to resolve the URL from local memory
  const { previewUrl, isAssetLoading } = useImageBlob(blockId, content);

  return (
    <div className="w-full h-full rounded bg-surface border border-line overflow-hidden relative flex items-center justify-center">
      {previewUrl ? (
        <>
          {/* Ambient background blur layer just like your document view */}
          <img
            src={previewUrl}
            alt=""
            className="absolute inset-0 z-0 w-full h-full object-cover blur-md brightness-150 opacity-30 scale-125 select-none pointer-events-none"
          />
          {/* Crisp foreground containing thumbnail */}
          <img
            src={previewUrl}
            alt="Preview"
            className="relative z-10 max-w-[94%] max-h-[94%] object-contain rounded shadow-sm opacity-90 select-none pointer-events-none"
          />
        </>
      ) : (
        <span className="text-xs text-slate-600 font-medium select-none">
          {isAssetLoading ? 'Loading asset...' : 'No Image Asset'}
        </span>
      )}

      <div className="absolute top-0 right-0 bg-fg-blue/20 border-l border-b border-fg-blue backdrop-blur-sm px-1.5 py-0.5 rounded-bl text-[10px] text-fg-blue font-medium select-none z-20">
        IMG
      </div>
    </div>
  );
};

export default ImagePreview;
