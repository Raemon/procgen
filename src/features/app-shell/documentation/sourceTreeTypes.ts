export interface SourceDeclaration {
  kind: 'function' | 'variable';
  name: string;
  line: number;
}

export interface SourceFile {
  kind: 'file';
  name: string;
  path: string;
  sourceId: string;
  declarations: SourceDeclaration[];
}

export interface SourceFolder {
  kind: 'folder';
  name: string;
  path: string;
  children: SourceNode[];
}

export type SourceNode = SourceFolder | SourceFile;
