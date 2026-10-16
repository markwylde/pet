import type { Pose } from './pose'

// ---------- terminal ----------

export function TerminalChassis() {
  return (
    <g>
      <defs>
        <linearGradient id="terminal-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3ead6" />
          <stop offset="1" stopColor="#d9cbad" />
        </linearGradient>
      </defs>
      {/* stand */}
      <rect x={-14} y={-40} width={28} height={12} fill="#cbbb9c" stroke="#8a7a5c" strokeWidth={2} />
      <rect x={-34} y={-31} width={68} height={11} rx={5} fill="url(#terminal-body)" stroke="#8a7a5c" strokeWidth={2.5} />
      {/* monitor */}
      <rect x={-58} y={-142} width={116} height={106} rx={22} fill="url(#terminal-body)" stroke="#8a7a5c" strokeWidth={2.5} />
      <rect x={-58} y={-142} width={116} height={106} rx={22} fill="url(#pet-body-side)" />
      <rect x={-47} y={-129} width={94} height={76} rx={14} fill="#b8a888" stroke="#8a7a5c" strokeWidth={1.5} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={-40 + i * 7} y1={-45} x2={-37 + i * 7} y2={-41} stroke="#a8977a" strokeWidth={2} strokeLinecap="round" />
      ))}
      <circle cx={40} cy={-44} r={2.6} fill="#62ffb0" filter="url(#pet-glow)" />
    </g>
  )
}

// ---------- server ----------

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function DriveBay({ y, t, rate, seed }: { y: number; t: number; rate: number; seed: number }) {
  const tick = Math.floor(t * rate)
  const led = (i: number) => hash(tick * 7 + seed * 13 + i) > 0.35
  return (
    <g>
      <rect x={-44} y={y} width={88} height={11} rx={2.5} fill="#1f2633" stroke="#11151c" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={-38 + i * 6} y1={y + 3} x2={-38 + i * 6} y2={y + 8} stroke="#3a4458" strokeWidth={1.6} strokeLinecap="round" />
      ))}
      <circle cx={28} cy={y + 5.5} r={2} fill={led(0) ? '#4ade80' : '#14532d'} filter={led(0) ? 'url(#pet-glow)' : undefined} />
      <circle cx={36} cy={y + 5.5} r={2} fill={led(1) ? '#fbbf24' : '#5b4410'} filter={led(1) ? 'url(#pet-glow)' : undefined} />
    </g>
  )
}

export function ServerChassis({ p, t }: { p: Pose; t: number }) {
  // drive lights chatter much faster while it's working
  const working = p.code > 0 || p.spinner > 0 || p.progress >= 0 || p.gears > 0
  const rate = working ? 14 : 2.5
  return (
    <g>
      <defs>
        <linearGradient id="server-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5568" />
          <stop offset="1" stopColor="#2d3748" />
        </linearGradient>
      </defs>
      <rect x={-52} y={-174} width={104} height={152} rx={10} fill="url(#server-body)" stroke="#161b25" strokeWidth={2.5} />
      <rect x={-52} y={-174} width={104} height={152} rx={10} fill="url(#pet-body-side)" />
      {/* rack ears */}
      <rect x={-57} y={-168} width={6} height={26} rx={2} fill="#3a4458" stroke="#161b25" strokeWidth={1.5} />
      <rect x={51} y={-168} width={6} height={26} rx={2} fill="#3a4458" stroke="#161b25" strokeWidth={1.5} />
      <DriveBay y={-166} t={t} rate={rate} seed={1} />
      <DriveBay y={-151} t={t} rate={rate} seed={2} />
      {/* screen bezel */}
      <rect x={-47} y={-129} width={94} height={76} rx={8} fill="#1a202c" stroke="#11151c" strokeWidth={1.5} />
      {/* vents, label, power button */}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={-40} y1={-45 + i * 6} x2={-6} y2={-45 + i * 6} stroke="#1a202c" strokeWidth={2.4} strokeLinecap="round" />
      ))}
      <text x={10} y={-31} fontSize={5.5} fontFamily="ui-monospace, monospace" fill="#8a96aa">
        SRV-01
      </text>
      <circle cx={38} cy={-38} r={5.5} fill="#0f172a" stroke="#161b25" strokeWidth={1.5} />
      <circle cx={38} cy={-38} r={2.6} fill="#60a5fa" filter="url(#pet-glow)" />
    </g>
  )
}

