#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, renameSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [input, output] = process.argv.slice(2)
if (!input) {
  console.error('Usage: node scripts/pages.mjs <file.pdf> [output folder]')
  process.exit(1)
}

const pdf = resolve(input)
const folder = resolve(output ?? join(dirname(pdf), 'pages'))
mkdirSync(folder, { recursive: true })

const has = (command) => spawnSync(process.platform === 'win32' ? 'where' : 'which', [command]).status === 0
const run = (command, args) => spawnSync(command, args, { encoding: 'utf8' })

function renamePages(prefix) {
  const files = readdirSync(folder)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.png'))
    .sort((a, b) => Number(a.match(/(\d+)\.png$/)?.[1]) - Number(b.match(/(\d+)\.png$/)?.[1]))
  files.forEach((name, index) => renameSync(join(folder, name), join(folder, `page-${index + 1}.png`)))
  return files.length
}

let count = 0
if (has('pdftoppm')) {
  run('pdftoppm', ['-png', '-r', '110', pdf, join(folder, 'raw')])
  count = renamePages('raw')
} else if (has('mutool')) {
  run('mutool', ['draw', '-r', '110', '-o', join(folder, 'raw-%d.png'), pdf])
  count = renamePages('raw')
} else if (process.platform === 'darwin' && has('swift')) {
  const script = join(dirname(fileURLToPath(import.meta.url)), 'pages.swift')
  const result = run('swift', [script, pdf, folder])
  count = Number(result.stdout.trim()) || 0
  if (!count) console.error(result.stderr)
} else {
  console.error('No PDF renderer found. Install poppler (pdftoppm) or mupdf (mutool).')
  process.exit(1)
}

if (!count) {
  console.error('No pages were rendered.')
  process.exit(1)
}
for (let page = 1; page <= count; page += 1) console.log(join(folder, `page-${page}.png`))
