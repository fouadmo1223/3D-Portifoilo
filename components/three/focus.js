import { sceneState } from './scene-state'

// Page sections publish what the visitor is looking at; the 3D windows type it out.
// Each helper returns the { title, code } a CodeWindow channel expects.

const clip = (text, max) => {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim()
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}
const quote = (text, max) => `"${clip(text, max).replace(/"/g, "'")}"`

function wrap(text, width) {
  const lines = []
  let line = ''
  for (const word of String(text ?? '').split(/\s+/)) {
    if (line && (line + ' ' + word).length > width) { lines.push(line); line = word } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines
}

const fileName = (text, ext) => `${clip(text, 22).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'untitled'}.${ext}`

export function focusExperience(e, { from, to }) {
  const stack = e.technologies.slice(0, 4).map((x) => quote(x, 14)).join(', ')
  return {
    title: fileName(e.company, 'js'),
    code: [
      `// ${clip(e.company, 38)}`,
      'export const role = {',
      `  title: ${quote(e.position, 30)},`,
      `  from: ${quote(from, 16)},`,
      `  to: ${quote(to, 16)},`,
      stack ? `  stack: [${stack}],` : null,
      e.achievements.length ? `  wins: ${e.achievements.length},` : null,
      '}',
    ].filter(Boolean).join('\n'),
  }
}

export function focusPrinciple(index, title, body) {
  return {
    title: 'principles.js',
    code: [
      `// ${String(index + 1).padStart(2, '0')} — ${clip(title, 34)}`,
      ...wrap(body, 38).slice(0, 5).map((l) => `// ${l}`),
      '',
      `export default ${quote(title, 30)}`,
    ].join('\n'),
  }
}

export function terminalFromForm(form, status) {
  const filled = form.name || form.subject || form.email || form.message
  if (!filled && status === 'idle') return null
  const lines = ['fouad@portfolio:~$ npm run contact', '✓ connected · replies within a day']
  if (form.name) lines.push(`fouad@portfolio:~$ say --from ${quote(form.name, 22)}`)
  if (form.subject) lines.push(`> about: ${clip(form.subject, 30)}`)
  if (form.email) lines.push(`> reply-to: ${clip(form.email, 28)}`)
  if (form.message) lines.push(`> message: ${form.message.trim().length} chars`)
  if (status === 'sending') lines.push('> sending…')
  if (status === 'sent') lines.push('✓ delivered — talk soon')
  if (status === 'error') lines.push('✗ failed — try again')
  return { code: lines.join('\n'), instant: true }
}

export const setFocus = (value) => { sceneState.focus = value }
export const setTerminal = (value) => { sceneState.terminal = value }
