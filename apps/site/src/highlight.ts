/** A tiny TypeScript/JSX highlighter, just enough for the snippets on this page. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const TOKENS =
  /(\/\/.*$)|('(?:\\.|[^'\n])*'|"(?:\\.|[^"\n])*"|`(?:\\.|[^`])*`)|\b(import|from|export|const|let|await|async|function|return|for|of|yield|new|if|break|default|type|true|false)\b|\b(\d[\d_.]*)\b|([A-Za-z_$][\w$]*)(?=\s*\()/gm

export function highlight(code: string): string {
  let out = ''
  let last = 0
  for (const m of code.matchAll(TOKENS)) {
    out += esc(code.slice(last, m.index))
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : 'f'
    out += `<span class="tok-${cls}">${esc(m[0])}</span>`
    last = m.index! + m[0].length
  }
  return out + esc(code.slice(last))
}
