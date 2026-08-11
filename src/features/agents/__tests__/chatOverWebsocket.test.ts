import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import { decodeServer, encodeClient } from '@/features/game/multiplayer/client/codec';
import { PROTOCOL_VERSION, type SaidMsg } from '@/features/game/multiplayer/client/protocol';

const PORT = 8123;
const SETTLE_MS = 400;

void main();

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error(
      'this check starts a real server, which needs DATABASE_URL: point it at a Postgres and run `npx prisma db push` first',
    );
    process.exit(1);
  }
  const server = startServer();
  try {
    await waitForHealth();
    await checkSpeechReachesEveryone();
    await checkBlankAndOversizedTextAreCleaned();
    await checkFloodIsThrottled();
    await checkTheSessionCookieBringsYouBackAsTheSameCharacter();
    console.log('websocket sessions and chat: all checks passed');
  } finally {
    server.kill('SIGTERM');
  }
}

function startServer() {
  return spawn('npx', ['tsx', 'server.ts'], {
    env: { ...process.env, PORT: String(PORT), SERVER_SECRET: 'chat-check-secret' },
    stdio: 'ignore',
  });
}

async function waitForHealth(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await serverIsAnswering()) return;
    await delay(500);
  }
  throw new Error('server never became healthy');
}

async function serverIsAnswering(): Promise<boolean> {
  try {
    return (await fetch(`http://localhost:${PORT}/api/health`)).ok;
  } catch {
    return false;
  }
}

async function checkSpeechReachesEveryone(): Promise<void> {
  const [speaker, listener] = await Promise.all([joinedClient(), joinedClient()]);
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
  const client = await joinedClient();
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
  const client = await joinedClient();
  for (let i = 0; i < 12; i++) client.say(`spam ${i}`);
  await delay(SETTLE_MS);
  assert(client.said.length === 3, `a burst is capped at 3 lines, got ${client.said.length}`);
  assert(client.socket.readyState === WebSocket.OPEN, 'flooding throttles rather than kicks');
  client.close();
}

interface ChatClient {
  socket: WebSocket;
  entityId: number;
  setCookie: string[] | undefined;
  said: SaidMsg[];
  say(text: string): void;
  close(): void;
}

async function checkTheSessionCookieBringsYouBackAsTheSameCharacter(): Promise<void> {
  const first = await joinedClient();
  const cookie = sessionCookieOf(first);
  assert(cookie !== '', 'the handshake hands a fresh visitor a session cookie');
  const resumed = await joinedClient(cookie);
  assert(
    resumed.entityId === first.entityId,
    'reconnecting with the session cookie comes back as the same character',
  );
  const stranger = await joinedClient();
  assert(
    stranger.entityId !== first.entityId,
    'a visitor with no cookie of their own is somebody else',
  );
  for (const client of [resumed, stranger]) client.close();
}

function sessionCookieOf(client: ChatClient): string {
  const header = (client.setCookie ?? []).find((line) => line.startsWith('procgenSession='));
  return header ? header.split(';')[0]! : '';
}

async function joinedClient(cookie = ''): Promise<ChatClient> {
  const socket = new WebSocket(`ws://localhost:${PORT}/api/v1/game/socket`, { headers: { cookie } });
  const said: SaidMsg[] = [];
  let entityId = 0;
  let setCookie: string[] | undefined;
  socket.on('upgrade', (res) => (setCookie = res.headers['set-cookie']));
  await new Promise<void>((resolve, reject) => {
    socket.on('error', reject);
    socket.on('open', () => socket.send(encodeClient({ t: 'hello', v: PROTOCOL_VERSION })));
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
    get setCookie() {
      return setCookie;
    },
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
