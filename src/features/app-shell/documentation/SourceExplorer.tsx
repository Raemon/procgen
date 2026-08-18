'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import type { SourceDeclaration, SourceFile, SourceFolder } from './sourceTreeTypes';
import {
  defaultSourceFile,
  expansionIdsForFile,
  fileTreeId,
  sourceCounts,
  treeKeyAction,
  visibleSourceItems,
  type SourceTreeItem,
} from './sourceExplorerState';

type MobilePane = 'browse' | 'code';

interface SourceLoadState {
  sourceId: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  source: string;
}

export function SourceExplorer({ root }: { root: SourceFolder }) {
  const initialFile = useMemo(() => defaultSourceFile(root), [root]);
  const [selectedFile, setSelectedFile] = useState<SourceFile | null>(initialFile);
  const [selectedDeclaration, setSelectedDeclaration] = useState<SourceDeclaration | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => initialFile ? expansionIdsForFile(root, initialFile.path) : new Set(),
  );
  const [filter, setFilter] = useState('');
  const [focusedId, setFocusedId] = useState(() => initialFile ? fileTreeId(initialFile.path) : '');
  const [mobilePane, setMobilePane] = useState<MobilePane>('browse');
  const [retry, setRetry] = useState(0);
  const filterRef = useRef<HTMLInputElement>(null);
  const treeItemRefs = useRef(new Map<string, HTMLDivElement>());
  const counts = useMemo(() => sourceCounts(root), [root]);
  const visibleItems = useMemo(
    () => visibleSourceItems(root, expandedIds, filter),
    [expandedIds, filter, root],
  );
  const selectedPathIds = useMemo(
    () => selectedFile ? expansionIdsForFile(root, selectedFile.path) : new Set<string>(),
    [root, selectedFile],
  );
  const load = useSource(selectedFile, retry);

  useEffect(() => {
    if (visibleItems.some((item) => item.id === focusedId)) return;
    const selectedId = selectedFile ? fileTreeId(selectedFile.path) : '';
    setFocusedId(visibleItems.some((item) => item.id === selectedId) ? selectedId : visibleItems[0]?.id ?? '');
  }, [focusedId, selectedFile, visibleItems]);

  useEffect(() => {
    function focusFilter(event: globalThis.KeyboardEvent): void {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTextEntry(event.target)) return;
      event.preventDefault();
      filterRef.current?.focus();
    }
    window.addEventListener('keydown', focusFilter);
    return () => window.removeEventListener('keydown', focusFilter);
  }, []);

  function toggleExpanded(id: string): void {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function activate(item: SourceTreeItem): void {
    if (item.kind === 'folder') {
      if (item.expandable) toggleExpanded(item.id);
      return;
    }
    if (item.kind === 'file') {
      const reselecting = selectedFile?.path === item.file.path && !selectedDeclaration;
      setSelectedFile(item.file);
      setSelectedDeclaration(null);
      if (!filter && reselecting && item.expandable) toggleExpanded(item.id);
      else setExpandedIds((current) => union(current, expansionIdsForFile(root, item.file.path)));
      setMobilePane('code');
      return;
    }
    setSelectedFile(item.file);
    setSelectedDeclaration(item.declaration);
    setExpandedIds((current) => union(current, expansionIdsForFile(root, item.file.path)));
    setMobilePane('code');
  }

  function focusTreeItem(id: string): void {
    setFocusedId(id);
    requestAnimationFrame(() => treeItemRefs.current.get(id)?.focus());
  }

  function handleTreeKey(event: KeyboardEvent<HTMLDivElement>, item: SourceTreeItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(item);
      return;
    }
    if (event.key === 'Escape' && filter) {
      event.preventDefault();
      setFilter('');
      return;
    }
    if (!isTreeNavigationKey(event.key)) return;
    event.preventDefault();
    const action = treeKeyAction(visibleItems, item.id, event.key);
    if (action.kind === 'focus') focusTreeItem(action.id);
    if (action.kind === 'expand') setExpandedIds((current) => union(current, new Set([action.id])));
    if (action.kind === 'collapse') {
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(action.id);
        return next;
      });
    }
  }

  function collapseAll(): void {
    setExpandedIds(new Set());
    setFilter('');
    const firstId = visibleSourceItems(root, new Set(), '')[0]?.id ?? '';
    if (firstId) focusTreeItem(firstId);
  }

  if (counts.files === 0) return <EmptySourceExplorer />;

  const announcement = selectedDeclaration && selectedFile
    ? `${selectedDeclaration.name}, ${selectedFile.name}, line ${selectedDeclaration.line}`
    : '';

  return (
    <div aria-label="Source explorer">
      <p className="mb-2 text-right text-xs text-ink-dim">
        {counts.files.toLocaleString()} files · {counts.declarations.toLocaleString()} declarations
      </p>
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <div className="mb-2 grid grid-cols-2 rounded border border-panel-edge bg-panel p-1 md:hidden" role="tablist" aria-label="Source explorer view">
        <MobilePaneButton pane="browse" current={mobilePane} onSelect={setMobilePane}>Browse</MobilePaneButton>
        <MobilePaneButton pane="code" current={mobilePane} onSelect={setMobilePane}>Code</MobilePaneButton>
      </div>
      <div className="h-[70dvh] min-h-[32rem] max-h-[52rem] overflow-hidden rounded border border-panel-edge bg-panel md:grid md:grid-cols-[minmax(16rem,max-content)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
        <div className={`${mobilePane === 'browse' ? 'flex' : 'hidden'} h-full min-h-0 min-w-0 flex-col overflow-hidden border-panel-edge md:flex md:border-r`}>
          <TreeToolbar
            filter={filter}
            filterRef={filterRef}
            onFilter={setFilter}
            onCollapseAll={collapseAll}
          />
          <SourceTree
            items={visibleItems}
            filter={filter}
            focusedId={focusedId}
            selectedFile={selectedFile}
            selectedDeclaration={selectedDeclaration}
            selectedPathIds={selectedPathIds}
            itemRefs={treeItemRefs}
            onActivate={activate}
            onFocus={setFocusedId}
            onKeyDown={handleTreeKey}
            onClearFilter={() => setFilter('')}
          />
        </div>
        <div className={`${mobilePane === 'code' ? 'flex' : 'hidden'} h-full min-h-0 min-w-0 flex-col overflow-hidden md:flex`}>
          <CodeViewer
            file={selectedFile}
            declaration={selectedDeclaration}
            load={load}
            onBack={() => setMobilePane('browse')}
            onRetry={() => setRetry((value) => value + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function TreeToolbar({
  filter,
  filterRef,
  onFilter,
  onCollapseAll,
}: {
  filter: string;
  filterRef: RefObject<HTMLInputElement | null>;
  onFilter(value: string): void;
  onCollapseAll(): void;
}) {
  return (
    <div className="flex shrink-0 gap-2 border-b border-panel-edge p-2">
      <input
        ref={filterRef}
        type="search"
        value={filter}
        aria-label="Filter files and symbols"
        placeholder="Filter files and symbols…"
        className="min-w-0 flex-1 rounded border border-panel-edge bg-bg px-2 py-1.5 text-xs text-ink outline-none placeholder:text-ink-dim focus:border-accent"
        onChange={(event) => onFilter(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          if (filter) onFilter('');
          else event.currentTarget.blur();
        }}
      />
      <button
        type="button"
        className="cursor-pointer rounded border border-btn-edge bg-btn px-2 py-1.5 text-xs text-ink-dim hover:bg-btn-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        onClick={onCollapseAll}
      >
        Collapse all
      </button>
    </div>
  );
}

function SourceTree({
  items,
  filter,
  focusedId,
  selectedFile,
  selectedDeclaration,
  selectedPathIds,
  itemRefs,
  onActivate,
  onFocus,
  onKeyDown,
  onClearFilter,
}: {
  items: SourceTreeItem[];
  filter: string;
  focusedId: string;
  selectedFile: SourceFile | null;
  selectedDeclaration: SourceDeclaration | null;
  selectedPathIds: ReadonlySet<string>;
  itemRefs: RefObject<Map<string, HTMLDivElement>>;
  onActivate(item: SourceTreeItem): void;
  onFocus(id: string): void;
  onKeyDown(event: KeyboardEvent<HTMLDivElement>, item: SourceTreeItem): void;
  onClearFilter(): void;
}) {
  if (items.length === 0) {
    return (
      <div className="m-3 rounded border border-panel-edge bg-bg p-3 text-xs text-ink-dim" role="status">
        <p>No files or symbols match “{filter}”.</p>
        <button type="button" className="mt-2 cursor-pointer text-accent underline" onClick={onClearFilter}>Clear filter</button>
      </div>
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto py-1" role="tree" aria-label="Source files and declarations">
      {items.map((item) => {
        const selected = item.kind === 'file'
          ? selectedFile?.path === item.file.path && !selectedDeclaration
          : item.kind === 'declaration'
            ? selectedFile?.path === item.file.path && selectedDeclaration === item.declaration
            : false;
        return (
          <SourceTreeRow
            key={item.id}
            item={item}
            focused={focusedId === item.id}
            selected={selected}
            onSelectedPath={selectedPathIds.has(item.id)}
            setRef={(element) => {
              if (element) itemRefs.current.set(item.id, element);
              else itemRefs.current.delete(item.id);
            }}
            onActivate={() => onActivate(item)}
            onFocus={() => onFocus(item.id)}
            onKeyDown={(event) => onKeyDown(event, item)}
          />
        );
      })}
    </div>
  );
}

function SourceTreeRow({
  item,
  focused,
  selected,
  onSelectedPath,
  setRef,
  onActivate,
  onFocus,
  onKeyDown,
}: {
  item: SourceTreeItem;
  focused: boolean;
  selected: boolean;
  onSelectedPath: boolean;
  setRef(element: HTMLDivElement | null): void;
  onActivate(): void;
  onFocus(): void;
  onKeyDown(event: KeyboardEvent<HTMLDivElement>): void;
}) {
  return (
    <div
      ref={setRef}
      role="treeitem"
      tabIndex={focused ? 0 : -1}
      aria-expanded={item.expandable ? item.expanded : undefined}
      aria-selected={selected}
      aria-level={item.depth + 1}
      aria-label={treeItemLabel(item)}
      className={`relative flex min-h-11 w-max min-w-full cursor-pointer items-center gap-1.5 pr-2 text-xs outline-none md:min-h-7 ${
        selected ? 'bg-btn-active text-accent' : 'text-ink-dim hover:bg-bg hover:text-ink'
      } focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]`}
      style={{ paddingLeft: item.depth * 16 + 8 }}
      onClick={onActivate}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 w-px ${onSelectedPath ? 'bg-accent' : 'bg-panel-edge'}`}
        style={{ left: item.depth * 16 + 3 }}
      />
      <span aria-hidden="true" className="w-3 shrink-0 text-center text-[11px]">
        {item.expandable ? item.expanded ? '▾' : '▸' : ''}
      </span>
      <span aria-hidden="true" className="w-3 shrink-0 text-center text-[10px]">
        {item.kind === 'folder' ? '□' : item.kind === 'file' ? '◇' : item.declaration.kind === 'function' ? 'ƒ' : 'v'}
      </span>
      <span className="flex-1 whitespace-nowrap">{item.name}</span>
      {item.kind === 'file' && item.file.declarations.length > 0 && (
        <span className="shrink-0 text-[10px] text-ink-dim" aria-hidden="true">{item.file.declarations.length}</span>
      )}
      {item.kind === 'declaration' && (
        <span className="shrink-0 text-[10px] text-ink-dim" aria-hidden="true">:{item.declaration.line}</span>
      )}
    </div>
  );
}

function CodeViewer({
  file,
  declaration,
  load,
  onBack,
  onRetry,
}: {
  file: SourceFile | null;
  declaration: SourceDeclaration | null;
  load: SourceLoadState;
  onBack(): void;
  onRetry(): void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const selectedLine = declaration?.line ?? null;
  const lines = load.status === 'ready' ? load.source.split('\n') : [];

  useEffect(() => {
    if (load.status !== 'ready' || selectedLine === null) return;
    scroller.current?.querySelector(`[data-line="${selectedLine}"]`)?.scrollIntoView({ block: 'center' });
  }, [load.status, load.source, selectedLine]);

  return (
    <>
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-panel-edge px-3 py-2">
        <button type="button" className="cursor-pointer text-xs text-accent hover:underline md:hidden" onClick={onBack}>← Browse</button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink">{file?.path ?? 'No file selected'}</p>
          {file && (
            <p className="mt-0.5 text-[10px] text-ink-dim">
              {load.status === 'ready' ? `${lines.length.toLocaleString()} lines · ` : ''}
              {file.declarations.length.toLocaleString()} declarations
            </p>
          )}
        </div>
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-bg">
        {!file && <Readout>Choose a file to read its source. Select a declaration to jump to it.</Readout>}
        {file && load.status === 'loading' && <Readout>Loading source…</Readout>}
        {file && load.status === 'error' && (
          <div className="m-4 max-w-xl rounded border border-error-edge bg-error-bg p-3 text-xs text-error-ink" role="alert">
            <p>Couldn’t load {file.path}. It may have changed since the source index was generated.</p>
            <div className="mt-3 flex gap-3">
              <button type="button" className="cursor-pointer text-accent underline" onClick={onRetry}>Retry</button>
              <button type="button" className="cursor-pointer text-accent underline" onClick={() => window.location.reload()}>Reload page</button>
            </div>
          </div>
        )}
        {file && load.status === 'ready' && (
          <pre tabIndex={0} aria-label={`Source for ${file.path}`} className="min-w-max py-3 text-xs leading-6 text-ink outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]">
            <code>
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                const highlighted = lineNumber === selectedLine;
                return (
                  <span
                    key={lineNumber}
                    data-line={lineNumber}
                    className={`grid min-h-6 grid-cols-[4rem_minmax(0,1fr)] ${highlighted ? 'bg-btn-active' : ''}`}
                  >
                    <span aria-hidden="true" className={`select-none border-r px-3 text-right ${highlighted ? 'border-accent text-accent' : 'border-panel-edge text-ink-dim'}`}>
                      {lineNumber}
                    </span>
                    <span className={`px-3 ${highlighted ? 'border-l-2 border-accent' : ''}`}>{line || '\u200b'}</span>
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </div>
    </>
  );
}

function MobilePaneButton({
  pane,
  current,
  onSelect,
  children,
}: {
  pane: MobilePane;
  current: MobilePane;
  onSelect(pane: MobilePane): void;
  children: string;
}) {
  const selected = pane === current;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`min-h-10 cursor-pointer rounded px-3 text-xs ${selected ? 'bg-btn-active text-accent' : 'text-ink-dim'}`}
      onClick={() => onSelect(pane)}
    >
      {children}
    </button>
  );
}

function Readout({ children }: { children: string }) {
  return <p className="m-4 rounded border border-panel-edge bg-panel p-3 text-xs text-ink-dim" role="status">{children}</p>;
}

function EmptySourceExplorer() {
  return (
    <div aria-label="Source explorer">
      <p className="rounded border border-panel-edge bg-panel p-4 text-sm text-ink-dim" role="status">
        No source files were indexed. Check the configured source roots and reload this page.
      </p>
    </div>
  );
}

function useSource(file: SourceFile | null, retry: number): SourceLoadState {
  const [load, setLoad] = useState<SourceLoadState>({ sourceId: null, status: 'idle', source: '' });
  useEffect(() => {
    if (!file) {
      setLoad({ sourceId: null, status: 'idle', source: '' });
      return;
    }
    const controller = new AbortController();
    setLoad({ sourceId: file.sourceId, status: 'loading', source: '' });
    void fetch(`/docs/source/${encodeURIComponent(file.sourceId)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`source request failed with ${response.status}`);
        return response.text();
      })
      .then((source) => setLoad({ sourceId: file.sourceId, status: 'ready', source }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoad({ sourceId: file.sourceId, status: 'error', source: '' });
      });
    return () => controller.abort();
  }, [file, retry]);
  if (file && load.sourceId !== file.sourceId) {
    return { sourceId: file.sourceId, status: 'loading', source: '' };
  }
  return load;
}

function treeItemLabel(item: SourceTreeItem): string {
  if (item.kind === 'folder') return `Folder ${item.name}, ${item.expanded ? 'expanded' : 'collapsed'}`;
  if (item.kind === 'file') {
    const count = item.file.declarations.length;
    return `File ${item.name}, ${count} declaration${count === 1 ? '' : 's'}`;
  }
  return `${item.declaration.kind === 'function' ? 'Function' : 'Variable'} ${item.name}, line ${item.declaration.line}`;
}

function union(left: ReadonlySet<string>, right: ReadonlySet<string>): Set<string> {
  return new Set([...left, ...right]);
}

function isTreeNavigationKey(
  key: string,
): key is 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End' {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key);
}

function isTextEntry(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}
