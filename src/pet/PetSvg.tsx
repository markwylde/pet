import type { ReactNode } from 'react'
import type { EyeShape, Pose } from './pose'

const PHOSPHOR = '#62ffb0'
const PHOSPHOR_DIM = '#2f9e6a'
const TEAR = '#8fdcff'
const PINK = '#ff6f9b'

// Screen geometry (local coords: feet at 0,0; body grows upward)
const SCREEN = { x: -42, y: -124, w: 84, h: 66 }
const EYE_Y = -100
const EYE_DX = 17
const MOUTH_Y = -75

interface Props {
  pose: Pose
  time: number
  viewBox?: string
}

export function PetSvg({ pose: p, time, viewBox = '-120 -250 240 290' }: Props) {
  const bodyTransform =
    `translate(${p.x} ${p.y}) translate(0 -80) rotate(${p.rot}) translate(0 80) ` + `scale(${p.sx} ${p.sy})`
  const fxTransform = `translate(${p.x} ${p.y})`
  const lift = Math.max(0, -p.y)
  const shadowScale = Math.max(0.35, 1 - lift / 120) * (p.propeller > 0 ? 0.6 : 1)

  return (
    <svg viewBox={viewBox} width="100%" height="100%" style={{ overflow: 'visible' }}>
      <Defs />

      {/* ground shadow */}
      <ellipse cx={p.x} cy={6} rx={44 * shadowScale} ry={7 * shadowScale} fill="rgba(0,0,0,0.22)" />

      {p.speedLines > 0 && <SpeedLines t={time} angle={p.speedAngle} k={p.speedLines} transform={fxTransform} />}

      <g transform={bodyTransform}>
        {p.flame > 0 && <Flame t={time} k={p.flame} />}
        <Legs l={p.legL} r={p.legR} />
        <Stand />
        <Antenna sway={p.antenna} propeller={p.propeller} t={time} />
        <Monitor />
        <Screen p={p} t={time} />
        {p.keyboard > 0 && <Keyboard k={p.keyboard} t={time} />}
        <Arm side="L" angle={p.armL} />
        <Arm side="R" angle={p.armR} />
        {p.sweat > 0.01 && <Sweat k={p.sweat} t={time} />}
      </g>

      <g transform={fxTransform}>
        {p.hearts > 0 && <Hearts t={p.hearts} />}
        {p.zzz > 0 && <Zzz t={p.zzz} />}
        {p.sparkles > 0 && <Sparkles t={p.sparkles} />}
        {p.cloud > 0.01 && <RainCloud k={p.cloud} t={time} />}
        {p.gears > 0 && <Gears t={p.gears} />}
      </g>
    </svg>
  )
}

function Defs() {
  return (
    <defs>
      <linearGradient id="pet-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3ead6" />
        <stop offset="1" stopColor="#d9cbad" />
      </linearGradient>
      <linearGradient id="pet-body-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="0.25" stopColor="rgba(255,255,255,0)" />
        <stop offset="0.8" stopColor="rgba(0,0,0,0)" />
        <stop offset="1" stopColor="rgba(0,0,0,0.12)" />
      </linearGradient>
      <radialGradient id="pet-screen" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stopColor="#14432d" />
        <stop offset="1" stopColor="#06180f" />
      </radialGradient>
      <linearGradient id="pet-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.22)" />
        <stop offset="0.4" stopColor="rgba(255,255,255,0.02)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <pattern id="pet-scan" width="4" height="3" patternUnits="userSpaceOnUse">
        <rect width="4" height="1" fill="rgba(0,0,0,0.28)" />
      </pattern>
      <filter id="pet-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="pet-flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff6c2" />
        <stop offset="0.35" stopColor="#ffb02e" />
        <stop offset="1" stopColor="rgba(255,70,30,0)" />
      </linearGradient>
      <clipPath id="pet-screen-clip">
        <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={10} />
      </clipPath>
    </defs>
  )
}

// ---------- body parts ----------

