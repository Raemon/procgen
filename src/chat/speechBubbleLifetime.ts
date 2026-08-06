const READING_TIME_PER_CHAR_MS = 45;
const MINIMUM_LIFETIME_MS = 3000;
const MAXIMUM_LIFETIME_MS = 9000;

export function speechBubbleLifetimeMs(text: string): number {
  const reading = MINIMUM_LIFETIME_MS + text.length * READING_TIME_PER_CHAR_MS;
  return Math.min(MAXIMUM_LIFETIME_MS, reading);
}
