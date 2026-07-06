import React from 'react';
import { LuClock, LuLayers, LuSquareCheck } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
import { ActivityFeed } from '../ActivityFeed';
import WorkspaceLogs from '../WorkspaceLogs';

export const ProjectDashboardView: React.FC = () => {
  const projects = useProjectStore((state) => state.projects);
  const pages = useProjectStore((state) => state.pages);

  const navigate = useNavigate();
  const { namespace, projectId } = useParams<{
    namespace: string;
    projectId: string;
  }>();

  const project = projects.find((p) => p.id === projectId);
  const projectPages = projectId ? pages[projectId] || [] : [];

  const handleRouteToRoadmap = () => {
    navigate(paths.projectRoadmap(namespace || 'ADParris', projectId!));
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
        Select a project from the sidebar to view its dashboard.
      </div>
    );
  }

  return (
    /* 🎯 CRITICAL UX FIX: Locked viewport height container with layout-wide overflow containment */
    <div className="h-full w-full overflow-hidden bg-[#0b0f19] text-slate-100 p-8 flex flex-col animate-fadeIn">
      {/* Dashboard Header */}
      <div className="border-b border-slate-800 pb-6 mb-6 shrink-0">
        <div className="flex items-center space-x-3 text-xs font-semibold tracking-wider text-blue-400 uppercase mb-2">
          <LuLayers className="w-4 h-4" />
          <span>Project Dashboard</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {project.name}
        </h1>
      </div>

      {/* Overview Cards (Pinned row at top, prevented from scaling down or hiding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 shrink-0">
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

        <div
          onClick={handleRouteToRoadmap}
          className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-900/60 transition-all duration-200 rounded-xl p-5 flex flex-col justify-between cursor-pointer select-none min-h-25.5"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors rounded-lg">
                <LuClock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-200 group-hover:text-white transition-colors">
                  {project.status || 'Active'}
                </div>
                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Project Status
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] tracking-wide text-slate-500 font-medium">
            <span>Pipeline Tracking</span>
            <span className="text-blue-400 font-semibold flex items-center gap-0.5 transition-colors group-hover:text-blue-300">
              View Roadmap{' '}
              <span className="transform group-hover:translate-x-0.5 transition-transform duration-200">
                →
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 🎯 LOWER GRID SECTION: Flexible, layout-locked row containers */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
        {/* Left Side: Dynamic Activity Feed replaces the index completely */}
        <div className="lg:col-span-2 h-full min-h-0">
          <ActivityFeed projectId={projectId!} />
        </div>

        {/* Right Side: Workspace Logs Column with dedicated isolated interior scrolling */}
        <div className="h-full min-h-0 flex flex-col">
          <WorkspaceLogs projectId={projectId!} />
        </div>
      </div>
    </div>
  );
};
