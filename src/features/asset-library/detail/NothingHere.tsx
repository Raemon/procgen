import { HINT_CLASSES } from '@/features/app-shell/controls/fieldClasses';

export function NothingHere({ what }: { what: string }) {
  return (
    <p className={HINT_CLASSES}>
      That {what} is gone. Pick something else in the library and it opens here.
    </p>
  );
}
