// The notebook is what an agent keeps across history trimming and across runs:
// notes it chose to remember, and scripts it wrote for itself. It lives on the
// session rather than the run, and every observation repeats it back, so the
// agent never has to have it in the conversation window to use it.
export interface MemoryNote {
  id: string;
  note: string;
}

export interface SavedScript {
  name: string;
  description: string;
  body: string;
}

export interface AgentNotebook {
  notes: MemoryNote[];
  scripts: SavedScript[];
  nextNoteNumber: number;
}

const MAX_NOTES = 40;
const MAX_SCRIPTS = 20;
const MAX_NOTE_LENGTH = 400;

export function newNotebook(): AgentNotebook {
  return { notes: [], scripts: [], nextNoteNumber: 1 };
}

export function remember(notebook: AgentNotebook, note: string): string {
  const text = note.trim().slice(0, MAX_NOTE_LENGTH);
  if (text === '') return 'nothing saved: the note was empty';
  const id = `m${notebook.nextNoteNumber}`;
  notebook.nextNoteNumber += 1;
  notebook.notes.push({ id, note: text });
  // Oldest notes fall off first; the agent can re-save anything it still wants.
  const dropped = notebook.notes.splice(0, Math.max(0, notebook.notes.length - MAX_NOTES));
  const note1 = `remembered as ${id}`;
  return dropped.length === 0
    ? note1
    : `${note1} (memory was full, so ${dropped.map((each) => each.id).join(', ')} fell off)`;
}

export function forget(notebook: AgentNotebook, id: string): string {
  const index = notebook.notes.findIndex((each) => each.id === id);
  if (index === -1) return `no memory note called '${id}'`;
  notebook.notes.splice(index, 1);
  return `forgot ${id}`;
}

export function writeScript(
  notebook: AgentNotebook,
  script: SavedScript,
): { ok: true; summary: string } | { ok: false; hint: string } {
  const name = script.name.trim();
  if (name === '') return { ok: false, hint: 'a script needs a name' };
  const existing = notebook.scripts.findIndex((each) => each.name === name);
  if (existing === -1 && notebook.scripts.length >= MAX_SCRIPTS) {
    return { ok: false, hint: `you already have ${MAX_SCRIPTS} scripts; delete one first` };
  }
  const saved = { ...script, name };
  if (existing === -1) notebook.scripts.push(saved);
  else notebook.scripts[existing] = saved;
  return { ok: true, summary: existing === -1 ? `saved script '${name}'` : `replaced script '${name}'` };
}

export function deleteScript(notebook: AgentNotebook, name: string): string {
  const index = notebook.scripts.findIndex((each) => each.name === name);
  if (index === -1) return `no script called '${name}'`;
  notebook.scripts.splice(index, 1);
  return `deleted script '${name}'`;
}

export function scriptNamed(notebook: AgentNotebook, name: string): SavedScript | null {
  return notebook.scripts.find((each) => each.name === name) ?? null;
}

export function notebookText(notebook: AgentNotebook): string {
  return [...memoryLines(notebook), ...scriptLines(notebook)].join('\n');
}

function memoryLines(notebook: AgentNotebook): string[] {
  if (notebook.notes.length === 0) {
    return ['memory: empty. Use remember to save anything worth carrying past this conversation.'];
  }
  return ['memory:', ...notebook.notes.map((each) => `  ${each.id}: ${each.note}`)];
}

function scriptLines(notebook: AgentNotebook): string[] {
  if (notebook.scripts.length === 0) {
    return ['scripts: none. Use write_script to save an action sequence you expect to repeat.'];
  }
  return ['scripts:', ...notebook.scripts.map((each) => `  ${each.name}: ${each.description}`)];
}
