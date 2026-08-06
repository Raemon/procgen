import { GLOSSARY } from './glossary';
import { Jargon } from './Jargon';

export function GlossaryIndex() {
  return (
    <section className="border-t border-panel-edge pt-6">
      <h2 className="mb-2 text-[13px] tracking-[0.14em] text-accent uppercase">every term</h2>
      <p className="mb-3">
        The whole glossary in one place, in case you want to hover them in a row.
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {Object.keys(GLOSSARY).map((term) => (
          <Jargon key={term} term={term} />
        ))}
      </div>
    </section>
  );
}
