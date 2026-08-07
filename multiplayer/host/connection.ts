import type { WebSocket } from 'ws';
import { encodeServer } from '../client/codec';
import type { KickCode, ServerMsg } from '../client/protocol';
import type { Entity } from '../game/entities';
import { newSayAllowance } from './sayAllowance';

export type ConnState = 'AWAITING_HELLO' | 'PLAYING';

const BACKPRESSURE_LIMIT = 1_000_000;

let nextConnId = 1;

export class Connection {
  readonly id = nextConnId++;
  state: ConnState = 'AWAITING_HELLO';
  entity: Entity | null = null;
  readonly knownEntities = new Set<number>();
  inputViolations = 0;
  readonly sayAllowance = newSayAllowance();
  alive = true;
  helloTimer?: ReturnType<typeof setTimeout>;

  constructor(readonly ws: WebSocket) {}

  send(msg: ServerMsg): void {
    if (this.ws.readyState !== this.ws.OPEN) return;
    if (this.ws.bufferedAmount > BACKPRESSURE_LIMIT) {
      this.kick('backpressure', 'outbound buffer overflow');
      return;
    }
    this.ws.send(encodeServer(msg));
  }

  kick(code: KickCode, message: string): void {
    if (this.ws.readyState === this.ws.OPEN) {
      try {
        this.ws.send(encodeServer({ t: 'kick', code, message }));
      } catch {
        this.ws.close();
        return;
      }
    }
    this.ws.close();
  }
}
