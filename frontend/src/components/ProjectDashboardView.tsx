// src/components/ProjectDashboardView.tsx
import React from 'react';
import {
  LuActivity,
  LuClock,
  LuFileText,
  LuLayers,
  LuSquareCheck,
} from 'react-icons/lu';
import { useProjectStore } from '../state/useProjectStore';

interface WorkspaceLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'success' | 'info' | 'warning';
}

export const ProjectDashboardView: React.FC = () => {
  const { projects, activeProjectId, pages } = useProjectStore(
    (state) => state,
  );

  // Find the active project instance details
  const project = projects.find((p) => p.id === activeProjectId);
  const projectPages = activeProjectId ? pages[activeProjectId] || [] : [];

  const statusDotColors = {
    success: 'bg-emerald-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  const dummyLogs: WorkspaceLog[] = [
    {
      id: 'log-1',
      message: 'Project workspace initialized',
      timestamp: 'Just now',
      type: 'success',
    },
    {
      id: 'log-2',
      message: 'Sidebar architecture optimized',
      timestamp: 'A few minutes ago',
      type: 'info',
    },
  ];

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
        Select a project from the sidebar to view its dashboard.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0b0f19] text-slate-100 p-8 custom-scrollbar animate-fadeIn">
      {/* Dashboard Header Header */}
      <div className="border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center space-x-3 text-xs font-semibold tracking-wider text-blue-400 uppercase mb-2">
          <LuLayers className="w-4 h-4" />
          <span>Project Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {project.name}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Welcome to your brand new workspace layout. Manage pages, tracks, and
          active items below.
        </p>
      </div>

      {/* Main Two Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns (Spans 2 layout lanes) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                <LuSquareCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-200">
                  {projectPages.length}
                </div>
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Total Pages
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 flex items-center space-x-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <LuClock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-200">Active</div>
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Workspace Status
                </div>
              </div>
            </div>
          </div>

          {/* Section: Project Content Explorer */}
          <div className="bg-slate-900/20 border border-slate-800/60 rounded-xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Project Pages Index
            </h3>
            {projectPages.length === 0 ? (
              <div className="text-xs text-slate-600 italic py-4">
                No sub-pages configured under this project deck.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {projectPages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <LuFileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-300 truncate hover:text-blue-400 cursor-pointer">
                        {page.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      Document Block
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Spans 1 layout lane) */}
        <div className="space-y-6">
          {/* Activity / Feed Stream Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 h-full min-h-80">
            <div className="flex items-center space-x-2 text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-800/80 pb-3">
              <LuActivity className="w-4 h-4 text-emerald-400" />
              <span>Workspace Logs</span>
            </div>

            <div className="space-y-4">
              {dummyLogs.map((log) => (
                <div key={log.id} className="flex space-x-3 text-xs">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${statusDotColors[log.type]}`}
                  />
                  <div>
                    <p className="text-slate-300 font-medium">{log.message}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {log.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
