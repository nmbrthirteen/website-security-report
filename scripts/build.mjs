#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { renderReport, SECTION_KINDS } from './render.mjs'

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

const args = process.argv.slice(2)
const keepHtml = args.includes('--html')
const [input, output] = args.filter((arg) => arg !== '--html')
if (!input) fail('Usage: node scripts/build.mjs <report.json> [output.pdf] [--html]')

const source = resolve(input)
let report
try {
  report = JSON.parse(readFileSync(source, 'utf8'))
} catch (error) {
  fail(`Could not read ${input}: ${error.message}`)
}

function problems(value) {
  const found = []
  const strings = (list) => Array.isArray(list) && list.every((item) => typeof item === 'string')
  const pairs = (list) => Array.isArray(list) && list.every((item) => typeof item?.label === 'string' && typeof item?.value === 'string')
  if (typeof value?.title !== 'string' || !value.title) found.push('title must be a non-empty string')
  if (!Array.isArray(value?.sections) || value.sections.length === 0) found.push('sections must be a non-empty array')
  for (const [index, entry] of (value?.sections ?? []).entries()) {
    const at = `sections[${index}]${entry?.title ? ` "${entry.title}"` : ''}`
    if (typeof entry?.title !== 'string') found.push(`${at}: title must be a string`)
    if (!SECTION_KINDS.includes(entry?.kind)) found.push(`${at}: kind must be one of ${SECTION_KINDS.join(', ')}`)
    if (entry?.kind === 'table') {
      if (!strings(entry.columns)) found.push(`${at}: columns must be strings`)
      if (!Array.isArray(entry.rows) || !entry.rows.every((row) => strings(row) && row.length === entry.columns?.length)) {
        found.push(`${at}: every row must be strings, one per column`)
      }
    }
    if (entry?.kind === 'facts' && !pairs(entry.items)) found.push(`${at}: items must be { label, value } strings`)
    if (entry?.kind === 'steps' && !strings(entry.steps)) found.push(`${at}: steps must be strings`)
    if (entry?.kind === 'list' && !strings(entry.items)) found.push(`${at}: items must be strings`)
    if (entry?.kind === 'flow') {
      const nodes = Array.isArray(entry.columns) ? entry.columns.flat() : null
      if (!nodes?.every((item) => typeof item === 'string' || typeof item?.label === 'string')) {
        found.push(`${at}: columns must hold node labels or { label, tone } objects`)
      }
    }
  }
  for (const font of value?.theme?.fonts ?? []) {
    if (typeof font?.family !== 'string' || typeof font?.file !== 'string') found.push('theme.fonts entries need family and file')
  }
  return found
}

const found = problems(report)
if (found.length) fail(`${input} is not a valid report:\n- ${found.join('\n- ')}`)

if (report.theme?.fonts) {
  report.theme.fonts = report.theme.fonts.map((font) => {
    const file = resolve(dirname(source), font.file)
    if (!existsSync(file)) fail(`Font file not found: ${file}`)
    return { ...font, file }
  })
}

const target = resolve(output ?? `${basename(source).replace(/\.[^.]+$/, '')}.pdf`)
const html = renderReport(report)
if (keepHtml) writeFileSync(target.replace(/\.pdf$/i, '') + '.html', html)

const chrome = CHROME_PATHS.find((path) => path && existsSync(path))
if (!chrome) fail('Chrome, Chromium or Edge was not found. Set CHROME_PATH to the browser binary.')

const workdir = mkdtempSync(join(tmpdir(), 'website-security-report-'))
const page = join(workdir, 'report.html')
writeFileSync(page, html)
rmSync(target, { force: true })

const run = spawnSync(
  chrome,
  ['--headless', '--disable-gpu', '--no-pdf-header-footer', '--no-first-run', `--user-data-dir=${join(workdir, 'profile')}`, `--print-to-pdf=${target}`, pathToFileURL(page).href],
  { encoding: 'utf8', timeout: 60_000 },
)
rmSync(workdir, { recursive: true, force: true })

if (!existsSync(target)) fail(`The browser could not print the PDF.\n${run.stderr ?? ''}`)

const pages = (readFileSync(target, 'latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length
console.log(`${target}\n${pages} page${pages === 1 ? '' : 's'}`)
