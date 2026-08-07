import type { FacingIndex } from '../../world/facing';

export const PROTOCOL_VERSION = 3;

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
  name: string;
  token?: string;
}

export interface WelcomeMsg {
  t: 'welcome';
  id: number;
  x: number;
  y: number;
  facing: FacingIndex;
  token: string;
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
}

export interface KickMsg {
  t: 'kick';
  code: KickCode;
  message: string;
}

export type ClientMsg = HelloMsg | SayMsg | OrderMsg | TurnMsg;
export type ServerMsg = WelcomeMsg | EntityMetaMsg | SaidMsg | DocChangedMsg | KickMsg | SnapshotMsg;
