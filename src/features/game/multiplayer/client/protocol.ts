import type { FacingIndex } from '../../facing';
import type { ItemId } from '@/features/asset-library/asset';

export const PROTOCOL_VERSION = 6;

export const Op = {
  Order: 1,
  Turn: 2,
  Jump: 3,
  Snapshot: 10,
  Creatures: 11,
} as const;

export const JUMP_IN_PLACE = -1;

export type OrderMsg = [typeof Op.Order, number, number];
export type TurnMsg = [typeof Op.Turn, number];
export type JumpMsg = [typeof Op.Jump, number];

export type SnapshotRow = [number, number, number, number, number, number];
export type SnapshotMsg = [typeof Op.Snapshot, number, SnapshotRow[]];

export type CreatureRow = [number, number, number, number, number, number, number];
export type CreaturesMsg = [typeof Op.Creatures, number, CreatureRow[]];

export type EntityKind = 'player' | 'agent';
export type KickCode = 'version' | 'duplicate' | 'backpressure' | 'abuse';

export interface HelloMsg {
  t: 'hello';
  v: number;
}

export interface WelcomeMsg {
  t: 'welcome';
  id: number;
  x: number;
  y: number;
  facing: FacingIndex;
}

export interface EntityMetaMsg {
  t: 'entityMeta';
  id: number;
  name: string;
  kind: EntityKind;
}

export interface SayMsg {
  t: 'say';
  text: string;
}

export interface SaidMsg {
  t: 'said';
  id: number;
  text: string;
}

export interface DocChangedMsg {
  t: 'docChanged';
  name: string;
  revision: string;
}

export interface KickMsg {
  t: 'kick';
  code: KickCode;
  message: string;
}

export interface UseMsg {
  t: 'use';
}

export interface ResetRoomMsg {
  t: 'resetRoom';
}

export interface AttackMsg {
  t: 'attack';
}

export interface TookDropMsg {
  t: 'tookDrop';
  x: number;
  y: number;
  itemId: ItemId;
}

export interface CombatMsg {
  t: 'combat';
  text: string;
}

export interface SlainMsg {
  t: 'slain';
  keys: string[];
  all?: boolean;
}

export interface DroppedMsg {
  t: 'dropped';
  drops: Array<[number, number, ItemId]>;
}

export interface PuzzlesMsg {
  t: 'puzzles';
  on: string[];
  crates: Array<[string, number, number]>;
}

export type ClientMsg =
  | HelloMsg
  | SayMsg
  | OrderMsg
  | TurnMsg
  | JumpMsg
  | UseMsg
  | ResetRoomMsg
  | AttackMsg
  | TookDropMsg;
export type ServerMsg =
  | WelcomeMsg
  | EntityMetaMsg
  | SaidMsg
  | DocChangedMsg
  | KickMsg
  | SnapshotMsg
  | CreaturesMsg
  | PuzzlesMsg
  | CombatMsg
  | SlainMsg
  | DroppedMsg;
