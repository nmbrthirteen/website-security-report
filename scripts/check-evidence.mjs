#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'

const [input, root = '.'] = process.argv.slice(2)
if (!input) {
  console.error('Usage: node scripts/check-evidence.mjs <evidence.md> [repo root]')
  process.exit(1)
}

const repo = resolve(root)
const cells = (line) =>
  line
    .slice(1, line.endsWith('|') ? -1 : undefined)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, '|').trim())

const rows = readFileSync(resolve(input), 'utf8')
  .split('\n')
  .filter((line) => line.startsWith('|') && !/^\|\s*:?-/.test(line))
  .map(cells)

const [header, ...body] = rows
const column = (name) => header?.findIndex((cell) => cell.toLowerCase() === name) ?? -1
const sourceAt = column('source')
const enforcedAt = column('enforced by')
const labelAt = column('label')
const valueAt = column('value')
if (sourceAt < 0) {
  console.error('The evidence table needs a Source column.')
  process.exit(1)
}

const files = new Map()
const lines = (file) => {
  if (!files.has(file)) files.set(file, readFileSync(file, 'utf8').split('\n'))
  return files.get(file)
}

function locate(path, start, end) {
  const file = isAbsolute(path) ? path : join(repo, path)
  if (!existsSync(file)) return { problem: `${path} does not exist` }
  const text = lines(file)
  const first = Number(start)
  const last = Number(end ?? start)
  if (first < 1 || last > text.length || last < first) return { problem: `${path}:${start}${end ? `-${end}` : ''} is outside its ${text.length} lines` }
  return { line: text[first - 1].trim().slice(0, 140) }
}

const REFERENCE = /(?:^|[\s(`])((?:[\w@.-]+\/)*[\w@.-]+\.[A-Za-z][\w]*):(\d+)(?:-(\d+))?/g

let problems = 0
const report = (tag, name, detail) => console.log(`${tag.padEnd(8)}${name}\n        ${detail}`)

for (const row of body) {
  const source = (row[sourceAt] ?? '').replace(/`/g, '')
  const name = `${row[labelAt] ?? ''}: ${row[valueAt] ?? ''}`
  if (/^not found/i.test(source)) {
    report('absent', name, source)
  } else {
    const match = source.match(/^(.+?):(\d+)(?:-(\d+))?$/)
    if (!match) {
      problems += 1
      report('bad', name, `Source "${source}" is not path:line`)
      continue
    }
    const found = locate(match[1], match[2], match[3])
    if (found.problem) {
      problems += 1
      report('missing', name, found.problem)
      continue
    }
    report('ok', name, `${match[1]}:${match[2]}  ${found.line}`)
  }
  for (const [, path, start, end] of (row[enforcedAt] ?? '').matchAll(REFERENCE)) {
    if (!path.includes('/')) continue
    const found = locate(path, start, end)
    if (found.problem) {
      problems += 1
      report('missing', `${name} (enforced by)`, found.problem)
    }
  }
}

console.log(`\n${body.length} rows, ${problems} problem${problems === 1 ? '' : 's'}`)
process.exit(problems ? 1 : 0)
