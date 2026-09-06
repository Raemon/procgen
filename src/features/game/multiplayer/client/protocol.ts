import type { FacingIndex } from '../../facing';

export const PROTOCOL_VERSION = 6;

export const Op = {
  Order: 1,
  Turn: 2,
  Jump: 3,
  Snapshot: 10,
} as const;

export const JUMP_IN_PLACE = -1;

export type OrderMsg = [typeof Op.Order, number, number];
export type TurnMsg = [typeof Op.Turn, number];
export type JumpMsg = [typeof Op.Jump, number];

export type SnapshotRow = [number, number, number, number, number, number];
export type SnapshotMsg = [typeof Op.Snapshot, number, SnapshotRow[]];

export type EntityKind = 'player' | 'agent';
export type KickCode = 'version' | 'duplicate' | 'backpressure' | 'abuse' | 'no_such_instance';

export interface HelloMsg {
  t: 'hello';
  v: number;
  instance?: string;
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

export interface VerbMsg {
  t: 'verb';
  action: string;
  params?: Record<string, unknown>;
}

export interface SharedMsg {
  t: 'shared';
  states: Record<string, unknown>;
}

export interface BuildingMsg {
  t: 'building';
  fraction: number;
  stage: string;
  elapsedMs: number;
}

export type ClientMsg = HelloMsg | SayMsg | OrderMsg | TurnMsg | JumpMsg | VerbMsg;
export type ServerMsg =
  | WelcomeMsg
  | EntityMetaMsg
  | SaidMsg
  | DocChangedMsg
  | KickMsg
  | SnapshotMsg
  | SharedMsg
  | BuildingMsg;
