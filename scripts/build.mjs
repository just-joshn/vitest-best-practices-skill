#!/usr/bin/env node
//   node scripts/build.mjs --vitest <vitest checkout>          write topic files
//   node scripts/build.mjs --vitest <vitest checkout> --check  verify, exit 1 on any problem

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

const root = resolve(dirname(new URL(import.meta.url).pathname), '..')
const skillDir = join(root, 'vitest-best-practices')
const sources = JSON.parse(readFileSync(join(root, 'sources.json'), 'utf8'))

const args = process.argv.slice(2)
const check = args.includes('--check')
const vitestDir = args.includes('--vitest') ? args[args.indexOf('--vitest') + 1] : undefined
if (!vitestDir) fail('usage: build.mjs --vitest <vitest checkout> [--check]')

const head = execFileSync('git', ['-C', vitestDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (head !== sources.commit) fail(`vitest checkout is at ${head}, sources.json pins ${sources.commit}`)
const docsDir = join(vitestDir, 'docs')

const HEADER = [
  `<!-- Verbatim excerpts from the official Vitest documentation, ${sources.ref} (${sources.repo}/tree/${sources.commit}/docs).`,
  '     Only this comment, the H1, the table of contents, and the "Source:" comments are generated. Every other line is copied from the docs.',
  `     Root-relative links (e.g. /api/vi) resolve against ${sources.site}. Do not edit. Regenerate with scripts/build.mjs. -->`,
].join('\n')
const SOURCE_LINE = /^<!-- Source: (\S+) \| docs\/(\S+?)(?: \| section: (.+))? -->$/

function fail(message) {
  console.error(message)
  process.exit(1)
}

function stripFrontmatter(text) {
  if (!text.startsWith('---\n')) return text
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) fail('unterminated frontmatter')
  return text.slice(end + 5).replace(/^\n+/, '')
}

function resolveFile(file) {
  return stripFrontmatter(readFileSync(file, 'utf8'))
    .replace(/<!--\s*@include:\s*(\S+?)\s*-->/g, (directive, target) => {
      if (/[{#]/.test(target)) fail(`${file}: unsupported include ${directive}`)
      return resolveFile(resolve(dirname(file), target)).replace(/\n+$/, '')
    })
    .replace(/^<<< (\S+)( \[[^\]]+\])?$/gm, (directive, target, title = '') => {
      if (/[{#]/.test(target)) fail(`${file}: unsupported snippet import ${directive}`)
      const code = readFileSync(resolve(dirname(file), target), 'utf8').replace(/\n$/, '')
      return `\`\`\`${extname(target).slice(1)}${title}\n${code}\n\`\`\``
    })
}

const pageCache = new Map()
function page(docPath) {
  if (!pageCache.has(docPath)) pageCache.set(docPath, resolveFile(join(docsDir, docPath)))
  return pageCache.get(docPath)
}

function headings(lines) {
  const found = []
  let fence = null
  lines.forEach((line, index) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !line.trim().slice(marker[1].length)) fence = null
      return
    }
    if (marker) fence = marker[1]
    else if (/^#{1,6} /.test(line)) found.push({ index, level: line.match(/^#+/)[0].length, line })
  })
  return found
}

function excerpt(spec) {
  const [docPath, heading] = spec.split(' :: ')
  const text = page(docPath)
  if (!heading) return { docPath, heading, body: text.replace(/\n+$/, '') }
  const lines = text.split('\n')
  const all = headings(lines)
  const matches = all.filter(h => h.line === heading)
  if (matches.length !== 1) fail(`${spec}: heading found ${matches.length} times, expected exactly 1`)
  const [start] = matches
  const next = all.find(h => h.index > start.index && h.level <= start.level)
  const body = lines.slice(start.index, next ? next.index : lines.length).join('\n').replace(/\n+$/, '')
  return { docPath, heading, body }
}

function headingText(line) {
  return line.replace(/^#+ /, '').replace(/\{#[^}]*\}/g, '').replace(/<(\w+)[^>]*>.*?<\/\1>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function pageUrl(docPath) {
  return `${sources.site}/${docPath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')}`
}

function sourceComment({ docPath, heading }) {
  return `<!-- Source: ${pageUrl(docPath)} | docs/${docPath}${heading ? ` | section: ${heading}` : ''} -->`
}

function tableOfContents(excerpts) {
  return excerpts.flatMap((ex, i) => {
    const hs = headings(ex.body.split('\n'))
    const top = hs[0]
    const childLevel = top ? Math.min(...hs.filter(h => h.level > top.level).map(h => h.level)) : 0
    const children = hs.filter(h => h.level === childLevel).map(h => `   - ${headingText(h.line)}`)
    return [`${i + 1}. ${top ? headingText(top.line) : ex.docPath} (${ex.docPath})`, ...children]
  })
}

function render(topic) {
  const excerpts = topic.excerpts.map(excerpt)
  const parts = [HEADER, `# ${topic.title}`, ['## Table of Contents', '', ...tableOfContents(excerpts)].join('\n')]
  for (const ex of excerpts) parts.push(sourceComment(ex), ex.body)
  return `${parts.join('\n\n')}\n`
}

function verifyVerbatim(path, content, topic) {
  const problems = []
  const [preamble, ...segments] = content.split(/^(?=<!-- Source: )/m)
  const pre = preamble.split('\n')
  const headerLines = HEADER.split('\n').length
  if (pre.slice(0, headerLines).join('\n') !== HEADER) problems.push('header comment changed')
  pre.slice(headerLines).forEach(line => {
    if (line === '' || line === `# ${topic.title}` || line === '## Table of Contents' || /^(\d+\. | {3}- )\S/.test(line)) return
    problems.push(`unexpected generated line: ${JSON.stringify(line)}`)
  })
  if (segments.length !== topic.excerpts.length) problems.push(`${segments.length} excerpts, sources.json lists ${topic.excerpts.length}`)
  for (const segment of segments) {
    const [comment, ...rest] = segment.split('\n')
    const match = comment.match(SOURCE_LINE)
    if (!match) { problems.push(`bad source comment: ${comment}`); continue }
    const [, url, docPath, heading] = match
    if (url !== pageUrl(docPath)) problems.push(`source URL ${url} does not match docs/${docPath}`)
    const body = rest.join('\n').replace(/^\n+/, '').replace(/\n+$/, '')
    if (!body) problems.push(`empty excerpt from docs/${docPath}`)
    if (!page(docPath).includes(body)) problems.push(`excerpt is not verbatim text of docs/${docPath}`)
    if (heading && !body.startsWith(`${heading}\n`)) problems.push(`excerpt does not start at "${heading}" in docs/${docPath}`)
  }
  return problems.map(p => `${relative(root, path)}: ${p}`)
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

const problems = []
const expected = new Map(Object.entries(sources.topics).map(([out, topic]) => [join(skillDir, out), { topic, content: render(topic) }]))

for (const [path, { topic, content }] of expected) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (check) {
    if (current !== content) problems.push(`out of date: ${relative(root, path)}`)
    if (current) problems.push(...verifyVerbatim(path, current, topic))
  }
  else {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }
}

const playbookDir = join(skillDir, 'playbooks')
const skillPath = join(skillDir, 'SKILL.md')
for (const path of walk(skillDir)) {
  if (path === skillPath || expected.has(path) || (dirname(path) === playbookDir && path.endsWith('.md'))) continue
  problems.push(`unexpected file (not SKILL.md, a playbook, or in sources.json): ${relative(root, path)}`)
}

const corpus = walk(docsDir).filter(p => p.endsWith('.md')).map(p => readFileSync(p, 'utf8')).join('\n')
const CITATION = /\[[^\]]+\]\(([^\s)]+\.md) "([^"]+)"\)/g
const LINK = /\[[^\]]+\]\(([^\s)]+\.md)(?: "[^"]*")?\)/g
const MIN_QUOTE = 20
const PLAYBOOK_SECTIONS = [
  '## When to use',
  '## Investigate and establish evidence',
  '## Design and implement',
  '## Verify behavior and challenge findings',
  '## Acceptance evidence',
  '## References',
]

const excerptTextCache = new Map()
function excerptText(path) {
  if (!excerptTextCache.has(path)) {
    const [, ...segments] = readFileSync(path, 'utf8').split(/^(?=<!-- Source: )/m)
    excerptTextCache.set(path, segments.map(seg => seg.split('\n').slice(1).join('\n')).join('\n'))
  }
  return excerptTextCache.get(path)
}

function checkLine(file, lineNo, line, report) {
  const where = `${relative(skillDir, file)}:${lineNo}`
  let rest = line
  let cited = 0
  for (const [whole, target, quote] of line.matchAll(CITATION)) {
    const path = resolve(dirname(file), target)
    rest = rest.replace(whole, '')
    if (!expected.has(path)) { report(`${where}: citation target is not a reference file: ${target}`); continue }
    if (quote.length < MIN_QUOTE) report(`${where}: citation quote shorter than ${MIN_QUOTE} characters: "${quote}"`)
    if (!excerptText(path).includes(quote)) report(`${where}: quote not found verbatim in ${target}: "${quote}"`)
    cited++
  }
  for (const [, target] of rest.matchAll(LINK)) {
    if (!existsSync(resolve(dirname(file), target))) report(`${where}: link target missing: ${target}`)
  }
  for (const [, code] of rest.replace(LINK, '').matchAll(/`([^`]+)`/g)) {
    if (!corpus.includes(code)) report(`${where}: \`${code}\` does not appear in the Vitest docs`)
  }
  return { cited, hasCode: /`/.test(rest.replace(LINK, '')) }
}

function linkedFiles(file) {
  return [...readFileSync(file, 'utf8').matchAll(LINK)].map(([, target]) => resolve(dirname(file), target))
}

const playbooks = existsSync(playbookDir) ? readdirSync(playbookDir).filter(f => f.endsWith('.md')).map(f => join(playbookDir, f)) : []
if (!playbooks.length) problems.push('no playbooks found')
const covered = new Set()

for (const file of playbooks) {
  const report = msg => problems.push(msg)
  const lines = readFileSync(file, 'utf8').split('\n')
  const name = relative(skillDir, file)
  if (!/^# \S/.test(lines[0])) report(`${name}:1: first line must be the H1 title`)
  const sections = []
  const lastNumber = new Map()
  lines.slice(1).forEach((line, i) => {
    const lineNo = i + 2
    if (!line.trim()) return
    if (/^#{1,6} /.test(line)) {
      if (!/^## /.test(line)) report(`${name}:${lineNo}: only ## headings are allowed after the H1`)
      sections.push(line)
      return
    }
    const item = line.match(/^(?: {3})?(?:- |(?<number>\d+)\. )(?<content>.+)$/)
    if (!item) return report(`${name}:${lineNo}: only headings, single-line list items, and blank lines are allowed`)
    const { number, content } = item.groups
    if (number) {
      const expectedNumber = (lastNumber.get(sections.length) ?? 0) + 1
      if (Number(number) !== expectedNumber) report(`${name}:${lineNo}: numbered item is ${number}, expected ${expectedNumber}`)
      lastNumber.set(sections.length, Number(number))
    }
    const section = sections.at(-1)
    if (section === '## References') {
      if (!/^\[[^\]]+\]\(\.\.\/references\/[^\s)]+\.md\)$/.test(content)) report(`${name}:${lineNo}: References items must be a single link to a reference file`)
      checkLine(file, lineNo, content, report)
      return
    }
    const { cited, hasCode } = checkLine(file, lineNo, content, report)
    if (cited) return
    const marker = section === '## When to use' ? 'When ' : 'Process: '
    if (!content.startsWith(marker)) report(`${name}:${lineNo}: uncited step must start with "${marker}" or cite the docs`)
    else if (hasCode) report(`${name}:${lineNo}: uncited step names a Vitest identifier; cite the docs for it`)
  })
  if (!lines.some(line => /^\d+\. Process: Delegate /.test(line))) report(`${name}: needs a "Process: Delegate ..." step naming the work to hand to a subagent`)
  if (sections.join('\n') !== PLAYBOOK_SECTIONS.join('\n')) report(`${name}: sections must be exactly, in order: ${PLAYBOOK_SECTIONS.join(' / ')}`)
  for (const path of linkedFiles(file)) if (expected.has(path)) covered.add(path)
}

for (const path of expected.keys()) {
  if (!covered.has(path)) problems.push(`orphaned reference (no playbook links it): ${relative(skillDir, path)}`)
}

const skillLines = readFileSync(skillPath, 'utf8').split('\n')
let inFence = false
skillLines.forEach((line, i) => {
  if (line.startsWith('```')) { inFence = !inFence; return }
  if (!inFence) checkLine(skillPath, i + 1, line, msg => problems.push(msg))
})
const skillLinks = new Set(linkedFiles(skillPath))
for (const file of playbooks) {
  if (!skillLinks.has(file)) problems.push(`SKILL.md never links playbook: ${relative(skillDir, file)}`)
}

if (problems.length) fail(problems.join('\n'))
console.log(`${check ? 'verified' : 'wrote'} ${expected.size} reference files and ${playbooks.length} playbooks against ${sources.ref} (${sources.commit})`)
