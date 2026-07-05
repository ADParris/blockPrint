import React from 'react';
import { LuClock, LuFileText, LuLayers, LuSquareCheck } from 'react-icons/lu';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../../state/useProjectStore';
import { paths } from '../../utils/routes';
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
    <div className="h-full w-full overflow-y-auto bg-[#0b0f19] text-slate-100 p-8 custom-scrollbar animate-fadeIn">
      {/* Dashboard Header */}
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
        {/* Left Columns */}
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
                  <Link
                    key={page.id}
                    to={paths.pageDocument(
                      namespace || 'ADParris',
                      projectId!,
                      page.id,
                    )}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group transition-colors"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <LuFileText className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                      <span className="text-sm font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">
                        {page.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      Document Block
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 🎯 THE REFACTOR PAYOFF: Pure component extraction hook! */}
          <WorkspaceLogs projectId={projectId!} />
        </div>
      </div>
    </div>
  );
};
