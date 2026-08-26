import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { mulberry32 } from '@/features/asset-library/worlds/random/mulberry32';
import { rolledGenome, type WorldSeedGenome } from '@/features/asset-library/worlds/selfPlay/worldSeedGenome';
import { shotKeyOf, WorldShotQueue } from '@/features/game/capture/worldShotQueue';

interface StagedShooter {
  queue: WorldShotQueue;
  shotsAsked: WorldSeedGenome[];
  land(url: string): Promise<void>;
  fail(reason: string): Promise<void>;
}

export async function checkWorldShotQueue(check: CheckReporter): Promise<void> {
  await checkOneShotAtATime(check);
  checkTheSameGenomeIsShotOnce(check);
  await checkAFailedShotIsRemembered(check);
}

async function checkOneShotAtATime(check: CheckReporter): Promise<void> {
  const staged = stagedShooter();
  const one = rolledGenome(mulberry32(31));
  const other = rolledGenome(mulberry32(32));
  let told = 0;
  staged.queue.subscribe(() => told++);

  staged.queue.request(one);
  staged.queue.request(other);
  check('a second world waits its turn instead of opening a render beside the first', staged.shotsAsked.length === 1);
  check('a world still in the queue reads as waiting', staged.queue.shotOf(other)?.status === 'waiting');

  await staged.land('data:image/png;base64,one');
  check('the next world is shot only once the one before it lands', staged.shotsAsked.length === 2);
  check('a landed shot is held under the genome that asked for it', staged.queue.shotOf(one)?.url === 'data:image/png;base64,one');
  check('subscribers hear about every state a shot passes through', told >= 3);
}

function checkTheSameGenomeIsShotOnce(check: CheckReporter): void {
  const staged = stagedShooter();
  const genome = rolledGenome(mulberry32(41));
  staged.queue.request(genome);
  staged.queue.request({ ...genome });
  check('asking twice for one genome shoots it once, since shots are cached by the genome', staged.shotsAsked.length === 1 && staged.queue.waitingCount() === 0);
  check('two genomes that read the same share one shot key', shotKeyOf(genome) === shotKeyOf({ ...genome }));
  check('a different genome gets a different shot key', shotKeyOf(genome) !== shotKeyOf(rolledGenome(mulberry32(42))));
}

async function checkAFailedShotIsRemembered(check: CheckReporter): Promise<void> {
  const staged = stagedShooter();
  const genome = rolledGenome(mulberry32(51));
  staged.queue.request(genome);
  await staged.fail('no WebGL');
  check('a shot that cannot be taken is remembered as failed rather than retried forever', staged.queue.shotOf(genome)?.status === 'failed');
  check('a failed shot keeps the reason it failed, so a card can say why', staged.queue.shotOf(genome)?.failure === 'no WebGL');
  staged.queue.reshoot(genome);
  check('re-shooting a world the queue gave up on asks the shooter again', staged.shotsAsked.length === 2);
}

function stagedShooter(): StagedShooter {
  const shotsAsked: WorldSeedGenome[] = [];
  const pending: { resolve: (url: string) => void; reject: (error: Error) => void }[] = [];
  const queue = new WorldShotQueue(
    (genome) =>
      new Promise<string>((resolve, reject) => {
        shotsAsked.push(genome);
        pending.push({ resolve, reject });
      }),
  );
  return {
    queue,
    shotsAsked,
    land: (url) => {
      pending.shift()!.resolve(url);
      return settled();
    },
    fail: (reason) => {
      pending.shift()!.reject(new Error(reason));
      return settled();
    },
  };
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
