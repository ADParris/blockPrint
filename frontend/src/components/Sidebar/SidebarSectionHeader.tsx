import React from 'react';
import { LuPlus } from 'react-icons/lu';

interface SidebarSectionHeaderProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onActionClick: () => void;
}

const SidebarSectionHeader: React.FC<SidebarSectionHeaderProps> = ({
  title,
  icon: Icon,
  onActionClick,
}) => {
  return (
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
      <div className="flex items-center space-x-1.5">
        <Icon className="w-3.5 h-3.5 text-slate-600" />
        <span>{title}</span>
      </div>
      <button
        onClick={onActionClick}
        className="flex items-center justify-center w-5 h-5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors shadow-sm"
      >
        <LuPlus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default SidebarSectionHeader;