function Monitor() {
  return (
    <g>
      <rect x={-58} y={-142} width={116} height={106} rx={22} fill="url(#pet-body)" stroke="#8a7a5c" strokeWidth={2.5} />
      <rect x={-58} y={-142} width={116} height={106} rx={22} fill="url(#pet-body-side)" />
      {/* bezel */}
      <rect x={-47} y={-129} width={94} height={76} rx={14} fill="#b8a888" stroke="#8a7a5c" strokeWidth={1.5} />
      {/* vents + power LED */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-40 + i * 7} y1={-45} x2={-37 + i * 7} y2={-41} stroke="#a8977a" strokeWidth={2} strokeLinecap="round" />
      ))}
      <circle cx={40} cy={-44} r={2.6} fill={PHOSPHOR} filter="url(#pet-glow)" />
    </g>
  )
}

function Stand() {
  return (
    <g>
      <rect x={-14} y={-40} width={28} height={12} fill="#cbbb9c" stroke="#8a7a5c" strokeWidth={2} />
      <rect x={-34} y={-31} width={68} height={11} rx={5} fill="url(#pet-body)" stroke="#8a7a5c" strokeWidth={2.5} />
    </g>
  )
}

function Legs({ l, r }: { l: number; r: number }) {
  const leg = (x: number, lift: number) => (
    <g>
      <path d={`M ${x * 0.7} -22 Q ${x * 0.95} ${-12 - lift / 2} ${x} ${-6 - lift}`} stroke="#5d5140" strokeWidth={4} fill="none" strokeLinecap="round" />
      <ellipse cx={x + Math.sign(x) * 3} cy={-4 - lift} rx={12} ry={5.5} fill="#e55d4f" stroke="#8a3a30" strokeWidth={2} />
    </g>
  )
  return (
    <g>
      {leg(-18, l)}
      {leg(18, r)}
    </g>
  )
}

function Arm({ side, angle }: { side: 'L' | 'R'; angle: number }) {
  const sx = side === 'L' ? -57 : 57
  const rot = side === 'L' ? angle : -angle
  return (
    <g transform={`translate(${sx} -82) rotate(${rot})`}>
      <path d="M 0 0 Q 4 16 0 30" stroke="#5d5140" strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={0} r={4} fill="#cbbb9c" stroke="#8a7a5c" strokeWidth={1.5} />
      <circle cx={0} cy={33} r={7} fill="#f7f1e3" stroke="#8a7a5c" strokeWidth={2} />
    </g>
  )
}

function Antenna({ sway, propeller, t }: { sway: number; propeller: number; t: number }) {
  return (
    <g transform={`translate(14 -141) rotate(${sway})`}>
      <path d="M 0 0 Q 2 -12 6 -24" stroke="#5d5140" strokeWidth={3} fill="none" strokeLinecap="round" />
      {propeller > 0 ? (
        <Propeller t={t} speed={propeller} />
      ) : (
        <circle cx={6} cy={-27} r={5} fill={PINK} stroke="#a33b5b" strokeWidth={1.5} />
      )}
    </g>
  )
}

function Propeller({ t, speed }: { t: number; speed: number }) {
  const spin = Math.cos(t * Math.PI * 2 * 3 * speed)
  const blur = speed > 2
  return (
    <g transform="translate(6 -27)">
      {blur && <ellipse cx={0} cy={-2} rx={24} ry={3.5} fill="rgba(255,255,255,0.45)" stroke="rgba(100,90,70,0.3)" />}
      <g transform={`scale(${spin} 1)`} opacity={blur ? 0.5 : 1}>
        <path d="M 0 -2 C 8 -7 20 -6 22 -2 C 20 2 8 2 0 -2 Z" fill="#4fb3ff" stroke="#24689a" strokeWidth={1.2} />
        <path d="M 0 -2 C -8 -7 -20 -6 -22 -2 C -20 2 -8 2 0 -2 Z" fill="#ffd34f" stroke="#a3841f" strokeWidth={1.2} />
      </g>
      <circle cx={0} cy={-2} r={3.5} fill={PINK} stroke="#a33b5b" strokeWidth={1.2} />
    </g>
  )
}

