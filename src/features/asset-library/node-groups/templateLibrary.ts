import { builtInTemplates } from './builtInTemplates';
import type { NodeTemplate } from './nodeTemplate';
import type { StoredTemplateLibrary } from './storedTemplateLibrary';
import { loadStoredTemplateLibrary, storeTemplateLibrary } from './templateStorage';

export class TemplateLibrary {
  private saved: NodeTemplate[];
  private hidden: string[];
  private readonly listeners = new Set<() => void>();
  private everyTemplate: NodeTemplate[] | null = null;

  constructor(stored: StoredTemplateLibrary = loadStoredTemplateLibrary()) {
    this.saved = stored.templates;
    this.hidden = stored.hiddenBuiltIns;
  }

  stored(): StoredTemplateLibrary {
    return { templates: this.saved, hiddenBuiltIns: this.hidden };
  }

  builtIn(): readonly NodeTemplate[] {
    return builtInTemplates();
  }

  savedTemplates(): readonly NodeTemplate[] {
    return this.saved;
  }

  hiddenBuiltIns(): readonly string[] {
    return this.hidden;
  }

  all(): NodeTemplate[] {
    this.everyTemplate ??= [...this.saved, ...this.builtInStillOnTheShelf()];
    return this.everyTemplate;
  }

  byName(name: string): NodeTemplate | undefined {
    return this.all().find((template) => template.name === name);
  }

  private builtInStillOnTheShelf(): NodeTemplate[] {
    return this.builtIn().filter(
      (template) =>
        !this.hidden.includes(template.name) &&
        !this.saved.some((edited) => edited.name === template.name),
    );
  }

  save(template: NodeTemplate): void {
    this.saved = [...this.saved.filter((existing) => existing.name !== template.name), template];
    this.persistAndNotify();
  }

  remove(name: string): void {
    this.saved = this.saved.filter((template) => template.name !== name);
    this.persistAndNotify();
  }

  hideBuiltIn(name: string): void {
    if (this.hidden.includes(name)) return;
    this.hidden = [...this.hidden, name];
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    this.everyTemplate = null;
    storeTemplateLibrary(this.stored());
    for (const listener of this.listeners) listener();
  }
}
