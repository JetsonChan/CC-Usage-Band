import { expect, mock, test } from 'claude-code/testing'

import { bar, desktopSvg, detectStyle, fmtLeft, fmtTokens, hitRate, layout, to256, width } from '../hooks/register'
import type { Measure } from '../types'

const BAND = {
  component: 'AbovePrompt',
  // The mount fills scroll and view; the band reads none of them
  props: { hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 140 } as never,
} as const

test('formats tokens, countdowns and hit rate', async () => {
  expect(fmtTokens(950)).toBe('950')
  expect(fmtTokens(15_600)).toBe('15.6K')
  expect(fmtTokens(100_000)).toBe('100K')
  expect(fmtTokens(1_000_000)).toBe('1M')
  expect(fmtLeft((2 * 60 + 40) * 60_000)).toBe('2h40m')
  expect(fmtLeft((31 * 60) * 60_000)).toBe('1d7h')
  expect(hitRate({ input: 50, output: 10, cacheRead: 900, cacheWrite: 50 })).toBe(90)
  expect(hitRate({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })).toBe(null)
})

test('band shows limits, context and the last turn on terminal and desktop', async ($, on) => {
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('turn.complete', () => ({ text: '' }))

  await $.session.measure({
    context: { tokens: 100_000, window: 1_000_000, percent: 10 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 20 },
      { kind: 'seven_day', percentUsed: 58 },
    ],
    changed: ['context', 'rateLimits'],
  })
  await $.turn.complete({
    answer: 'ok',
    durationMs: 1000,
    isAborted: false,
    turnId: 't1',
    reason: 'answer',
    usage: {
      model: 'claude-opus-5-5',
      input_tokens: 50,
      output_tokens: 3_000,
      cache_read_input_tokens: 900,
      cache_creation_input_tokens: 50,
    },
  })

  const desk = await $.ui.mount({ plugin: 'usage-band', surface: 'desktop', ...BAND })
  // The image layer holds the type and the hairlines between the four groups; nothing moves in it
  const svg = await desk.find({ type: 'Svg' })
  expect(svg?.props.alt).toBe('5-hour limit 20% used, 7-day limit 58% used, context 100K of 1M, cache hit 90%')
  expect(svg?.props.isInteractive).toBeFalsy()
  expect(String(svg?.props.source)).not.toContain('<animate')
  expect(String(svg?.props.source).match(/class="sep"/g)?.length).toBe(3)
  expect(await desk.find({ type: 'Text' })).toBeUndefined()
  await desk.unmount()

  for (const surface of ['terminal'] as const) {
    const ui = await $.ui.mount({ plugin: 'usage-band', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /^20%$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^58%$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '/1M' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '90%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '↑' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: 'not drawn' })).toBeUndefined()
    await ui.unmount()
  }
})

test('layout steps down to fit narrow terminals', async () => {
  const m = {
    context: { tokens: 130_000, window: 1_000_000, percent: 13 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 20, resetsAt: new Date(160 * 60_000).toISOString() },
      { kind: 'seven_day', percentUsed: 58, resetsAt: new Date(31 * 3_600_000).toISOString() },
    ],
  }
  const t = { input: 1_200, output: 3_000, cacheRead: 1_400_000, cacheWrite: 12_000 }
  expect(width(layout(m, t, 0, 0))).toBeLessThan(80)
})

test('the bar highlight moves left to right and keeps the bar width', async () => {
  const at = (f: number) => bar(50, 8, '#5cc4d6', f)
  const lum = (hex = '#000000') => [1, 3, 5].reduce((n, i) => n + parseInt(hex.slice(i, i + 2), 16), 0)
  // 50% of 8 cells fills 4; frames 4..12 put the glow past the fill, so frame 7 has none
  const plain = at(7).map(s => lum(s.color))
  // The glow sits one cell further right each frame
  const glowAt = (f: number) => {
    const lift = at(f).map((s, i) => lum(s.color) - plain[i]!)
    return lift.indexOf(Math.max(...lift))
  }
  expect(glowAt(0)).toBe(0)
  expect(glowAt(2)).toBe(2)
  expect(glowAt(3)).toBe(3)
  // Gradient: without a glow the bar brightens left to right
  expect(plain[0]! < plain[3]!).toBe(true)
  for (const f of [0, 3, 7, 20]) expect(width(at(f))).toBe(8)
})

test('auto picks Nerd Font icons only in Ghostty; a manual setting wins', async () => {
  expect(detectStyle('auto', 'ghostty')).toBe('nerd')
  expect(detectStyle('auto', 'Apple_Terminal')).toBe('unicode')
  expect(detectStyle('auto', 'WarpTerminal')).toBe('unicode')
  expect(detectStyle('auto', undefined)).toBe('unicode')
  expect(detectStyle('nerd', 'Apple_Terminal')).toBe('nerd')
  expect(detectStyle('ascii', 'ghostty')).toBe('ascii')
})

