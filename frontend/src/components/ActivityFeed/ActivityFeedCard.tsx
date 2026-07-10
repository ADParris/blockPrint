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
      ? 'border-accent-amber/40 bg-accent-amber/[0.03] hover:border-accent-amber/70 shadow-accent-amber/10'
      : 'border-accent-amber/30 bg-accent-amber/[0.02]'
    : isChat
      ? isClickable
        ? 'border-accent-emerald/40 bg-accent-emerald/[0.03] hover:border-accent-emerald/70 shadow-accent-emerald/10'
        : 'border-accent-emerald/30 bg-accent-emerald/[0.02]'
      : isClickable // Fallback default to NOTE style
        ? 'border-accent-blue/40 bg-accent-blue/[0.03] hover:border-accent-blue/70 shadow-accent-blue/10'
        : 'border-accent-blue/30 bg-accent-blue/[0.02]';

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 my-3 rounded-lg border transition-all duration-200 group ${cardBorderClass}`}
    >
      {/* 🎯 Absolute Corner Pill: Fixed 3-way color splitter */}
      <div
        className={`absolute -top-2.5 right-4 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm select-none bg-surface
          ${
            isStub
              ? 'text-accent-amber border-accent-amber/60'
              : isChat
                ? 'text-accent-emerald border-accent-emerald/60'
                : 'text-accent-blue border-accent-blue/60'
          }`}
      >
        {type}
      </div>

      {/* Meta Top Line Row */}
      <div className="flex items-center justify-between text-xs text-fg-muted">
        <span className="font-medium text-fg">{userName}</span>
        <span className="text-[10px] font-mono text-fg/60">{timestampStr}</span>
      </div>

      {/* Content Text Line */}
      <p className="text-sm text-fg font-sans leading-relaxed wrap-break-word pr-12">
        {content}
      </p>

      {/* Dynamic Link footer string */}
      {isClickable && targetPageTitle && (
        <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-fg-muted group-hover:text-accent-blue transition-colors w-fit">
          <span className="text-accent-emerald text-[10px]">⚡</span>
          <span>Context Link →</span>
          <span className="underline decoration-fg/40 group-hover:decoration-accent-blue/50 transition-colors">
            {targetPageTitle}
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivityFeedCard;
