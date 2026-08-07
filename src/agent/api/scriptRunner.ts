import { performVerb, type VerbResult } from './performVerb';
import { parseScriptForMode, scriptFaultText, type ScriptFault, type ScriptLine } from './scriptSyntax';
import type { ServerWorld } from './serverWorld';
import type { AgentSession } from './sessions';
import type { SavedScript } from './agentNotebook';

const MAX_ACTIONS_PER_RUN = 200;

export interface ScriptRun {
  actionsRun: number;
  changedPipeline: boolean;
  fault: ScriptFault | null;
  summary: string;
}

export function runScript(session: AgentSession, world: ServerWorld, script: SavedScript): ScriptRun {
  const parsed = parseScriptForMode(session.mode, script.body);
  if (!parsed.ok) {
    return { actionsRun: 0, changedPipeline: false, fault: parsed.fault, summary: 'the script did not run' };
  }
  return performLines(session, world, script, parsed.lines);
}

export function scriptRunText(run: ScriptRun): string {
  return run.fault ? `${run.summary}; ${scriptFaultText(run.fault)}` : run.summary;
}

function performLines(
  session: AgentSession,
  world: ServerWorld,
  script: SavedScript,
  lines: readonly ScriptLine[],
): ScriptRun {
  let actionsRun = 0;
  let changedPipeline = false;
  for (const line of lines) {
    for (let pass = 0; pass < line.repeat; pass += 1) {
      if (actionsRun >= MAX_ACTIONS_PER_RUN) {
        return stoppedRun(script, actionsRun, changedPipeline, line, actionLimitReached());
      }
      const result = performVerb(session, world, line.action, line.params);
      changedPipeline = changedPipeline || result.changedPipeline;
      if (result.failure) {
        return stoppedRun(script, actionsRun, changedPipeline, line, failureText(result));
      }
      actionsRun += 1;
    }
  }
  return {
    actionsRun,
    changedPipeline,
    fault: null,
    summary: `'${script.name}' ran ${actionsRun} action(s)`,
  };
}

function stoppedRun(
  script: SavedScript,
  actionsRun: number,
  changedPipeline: boolean,
  line: ScriptLine,
  reason: string,
): ScriptRun {
  return {
    actionsRun,
    changedPipeline,
    fault: { line: line.line, text: line.text, reason },
    summary: `'${script.name}' stopped after ${actionsRun} action(s)`,
  };
}

function actionLimitReached(): string {
  return `a script may run at most ${MAX_ACTIONS_PER_RUN} actions`;
}

function failureText(result: VerbResult): string {
  const failure = result.failure!;
  return `${failure.code}: ${failure.meaning}${failure.hint ? ` ${failure.hint}` : ''}`;
}