test('256-color preview snaps colors to the xterm palette', async () => {
  expect(to256('#000000')).toBe('#000000')
  expect(to256('#ffffff')).toBe('#ffffff')
  expect(to256('#5cc4d6')).toBe('#5fd7d7')
})

test('preview command draws every terminal profile', async ($, on) => {
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.run', () => ({ text: '' }))
  const ui = await $.ui.mount({
    plugin: 'usage-band',
    surface: 'terminal',
    component: 'CommandOutput',
    props: { command: 'usage-band-preview', args: '', text: '' },
  } as never)
  expect(await ui.find({ type: 'Text', text: 'Ghostty' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'ascii fallback' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'hit ' })).toBeDefined()
  await ui.unmount()
})

test('bars of different fill keep their highlights in step', async () => {
  const lum = (hex = '#000000') => [1, 3, 5].reduce((n, i) => n + parseInt(hex.slice(i, i + 2), 16), 0)
  const glowAt = (pct: number, f: number) => {
    const plain = bar(pct, 8, '#5cc4d6', 12).map(s => lum(s.color))
    const lift = bar(pct, 8, '#5cc4d6', f).map((s, i) => lum(s.color) - plain[i]!)
    return lift.indexOf(Math.max(...lift))
  }
  for (const f of [0, 1, 2, 3, 13, 15]) expect(glowAt(50, f)).toBe(glowAt(90, f))
})

test('desktop context is a 2×10 dot matrix, top row first', async () => {
  const svgFor = (pct: number) =>
    desktopSvg({ context: { tokens: pct * 10_000, window: 1_000_000, percent: pct }, rateLimits: [] }, null, 0).motion ?? ''
  const lit = (svg: string) => (svg.match(/<clipPath id="c-ctx">(.*?)<\/clipPath>/)?.[1]?.match(/<circle/g) ?? []).length
  const all = (svg: string) => (svg.match(/<circle [^>]*r="1.6"/g) ?? []).length
  expect(all(svgFor(35))).toBe(20 + 7)
  expect(lit(svgFor(35))).toBe(7)
  expect(lit(svgFor(0))).toBe(0)
  expect(lit(svgFor(100))).toBe(20)
  // 60% fills the whole top row and two dots of the bottom one
  const rows = (svgFor(60).match(/<clipPath id="c-ctx">(.*?)<\/clipPath>/)?.[1] ?? '').match(/cy="[\d.]+"/g) ?? []
  expect(rows.filter(r => r === 'cy="11.35"').length).toBe(10)
  expect(rows.filter(r => r === 'cy="18.15"').length).toBe(2)
})

test('the terminal bar animates once the band is drawn', async ($, on) => {
  const clock = mock.clock(on)
  on('session.measure', ($, e) => ({ changed: e.changed }))
  await $.session.measure({
    context: { tokens: 100_000, window: 1_000_000, percent: 10 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 50 }],
    changed: ['context', 'rateLimits'],
  })
  const ui = await $.ui.mount({ plugin: 'usage-band', surface: 'terminal', ...BAND })
  const firstCell = async () => (await ui.find({ type: 'Text', text: '■' }))?.props.color
  const before = await firstCell()
  await clock.advance(200)
  expect(await firstCell()).not.toBe(before)
  await ui.unmount()
})

test('the desktop SVG declares both color schemes so a dark app gets no white backdrop', async () => {
  const { svg } = desktopSvg({ context: { tokens: 1, window: 10, percent: 10 }, rateLimits: [] }, null, 0)
  expect(svg).toContain('color-scheme:light dark')
  expect(svg).toContain('prefers-color-scheme:dark')
})

test('the framed layer only changes when a bar or the dots do, not when the countdown ticks', () => {
  const m = (pct: number): Measure => ({
    context: { tokens: 100_000, window: 1_000_000, percent: 10 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: pct, resetsAt: new Date(3 * 3_600_000).toISOString() },
      { kind: 'seven_day', percentUsed: 58, resetsAt: new Date(5 * 86_400_000).toISOString() },
    ],
  })
  // 2h53m → 2h46m: the figures change, the layout does not
  const a = desktopSvg(m(20), null, 7 * 60_000)
  const b = desktopSvg(m(20), null, 14 * 60_000)
  expect(b.svg).not.toBe(a.svg)
  expect(b.motion).toBe(a.motion)
  expect(a.motion).toContain('<animate')
  expect(desktopSvg(m(21), null, 7 * 60_000).motion).not.toBe(a.motion)
})
