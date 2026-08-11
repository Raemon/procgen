import * as THREE from 'three';
import type { SpeechBubbles } from '../../chat/speechBubbles';
import type { SpeechBubbleAnchor } from './speechBubbleLabels';

const BUBBLE_LIFT = 0.75;

export type SpeakerPoint = (speakerId: number) => THREE.Vector3 | null;

export function speechBubbleAnchors(
  speech: SpeechBubbles,
  pointFor: SpeakerPoint,
): SpeechBubbleAnchor[] {
  const anchors: SpeechBubbleAnchor[] = [];
  for (const speakerId of speech.speakerIds()) {
    const lines = speech.linesFor(speakerId);
    const point = lines.length === 0 ? null : pointFor(speakerId);
    if (point) anchors.push({ speakerId, lines, worldPoint: liftedAboveHead(point) });
  }
  return anchors;
}

function liftedAboveHead(point: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.y + BUBBLE_LIFT, point.z);
}
