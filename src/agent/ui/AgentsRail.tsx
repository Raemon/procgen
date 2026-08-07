import { RailItem, RailStack } from '../../ui/collapsedRail/RailItem';
import { railInitials } from '../../ui/collapsedRail/railInitials';
import type { TooltipContent } from '../../ui/tooltips/tooltipContent';
import { formatUsd } from '../pricing';
import type { RosterAgent } from './agentsApiClient';
import { useAgentsRoster } from './useAgentsRoster';

const RUN_STATUS_TINTS: Readonly<Record<RosterAgent['run_status'], string | undefined>> = {
  idle: undefined,
  running: '#34d399',
  stopped: undefined,
  finished: '#38bdf8',
  error: '#fbbf24',
};

export function AgentsRail() {
  const { agents } = useAgentsRoster();
  return (
    <RailStack>
      {agents.map((agent) => (
        <RailItem key={agent.id} tint={RUN_STATUS_TINTS[agent.run_status]} tip={agentRailTip(agent)}>
          {railInitials(agent.name)}
        </RailItem>
      ))}
    </RailStack>
  );
}

function agentRailTip(agent: RosterAgent): TooltipContent {
  return {
    title: agent.name,
    body: [
      `${agent.mode} · ${agent.run_status}`,
      `at ${agent.position.x}, ${agent.position.y} after ${agent.run_steps} steps`,
      agent.run_spent_usd === null ? null : `spent ${formatUsd(agent.run_spent_usd)}`,
      agent.run_goal === null || agent.run_goal === '' ? null : `goal: ${agent.run_goal}`,
    ]
      .filter((line) => line !== null)
      .join(' · '),
  };
}
