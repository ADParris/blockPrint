import React from 'react';

interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  label,
  size = 'md',
  className = '',
}) => {
  // Map size tokens to strict tailwind dimensions
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center pointer-events-none select-none ${className}`}
    >
      {/* 🔄 Smooth spinning track with an open top quadrant */}
      <div
        className={`
          rounded-full 
          border-zinc-800 
          border-t-indigo-500 
          animate-spin 
          ease-in-out
          ${sizeClasses[size]}
        `}
      />

      {/* Optional contextual micro-copy */}
      {label && (
        <span className="text-xs text-zinc-500 font-medium mt-2.5 tracking-wide animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};

export default Loader;
