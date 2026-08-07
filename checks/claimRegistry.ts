export interface ProvenClaim {
  claim: string;
  topic: string;
  held: boolean;
}

const claims: ProvenClaim[] = [];
let topic = 'the world';

export function underTopic(name: string): void {
  topic = name;
}

export function recordClaim(claim: string, held: boolean): void {
  claims.push({ claim, topic, held });
}

export function provenClaims(): ProvenClaim[] {
  return [...claims];
}

export function brokenClaims(): ProvenClaim[] {
  return claims.filter((each) => !each.held);
}
