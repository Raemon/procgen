import { builtInTemplates } from './builtInTemplates';
import type { NodeTemplate } from './nodeTemplate';
import { loadSavedTemplates, storeSavedTemplates } from './templateStorage';

export class TemplateLibrary {
  private saved: NodeTemplate[] = loadSavedTemplates();
  private readonly listeners = new Set<() => void>();

  builtIn(): readonly NodeTemplate[] {
    return builtInTemplates();
  }

  savedTemplates(): readonly NodeTemplate[] {
    return this.saved;
  }

  all(): NodeTemplate[] {
    return [...this.builtIn(), ...this.saved];
  }

  byName(name: string): NodeTemplate | undefined {
    return this.all().find((template) => template.name === name);
  }

  save(template: NodeTemplate): void {
    this.saved = [...this.saved.filter((existing) => existing.name !== template.name), template];
    this.persistAndNotify();
  }

  remove(name: string): void {
    this.saved = this.saved.filter((template) => template.name !== name);
    this.persistAndNotify();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private persistAndNotify(): void {
    storeSavedTemplates(this.saved);
    for (const listener of this.listeners) listener();
  }
}
