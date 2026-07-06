// --- src/components/ActivityFeedCard.tsx ---
import React from 'react';
import {
  ActivityFeedItems,
  type ActivityFeedItemsType,
} from '../../state/types';

interface ActivityFeedCardProps {
  type: ActivityFeedItemsType;
  userName: string;
  timestampStr: string;
  content: string;
  targetPageTitle?: string | null;
  isClickable: boolean;
}

const ActivityFeedCard: React.FC<ActivityFeedCardProps> = ({
  type,
  userName,
  timestampStr,
  content,
  targetPageTitle,
  isClickable,
}) => {
  const isStub = type === ActivityFeedItems.Stub;
  const isChat = type === ActivityFeedItems.Chat;

  // 🎯 Dynamic theme mapping for borders, background tints, and hover states
  const cardBorderClass = isStub
    ? isClickable
      ? 'border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/60 shadow-amber-950/5'
      : 'border-amber-500/20 bg-amber-500/[0.01]'
    : isChat
      ? isClickable
        ? 'border-emerald-500/30 bg-emerald-500/[0.02] hover:border-emerald-500/60 shadow-emerald-950/5'
        : 'border-emerald-500/20 bg-emerald-500/[0.01]'
      : isClickable // Fallback default to NOTE style
        ? 'border-sky-500/30 bg-sky-500/[0.02] hover:border-sky-500/60 shadow-sky-950/5'
        : 'border-sky-500/20 bg-sky-500/[0.01]';

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 my-3 rounded-lg border transition-all duration-200 group ${cardBorderClass}`}
    >
      {/* 🎯 Absolute Corner Pill: Fixed 3-way color splitter */}
      <div
        className={`absolute -top-2.5 right-4 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm select-none
          ${
            isStub
              ? 'bg-amber-950/90 text-amber-400 border-amber-600/30'
              : isChat
                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-600/30'
                : 'bg-sky-950/90 text-sky-400 border-sky-600/30'
          }`}
      >
        {type}
      </div>

      {/* Meta Top Line Row */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-300">{userName}</span>
        <span className="text-[10px] font-mono text-slate-500">
          {timestampStr}
        </span>
      </div>

      {/* Content Text Line */}
      <p className="text-sm text-slate-100 font-sans leading-relaxed wrap-break-word pr-12">
        {content}
      </p>

      {/* Dynamic Link footer string */}
      {isClickable && targetPageTitle && (
        <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors w-fit">
          <span className="text-emerald-400 text-[10px]">⚡</span>
          <span>Context Link →</span>
          <span className="underline decoration-slate-600 group-hover:decoration-blue-500/50 transition-colors">
            {targetPageTitle}
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivityFeedCard;
