import { readFileSync } from 'node:fs';

const CLAIMS_PATH = 'data/provenClaims.json';

export interface ProvenClaim {
  claim: string;
  topic: string;
  held: boolean;
}

export interface ClaimTopic {
  topic: string;
  claims: string[];
}

export function claimsByTopic(): ClaimTopic[] {
  const byTopic = new Map<string, string[]>();
  for (const proven of readProvenClaims()) {
    const claims = byTopic.get(proven.topic) ?? [];
    claims.push(proven.claim);
    byTopic.set(proven.topic, claims);
  }
  return [...byTopic].map(([topic, claims]) => ({ topic, claims }));
}

function readProvenClaims(): ProvenClaim[] {
  try {
    return JSON.parse(readFileSync(CLAIMS_PATH, 'utf8')) as ProvenClaim[];
  } catch {
    return [];
  }
}