// ---------- screen & face ----------

function Screen({ p, t }: { p: Pose; t: number }) {
  const jitter = p.glitch > 0 ? Math.sin(t * 91) * 4 * p.glitch : 0
  const hideMouth = p.progress >= 0 || p.code > 0 || p.spinner > 0
  return (
    <g clipPath="url(#pet-screen-clip)">
      <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} fill="url(#pet-screen)" />
      <g transform={`translate(${jitter} 0)`} filter="url(#pet-glow)">
        {p.blush > 0.01 && (
          <g fill={PINK} opacity={p.blush * 0.55}>
            <ellipse cx={-29} cy={-82} rx={7} ry={4} />
            <ellipse cx={29} cy={-82} rx={7} ry={4} />
          </g>
        )}
        <Eye cx={-EYE_DX + p.lookX} cy={EYE_Y + p.lookY} shape={p.eye} open={p.eyeOpen} side="L" t={t} />
        <Eye cx={EYE_DX + p.lookX} cy={EYE_Y + p.lookY} shape={p.eye} open={p.eyeOpen} side="R" t={t} />
        {p.brow > 0.02 && <Brows k={p.brow} lx={p.lookX} ly={p.lookY} />}
        {!hideMouth && <Mouth curve={p.mouthCurve} open={p.mouthOpen} width={p.mouthWidth} dx={p.lookX * 0.5} dy={p.lookY * 0.4} />}
        {p.progress >= 0 && <ProgressBar k={p.progress} />}
        {p.code > 0 && <Code t={p.code} />}
        {p.spinner > 0 && <Spinner t={p.spinner} />}
        {p.tears > 0.01 && <Tears k={p.tears} t={t} lx={p.lookX} />}
      </g>
      {p.glitch > 0 && <rect x={SCREEN.x} y={-100 + Math.sin(t * 53) * 25} width={SCREEN.w} height={5} fill={PHOSPHOR} opacity={0.25 * p.glitch} />}
      <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} fill="url(#pet-scan)" />
      <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} fill="#000" opacity={(1 - p.screen) * 0.85} />
      <path d={`M ${SCREEN.x + 4} ${SCREEN.y + 30} Q ${SCREEN.x + 6} ${SCREEN.y + 5} ${SCREEN.x + 34} ${SCREEN.y + 4} L ${SCREEN.x + 50} ${SCREEN.y + 4} Q ${SCREEN.x + 14} ${SCREEN.y + 10} ${SCREEN.x + 4} ${SCREEN.y + 30} Z`} fill="url(#pet-glass)" />
    </g>
  )
}

function Eye({ cx, cy, shape, open, side, t }: { cx: number; cy: number; shape: EyeShape; open: number; side: 'L' | 'R'; t: number }) {
  const stroke = { stroke: PHOSPHOR, strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  const dir = side === 'L' ? 1 : -1
  switch (shape) {
    case 'open': {
      const h = Math.max(2, 17 * open)
      return (
        <g>
          <rect x={cx - 5} y={cy - h / 2} width={10} height={h} rx={5} fill={PHOSPHOR} />
          {open > 0.5 && <rect x={cx - 2.5} y={cy - h / 2 + 2.5} width={3} height={4} rx={1.5} fill="#d9ffe9" />}
        </g>
      )
    }
    case 'wide':
      return (
        <g>
          <circle cx={cx} cy={cy} r={9} {...stroke} strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={3.5} fill={PHOSPHOR} />
        </g>
      )
    case 'happy':
      return <path d={`M ${cx - 7} ${cy + 3} Q ${cx} ${cy - 9} ${cx + 7} ${cy + 3}`} {...stroke} />
    case 'closed':
      return <path d={`M ${cx - 7} ${cy} Q ${cx} ${cy + 6} ${cx + 7} ${cy}`} {...stroke} />
    case 'squint':
      return <path d={`M ${cx - 6 * dir} ${cy - 6} L ${cx + 5 * dir} ${cy} L ${cx - 6 * dir} ${cy + 6}`} {...stroke} />
    case 'x':
      return <path d={`M ${cx - 6} ${cy - 6} L ${cx + 6} ${cy + 6} M ${cx + 6} ${cy - 6} L ${cx - 6} ${cy + 6}`} {...stroke} />
    case 'heart': {
      const s = 1.15 * open
      return (
        <path
          transform={`translate(${cx} ${cy}) scale(${s})`}
          d="M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z"
          fill={PINK}
        />
      )
    }
    case 'spiral': {
      let d = ''
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 4
        const r = (i / 40) * 8
        d += `${i ? 'L' : 'M'} ${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)} `
      }
      return <path transform={`translate(${cx} ${cy}) rotate(${t * 540 * dir})`} d={d} {...stroke} strokeWidth={2.4} />
    }
  }
}

