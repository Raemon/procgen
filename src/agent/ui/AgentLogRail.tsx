import { RailItem, RailStack } from '../../ui/collapsedRail/RailItem';
import type { TooltipContent } from '../../ui/tooltips/tooltipContent';
import type { WireTranscriptEntry } from './agentsApiClient';
import { useTranscript } from './useTranscript';

const ENTRY_GLYPHS: Readonly<Record<WireTranscriptEntry['type'], string>> = {
  status: '·',
  thinking: '~',
  message: '"',
  tool_use: '>',
  tool_result: '<',
  error: '!',
};

const ENTRY_TINTS: Readonly<Record<WireTranscriptEntry['type'], string | undefined>> = {
  status: undefined,
  thinking: undefined,
  message: undefined,
  tool_use: '#38bdf8',
  tool_result: '#38bdf8',
  error: '#fbbf24',
};

const TOOLTIP_TEXT_LIMIT = 240;

export function AgentLogRail({ selectedId }: { selectedId: string }) {
  const { entries } = useTranscript(selectedId);
  return (
    <RailStack>
      {entries.map((entry) => (
        <RailItem key={entry.seq} tint={ENTRY_TINTS[entry.type]} tip={entryRailTip(entry)}>
          {ENTRY_GLYPHS[entry.type]}
        </RailItem>
      ))}
    </RailStack>
  );
}

function entryRailTip(entry: WireTranscriptEntry): TooltipContent {
  return { title: entry.type.replace('_', ' '), body: shortened(entry.text) };
}

function shortened(text: string): string {
  return text.length <= TOOLTIP_TEXT_LIMIT ? text : `${text.slice(0, TOOLTIP_TEXT_LIMIT)}…`;
}
