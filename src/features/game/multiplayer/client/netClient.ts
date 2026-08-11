import { decodeServer, encodeClient } from './codec';
import {
  Op,
  PROTOCOL_VERSION,
  type ClientMsg,
  type EntityMetaMsg,
  type HelloMsg,
  type KickMsg,
  type SaidMsg,
  type ServerMsg,
  type SnapshotRow,
  type WelcomeMsg,
} from './protocol';
import { Backoff } from './backoff';

export type NetStatus = 'connecting' | 'online' | 'reconnecting' | 'kicked';

export interface NetHandlers {
  onStatus(status: NetStatus): void;
  onWelcome(msg: WelcomeMsg): void;
  onSnapshot(tick: number, rows: SnapshotRow[]): void;
  onEntityMeta(msg: EntityMetaMsg): void;
  onSaid(msg: SaidMsg): void;
  onDocChanged(name: string, revision: string): void;
  onKick(msg: KickMsg): void;
}

export class NetClient {
  private ws: WebSocket | null = null;
  private readonly backoff = new Backoff();
  private reconnectTimer = 0;
  private closedByUser = false;

  constructor(private readonly handlers: NetHandlers) {}

  connect(): void {
    this.closedByUser = false;
    this.open();
  }

  close(): void {
    this.closedByUser = true;
    this.clearReconnect();
    if (!this.ws) return;
    this.ws.onclose = null;
    this.ws.close();
    this.ws = null;
  }

  sendOrder(kind: number, dir: number): void {
    this.send([Op.Order, kind, dir]);
  }

  sendTurn(eighthTurns: number): void {
    this.send([Op.Turn, eighthTurns]);
  }

  sendSay(text: string): void {
    this.send({ t: 'say', text });
  }

  private open(): void {
    this.handlers.onStatus('connecting');
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${proto}://${location.host}/api/v1/game/socket`);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => this.sendHello(ws);
    ws.onmessage = (ev: MessageEvent) => {
      const msg = decodeServer(typeof ev.data === 'string' ? ev.data : '');
      if (msg) this.dispatch(msg);
    };
    ws.onclose = () => {
      if (this.closedByUser) return;
      this.handlers.onStatus('reconnecting');
      this.scheduleReconnect();
    };
    ws.onerror = () => undefined;
  }

  private sendHello(ws: WebSocket): void {
    this.backoff.reset();
    const hello: HelloMsg = { t: 'hello', v: PROTOCOL_VERSION };
    ws.send(encodeClient(hello));
  }

  private dispatch(msg: ServerMsg): void {
    if (Array.isArray(msg)) {
      if (msg[0] === Op.Snapshot) this.handlers.onSnapshot(msg[1], msg[2]);
      return;
    }
    if (msg.t === 'welcome') return this.acceptWelcome(msg);
    if (msg.t === 'entityMeta') return this.handlers.onEntityMeta(msg);
    if (msg.t === 'said') return this.handlers.onSaid(msg);
    if (msg.t === 'docChanged') return this.handlers.onDocChanged(msg.name, msg.revision);
    if (msg.t === 'kick') return this.acceptKick(msg);
  }

  private acceptWelcome(msg: WelcomeMsg): void {
    this.handlers.onStatus('online');
    this.handlers.onWelcome(msg);
  }

  private acceptKick(msg: KickMsg): void {
    this.closedByUser = true;
    this.handlers.onStatus('kicked');
    this.handlers.onKick(msg);
    this.close();
  }

  private send(msg: ClientMsg): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(encodeClient(msg));
  }

  private scheduleReconnect(): void {
    if (this.closedByUser) return;
    this.reconnectTimer = window.setTimeout(() => this.open(), this.backoff.next());
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = 0;
  }
}