function Brows({ k, lx, ly }: { k: number; lx: number; ly: number }) {
  const y = EYE_Y - 14 + ly * 0.6
  const inner = 4.5 * Math.min(k, 1.3)
  return (
    <g stroke={PHOSPHOR} strokeWidth={3} strokeLinecap="round" opacity={Math.min(1, k * 1.5)}>
      <line x1={-EYE_DX - 8 + lx} y1={y + 1} x2={-EYE_DX + 6 + lx} y2={y - inner} />
      <line x1={EYE_DX + 8 + lx} y1={y + 1} x2={EYE_DX - 6 + lx} y2={y - inner} />
    </g>
  )
}

function Mouth({ curve, open, width, dx, dy }: { curve: number; open: number; width: number; dx: number; dy: number }) {
  const w = 12 * width
  const y = MOUTH_Y + dy
  const endY = y - curve * 3
  const ctrl = y + curve * 8
  const l = dx - w
  const r = dx + w
  if (open < 0.05) {
    return <path d={`M ${l} ${endY} Q ${dx} ${ctrl} ${r} ${endY}`} stroke={PHOSPHOR} strokeWidth={3.5} fill="none" strokeLinecap="round" />
  }
  const lower = ctrl + open * 16
  return (
    <g>
      <path d={`M ${l} ${endY} Q ${dx} ${ctrl} ${r} ${endY} Q ${dx} ${lower} ${l} ${endY} Z`} fill="#0a2a1a" stroke={PHOSPHOR} strokeWidth={3} strokeLinejoin="round" />
      {open > 0.4 && curve > 0 && <ellipse cx={dx} cy={(ctrl + lower) / 2 + 2} rx={w * 0.35} ry={open * 2.5} fill={PINK} opacity={0.8} />}
    </g>
  )
}

function ProgressBar({ k }: { k: number }) {
  return (
    <g>
      <rect x={-28} y={-80} width={56} height={10} rx={3} fill="none" stroke={PHOSPHOR} strokeWidth={2} />
      <rect x={-25.5} y={-77.5} width={51 * k} height={5} rx={1.5} fill={PHOSPHOR} />
      <text x={0} y={-62} textAnchor="middle" fontSize={7} fontFamily="monospace" fill={PHOSPHOR_DIM}>
        {Math.round(k * 100)}%
      </text>
    </g>
  )
}

const CODE_LINES = [
  [0, 22], [4, 30], [4, 14], [8, 26], [8, 18], [4, 8], [0, 4], [0, 28], [4, 20], [8, 32], [4, 12], [0, 6],
]

