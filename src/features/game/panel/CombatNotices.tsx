import { useEffect, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { CombatFeed, CombatNotice } from '@/features/game/chat/combatFeed';

const NOTICE_LIFETIME_MS = 4000;

export function CombatNotices() {
  const { combatFeed } = useAppRuntime();
  const notices = useSyncExternalStore(combatFeed.subscribe, combatFeed.recent);
  useForgetNoticesAfterAWhile(combatFeed, notices);
  if (notices.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {notices.map((notice) => (
        <span key={notice.id} className="rounded bg-black/70 px-2 py-0.5 text-[11px] text-danger-ink">
          {notice.text}
        </span>
      ))}
    </div>
  );
}

function useForgetNoticesAfterAWhile(feed: CombatFeed, notices: readonly CombatNotice[]): void {
  useEffect(() => {
    const timers = notices.map((notice) =>
      window.setTimeout(() => feed.forget(notice), NOTICE_LIFETIME_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [feed, notices]);
}
