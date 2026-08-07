export const PAGE_STYLE = `
:root {
  --bg: #f7f6f3;
  --panel: #ffffff;
  --ink: #1b1a17;
  --muted: #6b675f;
  --line: #ddd9d0;
  --accent: #7a5c2e;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #16151a;
    --panel: #1e1d23;
    --ink: #e8e6e1;
    --muted: #9a958c;
    --line: #33313a;
    --accent: #d3b075;
  }
}
:root[data-theme='dark'] {
  --bg: #16151a;
  --panel: #1e1d23;
  --ink: #e8e6e1;
  --muted: #9a958c;
  --line: #33313a;
  --accent: #d3b075;
}
* { box-sizing: border-box; }
body {
  margin: 0 auto;
  padding: 2.5rem 1.25rem 6rem;
  max-width: 68rem;
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
}
h1 { font-size: 1.9rem; margin: 0 0 .4rem; letter-spacing: -.02em; }
h2 { font-size: 1.15rem; margin: 2.6rem 0 .9rem; padding-bottom: .4rem; border-bottom: 1px solid var(--line); }
h4 { font-size: .9rem; margin: 1.2rem 0 .4rem; color: var(--accent); font-weight: 600; }
.lede { color: var(--muted); max-width: 46rem; margin: 0 0 1rem; }
.note { color: var(--muted); margin: 0 0 1rem; }
.scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
table { border-collapse: collapse; width: 100%; font-size: .85rem; }
th, td { text-align: left; padding: .5rem .7rem; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 600; white-space: nowrap; }
tbody tr:last-child td { border-bottom: none; }
code { font-size: .82rem; color: var(--accent); word-break: break-word; }
code.sym { color: var(--ink); opacity: .78; margin-right: .1rem; }
details { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); margin-bottom: .5rem; padding: .55rem .8rem; }
summary { cursor: pointer; font-weight: 600; }
.count { color: var(--muted); font-weight: 400; font-size: .8rem; }
details ul { margin: .6rem 0 .2rem; padding-left: 1.1rem; }
details li { margin: .18rem 0; color: var(--ink); font-size: .85rem; }
.folder { margin-top: .5rem; }
`;
