import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { classes } from '@/features/app-shell/controls/classes';
import {
  charactersInPlay,
  tilesBetween,
  type CharacterListing,
} from '../multiplayer/client/charactersInPlay';
import { glyphOf, inkOf } from '../render/agentText/characterGlyphs';

const ROSTER_POLL_MS = 250;

export function CharacterLegend({ placement }: { placement: 'overlay' | 'column' }) {
  const runtime = useAppRuntime();
  const characters = useRoster();
  const followedId = useSyncExternalStore(
    runtime.cameraFocus.subscribe,
    () => runtime.cameraFocus.followedId(),
    () => null,
  );
  const you = characters[0];
  return (
    <div
      className={classes(
        'rounded bg-black/70 p-2 font-mono text-[11px]',
        placement === 'overlay' ? 'pointer-events-auto absolute right-3 top-3 w-60' : 'w-full',
      )}
    >
      <div className="mb-1 uppercase tracking-wider text-ink-dim">characters</div>
      {characters.map((character) => (
        <button
          key={character.id}
          onClick={() =>
            character.isSelf
              ? runtime.cameraFocus.clear()
              : runtime.cameraFocus.follow(character.id)
          }
          className={classes(
            'flex w-full items-baseline gap-1.5 rounded px-1 py-0.5 text-left hover:bg-white/10',
            followedId === character.id && 'bg-white/15',
          )}
        >
          <span style={{ color: inkOf(character) }}>{glyphOf(character)}</span>
          <span className="min-w-0 flex-1 truncate text-ink">
            {character.isSelf ? 'you' : character.name}
          </span>
          <span className="text-ink-dim">
            {character.x},{character.y}
          </span>
          <span className="w-10 text-right text-ink-dim">
            {character.isSelf || !you ? character.kind : `${tilesBetween(you, character)}t`}
          </span>
        </button>
      ))}
      {characters.length === 1 ? (
        <div className="px-1 py-0.5 text-ink-dim">no agents or other players online</div>
      ) : null}
      <div className="mt-1 border-t border-white/10 px-1 pt-1 text-ink-dim">
        click to follow · drag or double-click the view to let go
      </div>
    </div>
  );
}

function useRoster(): CharacterListing[] {
  const { world, net } = useAppRuntime();
  const [characters, setCharacters] = useState(() => charactersInPlay(world, net.remotePlayers));
  useEffect(() => {
    const poll = setInterval(
      () => setCharacters(charactersInPlay(world, net.remotePlayers)),
      ROSTER_POLL_MS,
    );
    return () => clearInterval(poll);
  }, [world, net]);
  return characters;
}
