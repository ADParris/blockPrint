// src/components/Sidebar/SidebarLayoutToggle.tsx
import React from 'react';
import { LuFileBox, LuFileSliders, LuFileText } from 'react-icons/lu';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import Button from '../Button';

export const SidebarLayoutToggle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🎯 1. Read layout targets straight from the active browser address bar parameters
  const { namespace, projectId, pageId } = useParams<{
    namespace: string;
    projectId?: string;
    pageId?: string;
  }>();

  // 🎯 2. Atomic Selector Subscriptions to enforce stable render performance
  const pages = useProjectStore((state) => state.pages);
  const currentUser = useProjectStore((state) => state.currentUser);

  // 3. Resolve if a page layout is actively selected using the current path parameters
  const activePage =
    projectId && pageId && pages[projectId]
      ? pages[projectId].find((p) => p.id === pageId)
      : null;

  // If there's no active page selection context in the URL, keep the view controller hidden
  if (!activePage || !projectId || !pageId) return null;

  const targetNamespace = namespace || currentUser?.name || 'ADParris';

  // 🎯 4. Check the end of the pathname to dynamically highlight the active toggle mode
  const currentPath = location.pathname;
  const isCanvas =
    currentPath.endsWith(`/pages/${pageId}`) || currentPath.endsWith('/canvas');
  const isKanban =
    currentPath.endsWith('/roadmap') || currentPath.endsWith('/kanban');
  const isDocument = !isCanvas && !isKanban; // Fallback to default Document node view

  const handleDocumentClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.pageDocument(targetNamespace, projectId, pageId));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.pageCanvas(targetNamespace, projectId, pageId));
  };

  const handleKanbanClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(paths.pageKanban(targetNamespace, projectId, pageId), {
      state: { from: 'document' },
    });
  };

  const iconClassNames = 'h-10 w-10';

  const viewToggleButtons = [
    {
      label: 'document',
      isActive: isDocument,
      onClick: handleDocumentClick,
      icon: <LuFileText className={iconClassNames} />,
    },
    {
      label: 'canvas',
      isActive: isCanvas,
      onClick: handleCanvasClick,
      icon: <LuFileBox className={iconClassNames} />,
    },
    {
      label: 'kanban',
      isActive: isKanban,
      onClick: handleKanbanClick,
      icon: <LuFileSliders className={iconClassNames} />,
    },
  ];

  const baseClassNames =
    'border border-line flex flex-col items-center justify-between p-1 rounded-md shadow-md';

  const renderedButtons = viewToggleButtons.map(
    ({ label, isActive, onClick, icon }) => (
      <Button key={label} onClick={onClick}>
        <span
          className={`${baseClassNames} ${
            isActive
              ? 'bg-accent-blue text-surface'
              : 'text-accent-blue/60 group-hover/button:text-accent-blue'
          }`}
        >
          {icon}
        </span>
      </Button>
    ),
  );

  return (
    <div>
      <p className="flex justify-center text-sm font-bold text-fg-muted uppercase tracking-wide mb-4">
        Workspace View
      </p>
      <div className="flex justify-between px-3">{renderedButtons}</div>
    </div>
  );
};
