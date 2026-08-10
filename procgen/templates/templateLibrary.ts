import { unpersisted, type PersistedCollection } from '../persistence/persistedCollection';
import { builtInTemplates } from './builtInTemplates';
import type { NodeTemplate } from './nodeTemplate';

export class TemplateLibrary {
  private saved: NodeTemplate[];
  private readonly listeners = new Set<() => void>();

  constructor(private readonly persistence: PersistedCollection<NodeTemplate> = unpersisted()) {
    this.saved = persistence.load();
  }

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
    this.persistence.store(this.saved);
    for (const listener of this.listeners) listener();
  }
}