function Code({ t }: { t: number }) {
  const lineH = 6
  const offset = (t * 22) % lineH
  const first = Math.floor((t * 22) / lineH)
  const rows: ReactNode[] = []
  for (let i = 0; i < 6; i++) {
    const [indent, len] = CODE_LINES[(first + i) % CODE_LINES.length]
    rows.push(<rect key={i} x={-34 + indent} y={-86 + i * lineH - offset} width={len} height={2.6} rx={1.3} fill={i % 3 === 1 ? PHOSPHOR : PHOSPHOR_DIM} />)
  }
  const cursorOn = Math.floor(t * 4) % 2 === 0
  return (
    <g>
      <clipPath id="pet-code-clip">
        <rect x={-40} y={-88} width={80} height={28} />
      </clipPath>
      <g clipPath="url(#pet-code-clip)">{rows}</g>
      {cursorOn && <rect x={-34 + 34} y={-64} width={5} height={3} fill={PHOSPHOR} />}
    </g>
  )
}

function Spinner({ t }: { t: number }) {
  const dots = 8
  const head = Math.floor(t * 12) % dots
  return (
    <g transform={`translate(0 ${MOUTH_Y + 2})`}>
      {Array.from({ length: dots }, (_, i) => {
        const a = (i / dots) * Math.PI * 2
        const age = (head - i + dots) % dots
        return <circle key={i} cx={Math.cos(a) * 9} cy={Math.sin(a) * 9} r={2.2} fill={PHOSPHOR} opacity={1 - age / dots} />
      })}
    </g>
  )
}

function Tears({ k, t, lx }: { k: number; t: number; lx: number }) {
  const drops: ReactNode[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 + i / 3 + (side > 0 ? 0.15 : 0)) % 1
      const x = side * (EYE_DX + 4) + lx + side * ph * 6
      const y = EYE_Y + 8 + ph * 40
      drops.push(<path key={`${side}${i}`} transform={`translate(${x} ${y}) scale(${0.9 + ph * 0.3})`} d="M 0 -4 Q 3 0 0 3 Q -3 0 0 -4 Z" fill={TEAR} opacity={k * (1 - ph * 0.6)} />)
    }
  }
  return <g>{drops}</g>
}

// ---------- props & effects ----------

