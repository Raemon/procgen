import { classes } from '../../ui/controls/classes';
import type { TooltipContent } from '../../ui/tooltips/tooltipContent';
import { tooltipHandlers } from '../../ui/tooltips/tooltipHandlers';
import { formatUsd } from '../pricing';
import type { RosterAgent } from './agentsApiClient';

const CARD_CLASSES =
  'cursor-pointer rounded border px-2 py-1.5 text-xs text-ink hover:bg-btn-hover';
const RUN_STATUS_INKS: Readonly<Record<RosterAgent['run_status'], string>> = {
  idle: 'text-ink-dim',
  running: 'text-emerald-400',
  stopped: 'text-ink-dim',
  finished: 'text-sky-400',
  error: 'text-amber-400',
};

const RUN_TIP: TooltipContent = {
  title: 'run',
  body: 'Hands the agent to the chosen model with the run goal and budget, and lets it play until it finishes or runs out.',
};

const STOP_TIP: TooltipContent = {
  title: 'stop',
  body: 'Ends the run after the step in flight. The agent keeps everything it has learned and can be run again.',
};

const DELETE_TIP: TooltipContent = {
  title: 'delete agent',
  body: 'Removes the agent and its transcript from the server.',
};

export function AgentCard({
  agent,
  selected,
  onSelect,
  onRun,
  onStop,
  onDelete,
}: {
  agent: RosterAgent;
  selected: boolean;
  onSelect(): void;
  onRun(): void;
  onStop(): void;
  onDelete(): void;
}) {
  return (
    <div
      className={classes(CARD_CLASSES, selected ? 'border-accent bg-btn-active' : 'border-panel-edge bg-btn')}
      onClick={onSelect}
    >
      <div className="flex items-center gap-1.5">
        <span className="truncate font-medium">{agent.name}</span>
        <span className="text-ink-dim">{agent.mode}</span>
        <span className={classes('ml-auto', RUN_STATUS_INKS[agent.run_status])}>
          {agent.run_status}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-ink-dim">
        <span>
          ({agent.position.x},{agent.position.y})
        </span>
        {agent.last_action && (
          <span className="truncate">
            {agent.last_action.action} → {agent.last_action.outcome}
          </span>
        )}
        {agent.run_spent_usd !== null && agent.run_budget_usd !== null && (
          <span>
            {formatUsd(agent.run_spent_usd)}/{formatUsd(agent.run_budget_usd)}
          </span>
        )}
        {(agent.notebook_notes > 0 || agent.notebook_scripts > 0) && (
          <span
            {...tooltipHandlers({
              title: 'notebook',
              body: 'What the agent has written down for itself: memory notes it can re-read, and scripts it saved to replay.',
            })}
          >
            {agent.notebook_notes}m {agent.notebook_scripts}s
          </span>
        )}
        <span className="ml-auto flex gap-1">
          {agent.run_status === 'running' ? (
            <CardButton label="■ stop" tip={STOP_TIP} onClick={onStop} />
          ) : (
            <CardButton label="▶ run" tip={RUN_TIP} onClick={onRun} />
          )}
          <CardButton label="✕" tip={DELETE_TIP} onClick={onDelete} />
        </span>
      </div>
    </div>
  );
}

function CardButton({
  label,
  tip,
  onClick,
}: {
  label: string;
  tip: TooltipContent;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-label={tip.title}
      className="cursor-pointer rounded border border-btn-edge bg-btn px-1.5 py-0.5 text-[11px] hover:bg-btn-hover"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      {...tooltipHandlers(tip)}
    >
      {label}
    </button>
  );
}
