import { storedSpriteOf, type StoredSpriteArt } from '../tiles/storage/storedSpriteArt';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  type CharacterAnimation,
  type CharacterBillboard,
  type CharacterRotation,
} from './characterBillboard';

export type StoredCharacterClips = Record<
  CharacterRotation,
  Record<CharacterAnimation, StoredSpriteArt[]>
>;

export type StoredCharacterBillboard = Omit<CharacterBillboard, 'clips'> & {
  clips: StoredCharacterClips;
};

export function billboardAsStoredJson(billboard: CharacterBillboard): StoredCharacterBillboard {
  const clips = {} as StoredCharacterClips;
  for (const rotation of CHARACTER_ROTATIONS) {
    clips[rotation] = {} as StoredCharacterClips[CharacterRotation];
    for (const animation of CHARACTER_ANIMATIONS) {
      clips[rotation][animation] = billboard.clips[rotation][animation].map(storedSpriteOf);
    }
  }
  return { ...billboard, clips };
}
