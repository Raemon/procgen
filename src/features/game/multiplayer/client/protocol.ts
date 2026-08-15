import type { FacingIndex } from '../../facing';

export const PROTOCOL_VERSION = 4;

export const Op = {
  Order: 1,
  Turn: 2,
  Snapshot: 10,
} as const;

export type OrderMsg = [typeof Op.Order, number, number];
export type TurnMsg = [typeof Op.Turn, number];

export type SnapshotRow = [number, number, number, number, number, number];
export type SnapshotMsg = [typeof Op.Snapshot, number, SnapshotRow[]];

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

export interface PuzzlesMsg {
  t: 'puzzles';
  on: string[];
  crates: Array<[string, number, number]>;
}

export type ClientMsg = HelloMsg | SayMsg | OrderMsg | TurnMsg | UseMsg | ResetRoomMsg;
export type ServerMsg =
  | WelcomeMsg
  | EntityMetaMsg
  | SaidMsg
  | DocChangedMsg
  | KickMsg
  | SnapshotMsg
  | PuzzlesMsg;
