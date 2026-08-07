import { MAX_ART_FRAMES, MAX_FRAME_MS, MIN_FRAME_MS } from '../tiles/tileFaceArt';
import { Button } from '../../frontend/controls/Button';
import { classes } from '../../frontend/controls/classes';
import { FIELD_CLASSES } from '../../frontend/controls/fieldClasses';
import { tooltipHandlers } from '../../frontend/tooltips/tooltipHandlers';
import {
  ADD_FRAME_TIP,
  FRAME_MS_TIP,
  frameTip,
  playFramesTip,
  REMOVE_FRAME_TIP,
} from './help/paintTips';
import type { FaceArtEditor } from './useFaceArtEditor';

const FRAME_CLASSES = 'px-1.5 py-0.5 text-[11px]';

export function FrameStrip({ editor }: { editor: FaceArtEditor }) {
  const { settings, frameCount } = editor;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {[...Array(frameCount).keys()].map((frame) => (
        <Button
          key={frame}
          className={FRAME_CLASSES}
          active={frame === settings.frame}
          tip={frameTip(frame, frameCount)}
          onClick={() => editor.selectFrame(frame)}
        >
          {frame + 1}
        </Button>
      ))}
      <Button
        className={FRAME_CLASSES}
        tip={ADD_FRAME_TIP}
        disabled={frameCount >= MAX_ART_FRAMES}
        onClick={editor.addFrame}
      >
        +
      </Button>
      <Button
        className={FRAME_CLASSES}
        tip={REMOVE_FRAME_TIP}
        disabled={frameCount <= 1}
        onClick={editor.removeFrame}
      >
        −
      </Button>
      {frameCount > 1 && <PlaybackControls editor={editor} />}
    </div>
  );
}

function PlaybackControls({ editor }: { editor: FaceArtEditor }) {
  const playing = editor.settings.playing;
  return (
    <>
      <Button
        className={classes(FRAME_CLASSES, 'ml-auto')}
        active={playing}
        tip={playFramesTip(playing)}
        onClick={() => editor.updateSettings({ playing: !playing })}
      >
        {playing ? '❚❚' : '▶'}
      </Button>
      <input
        type="number"
        className={classes(FIELD_CLASSES, 'w-[62px]')}
        aria-label={FRAME_MS_TIP.title}
        min={MIN_FRAME_MS}
        max={MAX_FRAME_MS}
        step={10}
        value={editor.frameMs}
        onChange={(event) => editor.changeFrameMs(Number(event.target.value))}
        {...tooltipHandlers(FRAME_MS_TIP)}
      />
      <span className="text-[10px] text-ink-dim">ms</span>
    </>
  );
}
