import { useState, useSyncExternalStore } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import type { NodeTemplate } from '../../procgen/templates/nodeTemplate';
import { Button } from '../controls/Button';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';

export function AddTemplateMenu({ onAdded }: { onAdded(nodeId: string): void }) {
  const { store, templates, perform } = useAppRuntime();
  const [open, setOpen] = useState(false);
  const saved = useSyncExternalStore(
    (listener) => templates.onChange(listener),
    () => templates.savedTemplates(),
  );

  function stamp(template: NodeTemplate): void {
    const before = store.nodes().map((node) => node.id);
    perform('stamp_template', { name: template.name });
    setOpen(false);
    const added = store.nodes().find((node) => !before.includes(node.id));
    if (added) onAdded(added.id);
  }

  return (
    <div>
      <Button className="w-full" onClick={() => setOpen(!open)}>
        + add template
      </Button>
      {open && (
        <div className="mt-1.5 rounded-md border border-panel-edge bg-field p-1.5">
          <TemplateGroup heading="built in" templates={templates.builtIn()} onPick={stamp} />
          <TemplateGroup heading="saved" templates={saved} onPick={stamp} removable />
          {templates.all().length === 0 && (
            <p className="px-2 py-1 text-[11px] text-ink-dim italic">no templates yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateGroup({
  heading,
  templates,
  onPick,
  removable,
}: {
  heading: string;
  templates: readonly NodeTemplate[];
  onPick(template: NodeTemplate): void;
  removable?: boolean;
}) {
  if (templates.length === 0) return null;
  return (
    <div>
      <div className="mx-1 mt-1.5 mb-[3px] text-[10px] tracking-[0.1em] text-ink-dim uppercase">
        {heading}
      </div>
      {templates.map((template) => (
        <TemplateItem
          key={template.name}
          template={template}
          onPick={onPick}
          removable={removable === true}
        />
      ))}
    </div>
  );
}

function TemplateItem({
  template,
  onPick,
  removable,
}: {
  template: NodeTemplate;
  onPick(template: NodeTemplate): void;
  removable: boolean;
}) {
  const { perform } = useAppRuntime();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="block flex-1 cursor-pointer rounded border-none bg-transparent px-2 py-[5px] text-left text-xs text-ink hover:bg-procgen"
        onClick={() => onPick(template)}
        {...tooltipHandlers({
          title: template.name,
          body: template.description,
          options: [
            {
              name: `${template.nodes.length} nodes`,
              meaning: template.nodes.map((node) => node.label).join(' → '),
            },
          ],
        })}
      >
        {template.name}
      </button>
      {removable && (
        <Button
          className="px-1.5 py-0.5 text-[11px] hover:border-danger-edge hover:text-danger-ink"
          title="forget this saved template"
          onClick={() => perform('delete_template', { name: template.name })}
        >
          ✕
        </Button>
      )}
    </div>
  );
}
