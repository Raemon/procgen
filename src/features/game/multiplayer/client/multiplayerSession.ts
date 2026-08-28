import { sanitizeChatText } from '../../chat/sanitizeChatText';
import { SpeechBubbles } from '../../chat/speechBubbles';
import type { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { JUMP_IN_PLACE, ORDER_DIR, ORDER_NONE } from '../../sim/movementOrder';
import { stepDirIndex, type WalkabilityProbe } from '../../sim/tickMovement';
import type { FacingIndex } from '../../facing';
import type { PuzzleWorld } from '../../puzzles/puzzleWorld';
import type { World } from '../../world';
import { LocalMovementSim } from './localMovementSim';
import { NetClient, type NetStatus } from './netClient';
import type { PuzzlesMsg, SnapshotRow, WelcomeMsg } from './protocol';
import { RemotePlayers } from './remotePlayers';

const TURN_ECHO_QUIET_MS = 400;

export class MultiplayerSession {
  readonly remotePlayers = new RemotePlayers();
  readonly speech = new SpeechBubbles();
  private readonly client: NetClient;
  private readonly localSim: LocalMovementSim;
  private online = false;
  private applyingRemote = false;
  private applyingRemotePipeline = false;
  private lastLocalTurnAt = 0;
  private lastFacing: FacingIndex = 0;
  private intentDir: FacingIndex | null = null;

  constructor(
    private readonly world: World,
    private readonly store: PipelineStore,
    isWalkableAt: WalkabilityProbe,
    private readonly puzzles: PuzzleWorld,
    private readonly onPuzzlesApplied: () => void,
  ) {
    this.localSim = new LocalMovementSim(world, isWalkableAt);
    this.client = new NetClient({
      onStatus: (status) => this.acceptStatus(status),
      onWelcome: (msg) => this.acceptWelcome(msg),
      onSnapshot: (_tick, rows) => this.acceptSnapshot(rows),
      onEntityMeta: (msg) => this.remotePlayers.applyMeta(msg),
      onSaid: (msg) => this.speech.add(msg.id, msg.text),
      onDocChanged: (name, revision) => this.reloadChangedDoc(name, revision),
      onPuzzles: (msg) => this.acceptPuzzles(msg),
      onKick: (msg) => console.warn(`[net] kicked: ${msg.code} — ${msg.message}`),
    });
    this.lastFacing = world.facing;
    world.on('player-turned', () => this.reportLocalTurn());
    this.localSim.start();
  }

  connect(): void {
    this.client.connect();
  }

  disconnect(): void {
    this.client.close();
    this.acceptStatus('reconnecting');
  }

  setMoveIntent(dx: number, dy: number): void {
    const dir = stepDirIndex(dx, dy);
    if (dir === null) {
      this.clearMoveIntent();
      return;
    }
    this.intentDir = dir;
    if (this.online) this.client.sendOrder(ORDER_DIR, dir);
    else this.localSim.hold(dir);
  }

  clearMoveIntent(): void {
    this.intentDir = null;
    if (this.online) this.client.sendOrder(ORDER_NONE, 0);
    else this.localSim.release();
  }

  jump(): void {
    const dir = this.intentDir;
    if (this.online) this.client.sendJump(dir ?? JUMP_IN_PLACE);
    else this.localSim.jump(dir);
    this.world.announceJump();
  }

  isOnline(): boolean {
    return this.online;
  }

  sendUse(): void {
    this.client.sendUse();
  }

  sendResetRoom(): void {
    this.client.sendResetRoom();
  }

  say(rawText: string): void {
    const text = sanitizeChatText(rawText);
    if (text === '') return;
    if (this.online) this.client.sendSay(text);
    else this.speech.add(this.remotePlayers.selfId, text);
  }

  private acceptStatus(status: NetStatus): void {
    console.info(`[net] ${status}`);
    this.online = status === 'online';
    if (this.online) this.localSim.stop();
    else this.localSim.start();
  }

  private reportLocalTurn(): void {
    const eighthTurns = shortestEighthTurns(this.lastFacing, this.world.facing);
    this.lastFacing = this.world.facing;
    if (this.applyingRemote) return;
    this.lastLocalTurnAt = Date.now();
    if (this.online && (eighthTurns === 1 || eighthTurns === -1)) this.client.sendTurn(eighthTurns);
  }

  private acceptWelcome(msg: WelcomeMsg): void {
    this.remotePlayers.selfId = msg.id;
    this.remotePlayers.clear();
    this.speech.clear();
    this.snapToServerPose(msg.x, msg.y, msg.facing);
  }

  private acceptPuzzles(msg: PuzzlesMsg): void {
    this.puzzles.state.replaceAll({ on: msg.on, crates: msg.crates });
    this.onPuzzlesApplied();
  }

  private acceptSnapshot(rows: SnapshotRow[]): void {
    const selfRow = this.remotePlayers.applySnapshot(rows);
    this.speech.retainSpeakers(new Set(rows.map((row) => row[0])));
    if (selfRow) this.acceptSelfRow(selfRow);
  }

  private acceptSelfRow(row: SnapshotRow): void {
    const facing = this.recentlyTurnedLocally() ? this.world.facing : (row[3] as FacingIndex);
    this.snapToServerPose(row[1], row[2], facing);
  }

  private recentlyTurnedLocally(): boolean {
    return Date.now() - this.lastLocalTurnAt < TURN_ECHO_QUIET_MS;
  }

  private snapToServerPose(x: number, y: number, facing: FacingIndex): void {
    this.applyingRemote = true;
    this.world.snapTo(x, y, facing);
    this.applyingRemote = false;
  }

  private reloadChangedDoc(name: string, revision: string): void {
    if (name !== 'pipeline') return;
    void fetch('/api/v1/asset-library/worlds/current')
      .then((response) => (response.ok ? response.json() : null))
      .then((raw) => {
        const document = raw as { data?: unknown; revision?: unknown } | null;
        if (document?.revision === revision) this.applyRemotePipeline(document.data);
      })
      .catch(() => undefined);
  }

  isApplyingARemotePipeline(): boolean {
    return this.applyingRemotePipeline;
  }

  private applyRemotePipeline(raw: unknown): void {
    if (!raw) return;
    const incoming = sanitizePipeline(raw);
    if (JSON.stringify(incoming) === JSON.stringify(this.store.snapshot())) return;
    this.applyingRemotePipeline = true;
    this.store.replaceAll(incoming);
    this.applyingRemotePipeline = false;
  }
}

function shortestEighthTurns(from: FacingIndex, to: FacingIndex): number {
  const diff = (to - from + 8) % 8;
  return diff > 4 ? diff - 8 : diff;
}
