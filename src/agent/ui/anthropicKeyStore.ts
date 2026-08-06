import { readJson, writeJson } from '../../persistence/localJsonStore';

const KEY = 'procgen.anthropicKey.v1';

export function storedAnthropicKey(): string {
  return readJson<string>(KEY) ?? '';
}

export function storeAnthropicKey(key: string): void {
  writeJson(KEY, key);
}
