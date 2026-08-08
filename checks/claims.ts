import { test } from 'node:test';
import assert from 'node:assert';

export interface Claim {
  (name: string, condition: boolean): void;
}

const characterizationsThatChanged: string[] = [];

export const check: Claim = (name, condition) => {
  test(name, () => assert.ok(condition));
};

export const characterize: Claim = (name, condition) => {
  test(name, (t) => {
    if (condition) return;
    characterizationsThatChanged.push(name);
    t.diagnostic('this characterization changed — confirm you meant to change it');
  });
};

export function announceCharacterizationsThatChanged(): void {
  process.on('exit', () => {
    if (characterizationsThatChanged.length === 0) return;
    console.log(
      `\n${characterizationsThatChanged.length} characterization(s) changed. Nothing is broken; decide whether each new shape is the one you want, then update the claim:`,
    );
    for (const name of characterizationsThatChanged) console.log(`  ~ ${name}`);
  });
}
