import type { ReactElement } from 'react'
import { ServerChassis, TerminalChassis } from './chassis'
import type { Pose } from './pose'

export type CharacterId = 'terminal' | 'server'

export interface Palette {
  phosphor: string
  phosphorDim: string
  screenInner: string
  screenOuter: string
}

/**
 * Everything that differs between characters. They all share the same skeleton
 * (screen face, limbs, effects); a rig only says where things attach and how the
 * chassis behind the screen looks.
 */
export interface Rig {
  id: CharacterId
  name: string
  kind: string // "desktop terminal", used in copy
  palette: Palette
  shoulder: { x: number; y: number }
  antenna: { x: number; y: number }
  sweat: { x: number; y: number }
  fxOffsetY: number // shift for effects above the head (hearts, cloud…) on taller bodies
  trayViewBox: string
  limb: { line: string; hand: string; handStroke: string; joint: string; foot: string; footStroke: string }
  Chassis: (props: { p: Pose; t: number }) => ReactElement
}

// ---------- characters ----------

const terminal: Rig = {
  id: 'terminal',
  name: 'Pixel',
  kind: 'desktop terminal',
  palette: { phosphor: '#62ffb0', phosphorDim: '#2f9e6a', screenInner: '#14432d', screenOuter: '#06180f' },
  shoulder: { x: 57, y: -82 },
  antenna: { x: 14, y: -141 },
  sweat: { x: 52, y: -128 },
  fxOffsetY: 0,
  trayViewBox: '-72 -168 144 172',
  limb: { line: '#5d5140', hand: '#f7f1e3', handStroke: '#8a7a5c', joint: '#cbbb9c', foot: '#e55d4f', footStroke: '#8a3a30' },
  Chassis: TerminalChassis,
}

const server: Rig = {
  id: 'server',
  name: 'Rack',
  kind: 'little home server',
  palette: { phosphor: '#7cd4ff', phosphorDim: '#3a86b0', screenInner: '#103252', screenOuter: '#050f1c' },
  shoulder: { x: 52, y: -96 },
  antenna: { x: 14, y: -174 },
  sweat: { x: 48, y: -170 },
  fxOffsetY: -32,
  trayViewBox: '-80 -204 160 208',
  limb: { line: '#2b3140', hand: '#e8ecf2', handStroke: '#4a5568', joint: '#4a5568', foot: '#3b82f6', footStroke: '#1e3a8a' },
  Chassis: ServerChassis,
}

export const CHARACTERS: Record<CharacterId, Rig> = { terminal, server }
export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[]
export const isCharacterId = (v: unknown): v is CharacterId => typeof v === 'string' && v in CHARACTERS
