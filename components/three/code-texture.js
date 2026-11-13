// Draws syntax-highlighted code into a canvas used as a WebGL texture.
export const SYNTAX = {
  comment: '#8b949e',
  string: '#a5d6ff',
  number: '#79c0ff',
  keyword: '#ff7b72',
  literal: '#79c0ff',
  tag: '#7ee787',
  func: '#d2a8ff',
  type: '#ffa657',
  ident: '#e6edf3',
  punct: '#9aa7b4',
  prompt: '#4af2a1',
}

const RE = /(\/\/.*$|#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:import|export|from|const|let|return|async|await|function|new|default|if|else|for|of|uniform|varying|void|float|vec2|vec3|vec4|class|extends|router)\b)|(\b(?:true|false|null|undefined)\b)|(<\/?[A-Za-z][\w.]*|\/?>)|([A-Za-z_$][\w$]*(?=\s*\())|([A-Z][\w$]*)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g
const KINDS = ['comment', 'string', 'number', 'keyword', 'literal', 'tag', 'func', 'type', 'ident', 'space', 'punct']

export function tokenize(code, { terminal = false } = {}) {
  return code.split('\n').map((line) => {
    if (terminal) {
      const prompt = line.match(/^(\S+@\S+:~\$)(.*)$/)
      if (prompt) return [{ text: prompt[1], color: SYNTAX.prompt }, { text: prompt[2], color: SYNTAX.ident }]
      if (line.startsWith('✓')) return [{ text: line, color: SYNTAX.tag }]
      return [{ text: line, color: SYNTAX.comment }]
    }
    const tokens = []
    for (const m of line.matchAll(RE)) {
      const kind = KINDS[m.slice(1).findIndex(Boolean)]
      tokens.push({ text: m[0], color: SYNTAX[kind] ?? SYNTAX.ident })
    }
    return tokens
  })
}

export const countChars = (lines) => lines.reduce((n, l) => n + l.reduce((m, t) => m + t.text.length, 0) + 1, 0)

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// visible: number of characters typed so far.
export function drawWindow(ctx, { width, height, title, lines, visible, cursor, terminal = false, font }) {
  ctx.clearRect(0, 0, width, height)
  const r = 18
  roundRect(ctx, 1, 1, width - 2, height - 2, r)
  ctx.fillStyle = terminal ? 'rgba(4,6,10,0.94)' : 'rgba(11,15,23,0.92)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(139,155,180,0.35)'
  ctx.lineWidth = 2
  ctx.stroke()

  // Title bar
  ctx.save()
  roundRect(ctx, 1, 1, width - 2, 52, r)
  ctx.clip()
  ctx.fillStyle = terminal ? 'rgba(17,23,34,0.95)' : 'rgba(22,27,34,0.95)'
  ctx.fillRect(0, 0, width, 52)
  ctx.restore()
  ;['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(30 + i * 24, 27, 7, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })
  ctx.font = `500 20px ${font}`
  ctx.fillStyle = '#8b949e'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(title, width / 2, 27)
  ctx.textAlign = 'left'

  const lineH = 34
  const top = 92
  const left = terminal ? 30 : 74
  ctx.font = `22px ${font}`
  let remaining = visible
  let cx = left
  let cy = top
  for (let i = 0; i < lines.length; i++) {
    cy = top + i * lineH
    if (!terminal) {
      ctx.fillStyle = '#3b4552'
      ctx.textAlign = 'right'
      ctx.fillText(String(i + 1), left - 22, cy)
      ctx.textAlign = 'left'
    }
    cx = left
    if (remaining <= 0) break
    for (const tok of lines[i]) {
      if (remaining <= 0) break
      const text = tok.text.slice(0, remaining)
      ctx.fillStyle = tok.color
      ctx.fillText(text, cx, cy)
      cx += ctx.measureText(text).width
      remaining -= text.length
    }
    remaining -= 1 // newline
    if (remaining < 0) break
  }
  if (cursor) {
    ctx.fillStyle = '#4af2a1'
    ctx.fillRect(cx + 2, cy - 13, 12, 26)
  }
}

// A single word as a sprite texture.
export function tokenCanvas(text, color, font) {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  ctx.font = `500 64px ${font}`
  const w = Math.ceil(ctx.measureText(text).width) + 24
  c.width = w
  c.height = 96
  ctx.font = `500 64px ${font}`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 12
  ctx.fillText(text, 12, 50)
  return c
}

export const monoFont = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains').trim()
  return v ? `${v}, monospace` : 'monospace'
}
