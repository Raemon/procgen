import { useEffect, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import type { PickupFeed, PickupNotice } from '@/features/asset-library/items/pickups/pickupFeed';
import { classes } from '@/features/app-shell/controls/classes';

const NOTICE_LIFETIME_MS = 2600;

export function PickupNotices() {
  const { pickupFeed } = useAppRuntime();
  const notices = useSyncExternalStore(pickupFeed.subscribe, pickupFeed.recent);
  useForgetNoticesAfterAWhile(pickupFeed, notices);
  if (notices.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {notices.map((notice) => (
        <span
          key={notice.id}
          className={classes(
            'rounded bg-black/70 px-2 py-0.5 text-[11px]',
            notice.tone === 'taken' ? 'text-ink' : 'text-danger-ink',
          )}
        >
          {notice.text}
        </span>
      ))}
    </div>
  );
}

function useForgetNoticesAfterAWhile(feed: PickupFeed, notices: readonly PickupNotice[]): void {
  useEffect(() => {
    const timers = notices.map((notice) =>
      window.setTimeout(() => feed.forget(notice), NOTICE_LIFETIME_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [feed, notices]);
}
