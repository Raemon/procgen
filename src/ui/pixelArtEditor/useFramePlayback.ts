import { useEffect } from 'react';
import type { FaceArtEditor } from './useFaceArtEditor';

export function useFramePlayback(editor: FaceArtEditor): void {
  const { playing, frame } = editor.settings;
  const { frameCount, frameMs, updateSettings } = editor;
  useEffect(() => {
    if (!playing || frameCount < 2) return;
    const timer = window.setTimeout(
      () => updateSettings({ frame: (frame + 1) % frameCount }),
      frameMs,
    );
    return () => window.clearTimeout(timer);
  }, [playing, frame, frameCount, frameMs]);
}
