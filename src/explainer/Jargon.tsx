import { tooltipHandlers } from '../ui/tooltips/tooltipHandlers';
import { GLOSSARY } from './glossary';

export function Jargon({ term, children }: { term: string; children?: string }) {
  const entry = GLOSSARY[term];
  if (!entry) return <>{children ?? term}</>;
  return (
    <span
      tabIndex={0}
      className="cursor-help border-b border-dotted border-accent/60 outline-none focus:border-accent"
      {...tooltipHandlers({ title: term, body: entry.definition, example: entry.example })}
    >
      {children ?? term}
    </span>
  );
}
