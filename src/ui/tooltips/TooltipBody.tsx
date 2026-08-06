import type { TooltipContent, TooltipOption } from './tooltipContent';

export function TooltipBody({ content }: { content: TooltipContent }) {
  return (
    <>
      <div className="mb-[3px] text-xs font-semibold text-accent">{content.title}</div>
      {content.body && <div>{content.body}</div>}
      {content.example && <ExampleNote example={content.example} />}
      {content.options?.length ? <OptionList options={content.options} /> : null}
      {content.when && <WhenToUse when={content.when} />}
    </>
  );
}

function ExampleNote({ example }: { example: string }) {
  return (
    <div className="mt-1.5 border-t border-dashed border-panel-edge pt-[5px] text-ink-dim">
      <span className="text-accent italic">for example: </span>
      {example}
    </div>
  );
}

function OptionList({ options }: { options: TooltipOption[] }) {
  return (
    <div className="mt-1.5 border-t border-dashed border-panel-edge pt-[5px]">
      {options.map((option) => (
        <div key={option.name} className="mt-[3px] text-ink-dim">
          <span className="font-semibold text-ink">{option.name}</span> — {option.meaning}
        </div>
      ))}
    </div>
  );
}

function WhenToUse({ when }: { when: string }) {
  return (
    <div className="mt-1.5 text-ink-dim">
      <span className="text-accent italic">when to use: </span>
      {when}
    </div>
  );
}
