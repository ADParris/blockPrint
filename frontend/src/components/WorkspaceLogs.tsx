import React, { useEffect, useState } from 'react';
import { LuActivity } from 'react-icons/lu';
import { BaseElement, type BaseElementType } from '../state/types';
import { useProjectStore } from '../state/useProjectStore';
import { formatTimeAgo } from '../utils/formatTimeAgo';

interface WorkspaceLogsProps {
  projectId: string;
}

const WorkspaceLogs: React.FC<WorkspaceLogsProps> = ({ projectId }) => {
  // 1. Subscribe atomically to the central history log record array
  const changeLog = useProjectStore((state) => state.changeLog);
  const activeLogs = changeLog[projectId] || [];

  // 2. Local ticker state to keep time-ago strings ticking dynamically
  const [, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTicker((t) => t + 1), 15000); // Re-render every 15s
    return () => clearInterval(interval);
  }, []);

  // 3. Map action types cleanly to status dot indicator borders
  const getIndicatorColor = (targetType: BaseElementType) => {
    if (targetType === BaseElement.Project) return 'bg-amber-500';
    if (targetType === BaseElement.Page) return 'bg-emerald-500';
    return 'bg-blue-500'; // Blocks sit comfortably in clean blue
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 h-full min-h-80 shadow-lg">
      {/* Container Header */}
      <div className="flex items-center space-x-2 text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-800/80 pb-3 select-none">
        <LuActivity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>Workspace Logs</span>
      </div>

      {/* Main Stream Loop */}
      <div className="space-y-4 max-h-100 overflow-y-auto custom-scrollbar pr-1">
        {activeLogs.length === 0 ? (
          <div className="text-xs text-slate-600 italic pl-1 py-4">
            No recent board activities. Project is steady, enjoy your coffee.
          </div>
        ) : (
          activeLogs.map((log) => (
            <div key={log.id} className="flex space-x-3 text-xs animate-fadeIn">
              {/* Dynamic Action Target Indicator */}
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${getIndicatorColor(
                  log.targetType,
                )} shadow-[0_0_8px_rgba(59,130,246,0.2)]`}
              />
              <div className="flex-1 space-y-0.5">
                <div className="text-slate-300">
                  <span className="font-semibold text-slate-200">
                    {log.userName}
                  </span>{' '}
                  updated{' '}
                  <span className="font-medium text-sky-400">
                    {log.targetName}
                  </span>
                </div>
                {log.details && (
                  <p className="text-slate-400 text-[11px] font-sans italic">
                    {log.details}
                  </p>
                )}
                <p className="text-slate-500 text-[10px] font-mono tracking-tight">
                  {formatTimeAgo(log.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkspaceLogs;
