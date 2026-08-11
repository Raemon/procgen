import { sanitizeChatText } from '@/features/game/chat/sanitizeChatText';
import { speechBubbleLifetimeMs } from '@/features/game/chat/speechBubbleLifetime';
import { SpeechBubbles } from '@/features/game/chat/speechBubbles';

checkOnlyTheLastFewLinesPerSpeakerSurvive();
checkSpeakersLeavingTakeTheirLinesWithThem();
checkLinesExpireOnTheirOwn();
checkLongLinesLingerLongerButAreCapped();
checkSanitizerMatchesTheProtocolLimit();
console.log('speech bubble store: all checks passed');

function checkOnlyTheLastFewLinesPerSpeakerSurvive(): void {
  const bubbles = new SpeechBubbles();
  for (const text of ['one', 'two', 'three', 'four']) bubbles.add(7, text);
  assert(
    bubbles.linesFor(7).join('|') === 'two|three|four',
    'a speaker shows its three most recent lines',
  );
}

function checkSpeakersLeavingTakeTheirLinesWithThem(): void {
  const bubbles = new SpeechBubbles();
  bubbles.add(1, 'still here');
  bubbles.add(2, 'gone');
  bubbles.retainSpeakers(new Set([1]));
  assert(bubbles.speakerIds().join() === '1', 'a speaker missing from the snapshot is forgotten');
  assert(bubbles.linesFor(2).length === 0, 'the departed speaker has no lines left');
}

function checkLinesExpireOnTheirOwn(): void {
  const bubbles = new SpeechBubbles();
  bubbles.add(3, 'fading');
  const realNow = Date.now;
  Date.now = () => realNow() + speechBubbleLifetimeMs('fading') + 1;
  const lines = bubbles.linesFor(3);
  Date.now = realNow;
  assert(lines.length === 0, 'a line disappears once its lifetime is up');
  assert(bubbles.speakerIds().length === 0, 'an expired speaker leaves nothing behind');
}

function checkLongLinesLingerLongerButAreCapped(): void {
  assert(
    speechBubbleLifetimeMs('hi') < speechBubbleLifetimeMs('a much longer sentence to read'),
    'longer lines stay up longer',
  );
  assert(speechBubbleLifetimeMs('x'.repeat(1000)) === 9000, 'lifetime is capped');
}

function checkSanitizerMatchesTheProtocolLimit(): void {
  assert(sanitizeChatText('  hello\n\tworld  ') === 'hello world', 'whitespace is normalized');
  assert(sanitizeChatText(42) === '', 'non-strings sanitize to nothing');
  assert(sanitizeChatText('y'.repeat(500)).length === 140, 'text is cut to the protocol limit');
}

function assert(condition: boolean, what: string): void {
  if (!condition) throw new Error(`check failed: ${what}`);
  console.log(`  ok — ${what}`);
}