function Keyboard({ k, t }: { k: number; t: number }) {
  const keys: ReactNode[] = []
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 9; col++) {
      const pressed = Math.floor(t * 14 + col * 3 + row * 5) % 11 === 0
      keys.push(<rect key={`${row}${col}`} x={-43 + col * 9.6} y={-46 + row * 6 + (pressed ? 1 : 0)} width={7.5} height={4.5} rx={1} fill={pressed ? '#cfc2a6' : '#f4eddc'} />)
    }
  }
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 25})`}>
      <path d="M -50 -48 L 50 -48 L 54 -32 L -54 -32 Z" fill="#a8977a" stroke="#6f6148" strokeWidth={2} strokeLinejoin="round" />
      {keys}
    </g>
  )
}

function Sweat({ k, t }: { k: number; t: number }) {
  const slide = (t * 0.8) % 1
  return (
    <path transform={`translate(${52} ${-128 + slide * 14}) scale(1.3)`} d="M 0 -6 Q 5 1 0 4 Q -5 1 0 -6 Z" fill={TEAR} stroke="#3c8fbf" strokeWidth={1} opacity={k * (1 - slide * 0.5)} />
  )
}

function Flame({ t, k }: { t: number; k: number }) {
  const len = 34 * k * (1 + Math.sin(t * 60) * 0.15)
  return (
    <g>
      {[-16, 16].map((x) => (
        <path key={x} d={`M ${x - 8} -2 Q ${x} ${len * 1.1} ${x + 8} -2 Z`} fill="url(#pet-flame)" opacity={0.95} />
      ))}
    </g>
  )
}

function SpeedLines({ t, angle, k, transform }: { t: number; angle: number; k: number; transform: string }) {
  return (
    <g transform={`${transform} translate(0 -80) rotate(${angle + 180})`} opacity={k}>
      {[-50, -25, 0, 25, 50].map((off, i) => {
        const ph = (t * 3 + i * 0.37) % 1
        const start = 60 + ph * 50
        return <line key={i} x1={start} y1={off} x2={start + 30 + i * 6} y2={off} stroke="rgba(120,140,170,0.6)" strokeWidth={3} strokeLinecap="round" opacity={1 - ph} />
      })}
    </g>
  )
}

function Hearts({ t }: { t: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const ph = (t * 0.45 + i / 5) % 1
        const x = Math.sin((ph + i) * 6) * 18 + (i - 2) * 16
        const y = -150 - ph * 90
        const s = 0.6 + ph * 0.8
        return (
          <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d="M 0 7 C -10 0 -9 -8 -4 -8 C -1.5 -8 0 -6 0 -4 C 0 -6 1.5 -8 4 -8 C 9 -8 10 0 0 7 Z" fill={PINK} stroke="#c23d66" strokeWidth={1} opacity={Math.min(1, ph * 6) * (1 - ph)} />
        )
      })}
    </g>
  )
}

function Zzz({ t }: { t: number }) {
  return (
    <g fontFamily="'Comic Sans MS', 'Chalkboard SE', sans-serif" fontWeight={700} fill="#6b7fa8">
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.5 + i / 3) % 1
        return (
          <text key={i} x={30 + ph * 40} y={-150 - ph * 60} fontSize={12 + ph * 14} opacity={Math.min(1, ph * 5) * (1 - ph)}>
            Z
          </text>
        )
      })}
    </g>
  )
}

function Sparkles({ t }: { t: number }) {
  const star = 'M 0 -8 Q 1.5 -1.5 8 0 Q 1.5 1.5 0 8 Q -1.5 1.5 -8 0 Q -1.5 -1.5 0 -8 Z'
  return (
    <g>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = (i / 7) * Math.PI * 2 + 0.3
        const tw = Math.max(0, Math.sin(t * 6 + i * 1.9))
        return <path key={i} transform={`translate(${Math.cos(a) * 85} ${-85 + Math.sin(a) * 75}) scale(${tw}) rotate(${t * 90})`} d={star} fill="#ffd34f" stroke="#c99a12" strokeWidth={0.8} />
      })}
    </g>
  )
}

function RainCloud({ k, t }: { k: number; t: number }) {
  const drops: ReactNode[] = []
  for (let i = 0; i < 9; i++) {
    const ph = (t * 1.8 + i * 0.37) % 1
    const x = -34 + i * 8.5
    drops.push(<line key={i} x1={x} y1={-180 + ph * 50} x2={x - 1.5} y2={-172 + ph * 50} stroke={TEAR} strokeWidth={2.2} strokeLinecap="round" opacity={1 - ph * 0.7} />)
  }
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * -20})`}>
      {drops}
      <g fill="#8b95a6" stroke="#5f6878" strokeWidth={2}>
        <path d="M -42 -182 Q -50 -198 -32 -202 Q -28 -222 -6 -216 Q 8 -230 24 -214 Q 44 -214 42 -196 Q 52 -184 38 -180 Z" />
      </g>
    </g>
  )
}

function Gear({ x, y, r, teeth, angle, color }: { x: number; y: number; r: number; teeth: number; angle: number; color: string }) {
  let d = ''
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2
    const rr = i % 2 === 0 ? r : r * 0.78
    const a2 = a + Math.PI / (teeth * 2)
    d += `${i ? 'L' : 'M'} ${Math.cos(a) * rr} ${Math.sin(a) * rr} L ${Math.cos(a2) * rr} ${Math.sin(a2) * rr} `
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d={d + 'Z'} fill={color} stroke="#555" strokeWidth={1.5} strokeLinejoin="round" />
      <circle r={r * 0.3} fill="#f5f0e6" stroke="#555" strokeWidth={1.5} />
    </g>
  )
}

function Gears({ t }: { t: number }) {
  const k = Math.min(1, t * 3)
  return (
    <g opacity={k} transform={`translate(0 ${(1 - k) * 15})`}>
      <Gear x={-16} y={-186} r={16} teeth={8} angle={t * 180} color="#b9c3d1" />
      <Gear x={11} y={-200} r={11} teeth={6} angle={-t * 262 + 15} color="#ffd34f" />
    </g>
  )
}
