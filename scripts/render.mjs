import { pathToFileURL } from 'node:url'

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const inline = (value) =>
  escape(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const arrow =
  '<svg class="arrow" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h20M15 1l6 5-6 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>'

const facts = (items) =>
  `<dl class="facts">${items.map((item) => `<div><dt>${inline(item.label)}</dt><dd>${inline(item.value)}</dd></div>`).join('')}</dl>`

const node = (entry) => {
  const { label, tone = 'plain' } = typeof entry === 'string' ? { label: entry } : entry
  return `<div class="node ${tone === 'guard' ? 'guard' : 'plain'}">${inline(label)}</div>`
}

const bodies = {
  flow: (entry) =>
    `<div class="flow">${entry.columns
      .map((column) => `<div class="column">${(Array.isArray(column) ? column : [column]).map(node).join('')}</div>`)
      .join(arrow)}</div>`,
  table: (entry) =>
    `<table><thead><tr>${entry.columns.map((column) => `<th>${inline(column)}</th>`).join('')}</tr></thead><tbody>${entry.rows
      .map((row) => `<tr>${row.map((value) => `<td>${inline(value)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`,
  facts: (entry) => facts(entry.items),
  steps: (entry) =>
    `<ol class="steps">${entry.steps.map((step) => `<li>${inline(step)}</li>`).join(`<li class="gap" aria-hidden="true">${arrow}</li>`)}</ol>`,
  list: (entry) => `<ul>${entry.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`,
}

export const SECTION_KINDS = Object.keys(bodies)

const section = (entry) => `<section><h2>${inline(entry.title)}</h2>${bodies[entry.kind](entry)}</section>`

const fontFaces = (fonts = []) =>
  fonts
    .map((font) => {
      const format = font.file.endsWith('.woff2') ? 'woff2' : font.file.endsWith('.woff') ? 'woff' : 'truetype'
      return `@font-face{font-family:'${font.family}';font-weight:${font.weight ?? 400};font-style:${font.style ?? 'normal'};src:url('${pathToFileURL(font.file).href}') format('${format}')}`
    })
    .join('')

function styles(theme = {}) {
  const ink = theme.ink ?? '#111214'
  const family = theme.fontFamily ? `'${theme.fontFamily}',` : ''
  return `${fontFaces(theme.fonts)}
:root{--ink:${ink};--text:#1b1d1f;--soft:#5f666a;--rule:#e3e5e6}
@page{size:A4;margin:14mm 16mm 12mm}
*{box-sizing:border-box}
body{margin:0;font-family:${family}-apple-system,'Segoe UI','Helvetica Neue',sans-serif;font-size:9pt;line-height:1.45;color:var(--text);font-variant-numeric:tabular-nums;-webkit-print-color-adjust:exact;print-color-adjust:exact}
code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em}
header{padding-bottom:14px;border-bottom:1.5px solid var(--ink)}
h1{font-size:22pt;line-height:1.1;font-weight:600;margin:0;color:var(--ink)}
h2{font-size:11.5pt;font-weight:600;margin:0 0 6px;color:var(--ink);break-after:avoid}
section{margin-top:16px;break-inside:avoid}
.flow{display:flex;align-items:center;gap:8px;margin-top:4px}
.flow .column{flex:1;display:flex;flex-direction:column;gap:6px}
.arrow{width:18px;flex:none;color:var(--soft)}
.node{border:1px solid var(--rule);border-radius:6px;padding:7px 10px;font-weight:500;white-space:nowrap}
.node.guard{background:var(--ink);border-color:var(--ink);color:#fff}
table{width:100%;border-collapse:collapse}
tr{break-inside:avoid}
th{font-weight:500;text-align:left;color:var(--soft);font-size:8.5pt;border-bottom:1px solid var(--ink)}
th,td{padding:4px 12px 4px 0;vertical-align:top;text-align:left}
td{border-bottom:1px solid var(--rule)}
.facts{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;margin:0}
.facts div{display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid var(--rule);break-inside:avoid}
.facts dt{color:var(--soft)}
.facts dd{margin:0;font-weight:500;text-align:right}
.steps{list-style:none;padding:0;margin:4px 0 0;display:flex;align-items:center;gap:10px}
.steps li{font-size:14pt;font-weight:600;color:var(--ink);line-height:1.2}
.steps li.gap{display:flex}
ul{margin:0;padding-left:16px}
li{margin:3px 0}
`
}

export function renderReport(report) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(report.title)}</title><style>${styles(report.theme)}</style></head><body>
<header><h1>${escape(report.title)}</h1></header>
${report.sections.map(section).join('\n')}
</body></html>`
}
