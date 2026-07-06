import React, { useMemo, useState } from 'react';
import {
  ActivityFeedItems,
  type ActivityFeedItem,
  type ActivityFeedItemsType,
} from '../../state/types';
import { useProjectStore } from '../../state/useProjectStore';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import ActivityFeedCard from './ActivityFeedCard';

interface ActivityFeedProps {
  projectId: string;
}

const EMPTY_ARRAY: ActivityFeedItem[] = [];

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ projectId }) => {
  const [inputValue, setInputValue] = useState('');

  // Grab state slices dynamically
  const activityFeedItems = useProjectStore(
    (state) => state.activityFeedItems[projectId] || EMPTY_ARRAY,
  );

  const addActivityFeedItem = useProjectStore(
    (state) => state.addActivityFeedItem,
  );

  const currentProject = useProjectStore((state) =>
    state.projects.find((p) => p.id === projectId),
  );

  // Determine mode based on your metadata: null groupId means Personal Vault project
  const isTeamProject = currentProject?.groupId !== null;

  // Chronological Sort: Newest at the top (Facebook/Timeline style)
  const sortedFeed = useMemo(() => {
    return [...activityFeedItems].sort((a, b) => b.timestamp - a.timestamp);
  }, [activityFeedItems]);

  const handleSubmit = (e: React.FormEvent) => {
    // 💡 Also fixed: use React.FormEvent for general compatibility
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 🎯 FORCE input box entries to always be logged as CHAT type messages
    const itemType: ActivityFeedItemsType = ActivityFeedItems.Chat;

    addActivityFeedItem(projectId, inputValue.trim(), itemType);
    setInputValue('');
  };

  const handleItemClick = (item: ActivityFeedItem) => {
    if (!item.targetPageId || !item.targetBlockId) return;

    // 🎯 WARP MECHANISM COUPLING GOES HERE
    console.log(
      `Warping to Page: ${item.targetPageId}, Block: ${item.targetBlockId}`,
    );

    // In your main view slice, you will handle:
    // 1. setWorkspaceViewMode(WorkspaceViewMode.PageDocument / PageCanvas)
    // 2. setActivePageId(item.targetPageId)
    // 3. setActiveBlockId(item.targetBlockId)
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
      {/* Feed Card Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <h3 className="font-semibold text-sm tracking-wide text-slate-400 uppercase">
          {isTeamProject
            ? '🎯 Team Collaboration Stream'
            : '📝 Project Context & Notes'}
        </h3>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
          {isTeamProject ? 'Team Room' : 'Personal Log'}
        </span>
      </div>

      {/* Independent Scrollable Timeline Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {sortedFeed.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm py-8 text-center">
            <p>No timeline updates recorded yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              {isTeamProject
                ? 'Send a broadcast message to your team below.'
                : 'Drop inline block stubs or scratch notes to map out your tasks.'}
            </p>
          </div>
        ) : (
          sortedFeed.map((item) => {
            const isClickable = !!(item.targetPageId && item.targetBlockId);

            return (
              <div
                key={item.id}
                onClick={() => isClickable && handleItemClick(item)}
                className={isClickable ? 'cursor-pointer' : ''}
              >
                <ActivityFeedCard
                  type={item.type}
                  userName={item.userName || 'ADParris'}
                  timestampStr={formatTimeAgo(item.timestamp)}
                  content={item.content}
                  targetPageTitle={item.targetPageTitle}
                  isClickable={isClickable}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Persistent Bottom Submission Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-800 bg-slate-900/40"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isTeamProject
              ? 'Broadcast a message to the team workspace...'
              : 'Type a central project reminder or scratch note...'
          }
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500"
        />
      </form>
    </div>
  );
};
