import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { soundRecipesOf, type SoundCue } from '../sound/soundCues';
import { createSoundPlayer } from '../sound/soundPlayer';
import { soundShapeOf, type SoundRecipe, type SoundShape } from '../sound/soundRecipe';
import { nodesOfKind, recordingAudioContext, type AudioRecording, type FakeNode } from './fakeAudioContext';

const PUSH_SECONDS = 0.3;

export function checkSoundRecipes(check: CheckReporter): void {
  const rolled = Math.random;
  Math.random = () => 0.5;
  try {
    checkStepsKeepChanging(check);
    checkPushHasWeightAndAnEnd(check);
    checkSurfacesSoundApart(check);
    checkEveryCueReachesBothRooms(check);
  } finally {
    Math.random = rolled;
  }
}

function checkStepsKeepChanging(check: CheckReporter): void {
  const recipe = soundRecipesOf().step;
  const walked = Array.from({ length: 5 }, () => traceOf(playedThrough(recipe, {})));
  check('five footfalls in a row are five different sounds', new Set(walked).size === walked.length);
  const gathering = [0, 0.5, 1].map((effort) => traceOf(playedThrough(soundRecipesOf().step, { effort })));
  check('a step under momentum is not the step that started the run', new Set(gathering).size === 3);
  const slow = playedThrough(soundRecipesOf().step, { seconds: 0.15 });
  const long = playedThrough(soundRecipesOf().step, { seconds: 0.4 });
  check('the scuff stretches to the length of the move', lastStopIn(long) > lastStopIn(slow));
}

function checkPushHasWeightAndAnEnd(check: CheckReporter): void {
  const push = playedThrough(soundRecipesOf().push, { seconds: PUSH_SECONDS });
  const sustained = push.nodes.filter((node) => node.startedAt === 0 && (node.stoppedAt ?? 0) >= PUSH_SECONDS);
  const thud = push.nodes.filter((node) => (node.startedAt ?? -1) >= PUSH_SECONDS);
  check('a push grinds for the whole shove', sustained.length >= 3);
  check('a push resolves in a thud once the crate has arrived', thud.length >= 2);
  check('the grind holds its level rather than decaying on contact', push.nodes.some(holdsItsPeak));
  const longer = playedThrough(soundRecipesOf().push, { seconds: PUSH_SECONDS * 2 });
  const settlesAt = (recording: AudioRecording): number =>
    Math.min(...recording.nodes.filter((node) => (node.startedAt ?? -1) >= PUSH_SECONDS).map((node) => node.startedAt!));
  check('the thud waits for a longer shove', settlesAt(longer) >= PUSH_SECONDS * 2);
  const heavier = playedThrough(soundRecipesOf().push, { seconds: PUSH_SECONDS, effort: 1 });
  check('a crate shoved at speed lands harder', voiceWeightIn(heavier) > voiceWeightIn(push));
}

function checkSurfacesSoundApart(check: CheckReporter): void {
  const recipes = soundRecipesOf();
  const cues: SoundCue[] = ['step', 'climb', 'crate-step', 'settle', 'jump'];
  const traces = cues.map((cue) => traceOf(playedThrough(recipes[cue], { seconds: 0.15, effort: 0.5 })));
  check('floor, ledge, crate top, stopping and landing are five sounds', new Set(traces).size === cues.length);
  check('a crate top rings drier than a stone floor', recipes['crate-step'].roomSend < recipes.step.roomSend);
  check('coming to rest rings wetter than a single step', recipes.settle.roomSend > recipes.step.roomSend);
}

function checkEveryCueReachesBothRooms(check: CheckReporter): void {
  const cues: SoundCue[] = ['step', 'climb', 'crate-step', 'settle', 'jump', 'push', 'plate', 'door', 'power'];
  const routed = cues.every((cue) => reachesBothRooms(cue, 0.5));
  check('every cue is sent into the room as well as straight out', routed);
  const tight = wideRoomSendOf('step', 0.05);
  const cavern = wideRoomSendOf('step', 0.95);
  check('a wide room takes more of the send than a tight one', cavern > tight * 5);
}

function reachesBothRooms(cue: SoundCue, roomSize: number): boolean {
  const recording = playedThroughThePlayer(cue, roomSize);
  const rooms = nodesOfKind(recording, 'convolver');
  const sends = rooms.map((room) => recording.nodes.filter((node) => node.outputs.includes(room)));
  return rooms.length === 2 && sends.every((into) => into.length === 1 && (into[0]!.settings.gain ?? 0) > 0);
}

function wideRoomSendOf(cue: SoundCue, roomSize: number): number {
  const recording = playedThroughThePlayer(cue, roomSize);
  const wide = nodesOfKind(recording, 'convolver')[1]!;
  return recording.nodes.find((node) => node.outputs.includes(wide))!.settings.gain ?? 0;
}

function playedThroughThePlayer(cue: SoundCue, roomSize: number): AudioRecording {
  const recordings: AudioRecording[] = [];
  const priorAudio = Reflect.get(globalThis, 'AudioContext');
  const priorWindow = Reflect.get(globalThis, 'window');
  Reflect.set(globalThis, 'AudioContext', function FakeAudioContext() {
    const recording = recordingAudioContext();
    recordings.push(recording);
    return recording.context;
  });
  Reflect.set(globalThis, 'window', { addEventListener: () => undefined, removeEventListener: () => undefined });
  try {
    const player = createSoundPlayer();
    player.play(cue, { roomSize });
    player.dispose();
    return recordings[0]!;
  } finally {
    Reflect.set(globalThis, 'AudioContext', priorAudio);
    Reflect.set(globalThis, 'window', priorWindow);
  }
}

function playedThrough(recipe: SoundRecipe, parts: Partial<SoundShape>): AudioRecording {
  const recording = recordingAudioContext();
  const out = recording.context.createGain();
  const noise = recording.context.createBuffer(1, 64, 48000);
  recipe.play(recording.context, noise, out, soundShapeOf(parts));
  return recording;
}

function holdsItsPeak(node: FakeNode): boolean {
  const rose = node.events.find((event) => event.change === 'linear');
  return rose !== undefined && node.events.some((event) => event.change === 'set' && event.at > rose.at && event.value === rose.value);
}

function lastStopIn(recording: AudioRecording): number {
  return Math.max(0, ...recording.nodes.map((node) => node.stoppedAt ?? 0));
}

function voiceWeightIn(recording: AudioRecording): number {
  return recording.nodes
    .flatMap((node) => node.events.filter((event) => event.param === 'gain' && event.change === 'linear'))
    .reduce((total, event) => total + event.value, 0);
}

function traceOf(recording: AudioRecording): string {
  return recording.nodes
    .map((node) => `${node.kind}/${node.shape}/${round(node.startedAt)}/${round(node.stoppedAt)}/${eventsOf(node)}`)
    .join('|');
}

function eventsOf(node: FakeNode): string {
  return node.events.map((event) => `${event.param}:${event.change}:${round(event.value)}@${round(event.at)}`).join(',');
}

function round(value: number | null): string {
  return value === null ? '-' : value.toFixed(4);
}
