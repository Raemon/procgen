import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import { decodeServer, encodeClient } from '../src/net/codec';
import { PROTOCOL_VERSION, type SaidMsg } from '../src/net/protocol';

const PORT = 8123;
const SETTLE_MS = 400;

void main();

async function main(): Promise<void> {
  const server = startServer();
  try {
    await waitForHealth();
    await checkSpeechReachesEveryone();
    await checkBlankAndOversizedTextAreCleaned();
    await checkFloodIsThrottled();
    console.log('chat over websocket: all checks passed');
  } finally {
    server.kill('SIGTERM');
  }
}

function startServer() {
  return spawn('npx', ['tsx', 'server/index.ts'], {
    env: { ...process.env, PORT: String(PORT), SERVER_SECRET: 'chat-check-secret' },
    stdio: 'ignore',
  });
}

async function waitForHealth(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://localhost:${PORT}/healthz`);
      if (response.ok) return;
    } catch {
      // the server is still booting
    }
    await delay(500);
  }
  throw new Error('server never became healthy');
}

async function checkSpeechReachesEveryone(): Promise<void> {
  const [speaker, listener] = await Promise.all([joinedClient('speaker'), joinedClient('listener')]);
  speaker.say('hello neighbours');
  await delay(SETTLE_MS);
  assert(speaker.said.length === 1, 'the speaker hears its own line echoed back by the server');
  assert(listener.said.length === 1, 'the listener hears the line');
  assert(listener.said[0]!.text === 'hello neighbours', 'the text survives the round trip');
  assert(listener.said[0]!.id === speaker.entityId, 'the line is attributed to the speaker entity');
  speaker.close();
  listener.close();
}

async function checkBlankAndOversizedTextAreCleaned(): Promise<void> {
  const client = await joinedClient('scrubbed');
  client.say('   \n\t  ');
  client.say('a\u0007b');
  client.say('x '.repeat(400));
  await delay(SETTLE_MS);
  assert(client.said.length === 2, 'whitespace-only lines never reach anyone');
  assert(client.said[0]!.text === 'a b', 'control characters are scrubbed out');
  assert(client.said[1]!.text.length === 140, 'long lines are cut to the protocol limit');
  client.close();
}

async function checkFloodIsThrottled(): Promise<void> {
  const client = await joinedClient('flooder');
  for (let i = 0; i < 12; i++) client.say(`spam ${i}`);
  await delay(SETTLE_MS);
  assert(client.said.length === 3, `a burst is capped at 3 lines, got ${client.said.length}`);
  assert(client.socket.readyState === WebSocket.OPEN, 'flooding throttles rather than kicks');
  client.close();
}

interface ChatClient {
  socket: WebSocket;
  entityId: number;
  said: SaidMsg[];
  say(text: string): void;
  close(): void;
}

async function joinedClient(name: string): Promise<ChatClient> {
  const socket = new WebSocket(`ws://localhost:${PORT}/ws`);
  const said: SaidMsg[] = [];
  let entityId = 0;
  await new Promise<void>((resolve, reject) => {
    socket.on('error', reject);
    socket.on('open', () => socket.send(encodeClient({ t: 'hello', v: PROTOCOL_VERSION, name })));
    socket.on('message', (data: Buffer) => {
      const msg = decodeServer(data.toString());
      if (!msg || Array.isArray(msg)) return;
      if (msg.t === 'welcome') {
        entityId = msg.id;
        resolve();
      }
      if (msg.t === 'said') said.push(msg);
    });
  });
  return {
    socket,
    said,
    get entityId() {
      return entityId;
    },
    say: (text: string) => socket.send(encodeClient({ t: 'say', text })),
    close: () => socket.close(),
  };
}

function assert(condition: boolean, what: string): void {
  if (!condition) throw new Error(`check failed: ${what}`);
  console.log(`  ok — ${what}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
