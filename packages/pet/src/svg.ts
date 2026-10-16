/**
 * A tiny SVG markup builder. The pet is re-drawn every frame as a string and swapped
 * in with one `innerHTML` assignment, which is fast for a drawing this size and keeps
 * the library free of any rendering framework.
 */

export type Attrs = Record<string, string | number | boolean | null | undefined>
export type Child = string | false | null | undefined | Child[]

// SVG attributes that are genuinely camelCase; everything else is written kebab-case.
const CAMEL = new Set(['viewBox', 'patternUnits', 'gradientUnits', 'stdDeviation', 'preserveAspectRatio', 'clipPathUnits'])

const kebab = (k: string) => (CAMEL.has(k) ? k : k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()))

/** Round to 2 decimals and drop trailing zeros, keeping the markup small. */
export const n = (v: number) => {
  const r = Math.round(v * 100) / 100
  return Object.is(r, -0) ? '0' : String(r)
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function flat(children: Child[], out: string[] = []): string[] {
  for (const c of children) {
    if (Array.isArray(c)) flat(c, out)
    else if (c) out.push(c)
  }
  return out
}

/** `h('rect', { x: 1, strokeWidth: 2 })` → `<rect x="1" stroke-width="2"/>` */
export function h(tag: string, attrs: Attrs | null, ...children: Child[]): string {
  let a = ''
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k]
      if (v == null || v === false) continue
      a += ` ${kebab(k)}="${typeof v === 'number' ? n(v) : v === true ? '' : esc(v)}"`
    }
  }
  const inner = flat(children).join('')
  return inner ? `<${tag}${a}>${inner}</${tag}>` : `<${tag}${a}/>`
}

/** Join a list of points / path pieces with numbers rounded. */
export const path = (strings: TemplateStringsArray, ...values: number[]) =>
  strings.reduce((acc, s, i) => acc + s + (i < values.length ? n(values[i]) : ''), '')
