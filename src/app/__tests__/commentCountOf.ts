import { readFileSync } from 'node:fs';
import ts from 'typescript';

export function commentCountOf(path: string): number {
  const source = readFileSync(path, 'utf8');
  const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const found = new Set<string>();
  collectCommentsFrom(parsed, source, found);
  return found.size;
}

function collectCommentsFrom(node: ts.Node, source: string, found: Set<string>): void {
  if (node.getFullStart() !== node.getEnd()) {
    for (const range of ts.getLeadingCommentRanges(source, node.getFullStart()) ?? []) {
      found.add(`${range.pos}:${range.end}`);
    }
    for (const range of ts.getTrailingCommentRanges(source, node.getEnd()) ?? []) {
      found.add(`${range.pos}:${range.end}`);
    }
  }
  node.forEachChild((child) => collectCommentsFrom(child, source, found));
}
