import type { Connection } from '../host/connection';

export class ChatFeed {
  constructor(private readonly connections: Set<Connection>) {}

  broadcastSaid(entityId: number, text: string): void {
    for (const conn of this.connections) {
      if (conn.state === 'PLAYING') conn.send({ t: 'said', id: entityId, text });
    }
  }
}
