import React from 'react';
import { LuPlus } from 'react-icons/lu';
import Button from '../Button';

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
    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-fg px-2">
      <div className="flex items-center space-x-1.5">
        <Icon className="w-3.5 h-3.5 text-fg" />
        <span>{title}</span>
      </div>
      <Button onClick={onActionClick}>
        <LuPlus className="w-4 h-4 text-fg/40 group-hover/button:text-fg transition-colors" />
      </Button>
    </div>
  );
};

export default SidebarSectionHeader;
