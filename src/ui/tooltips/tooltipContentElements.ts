export interface TooltipOption {
  name: string;
  meaning: string;
}

export interface TooltipContent {
  title: string;
  body?: string;
  options?: TooltipOption[];
  when?: string;
}

export function renderTooltipContent(content: TooltipContent): HTMLElement[] {
  const parts = [textBlock('tip-title', content.title)];
  if (content.body) parts.push(textBlock('tip-body', content.body));
  if (content.options?.length) parts.push(optionList(content.options));
  if (content.when) parts.push(whenBlock(content.when));
  return parts;
}

function textBlock(className: string, text: string): HTMLElement {
  const block = document.createElement('div');
  block.className = className;
  block.textContent = text;
  return block;
}

function optionList(options: TooltipOption[]): HTMLElement {
  const list = document.createElement('div');
  list.className = 'tip-options';
  for (const option of options) list.appendChild(optionRow(option));
  return list;
}

function optionRow(option: TooltipOption): HTMLElement {
  const row = document.createElement('div');
  row.className = 'tip-option';
  const name = document.createElement('span');
  name.className = 'tip-option-name';
  name.textContent = option.name;
  row.append(name, ` — ${option.meaning}`);
  return row;
}

function whenBlock(when: string): HTMLElement {
  const block = document.createElement('div');
  block.className = 'tip-when';
  const label = document.createElement('span');
  label.className = 'tip-when-label';
  label.textContent = 'when to use: ';
  block.append(label, when);
  return block;
}
