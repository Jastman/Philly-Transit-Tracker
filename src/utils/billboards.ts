import type { TransitMode } from '../types/transit'
import { getModeColor } from './colors'

const imageCache = new Map<string, string>()

const SIZE = 36
const S = SIZE

function hex2rgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function drawBus(ctx: CanvasRenderingContext2D, color: string, highlighted: boolean) {
  const glow = hex2rgba(color, 0.6)
  if (highlighted) {
    ctx.shadowColor = glow
    ctx.shadowBlur = 12
  }
  // Body
  ctx.fillStyle = color
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(3, 8, S - 6, S - 16, 5)
  else ctx.rect(3, 8, S - 6, S - 16)
  ctx.fill()
  // Windows
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(6, 12, 9, 7)
  ctx.fillRect(17, 12, 9, 7)
  // Direction arrow
  ctx.fillStyle = '#fff'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.moveTo(S / 2, 0)
  ctx.lineTo(S / 2 - 4, 8)
  ctx.lineTo(S / 2 + 4, 8)
  ctx.closePath()
  ctx.fill()
  // Wheels
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(10, S - 8, 5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(S - 10, S - 8, 5, 0, Math.PI * 2); ctx.fill()
}

function drawTrolley(ctx: CanvasRenderingContext2D, color: string, highlighted: boolean) {
  if (highlighted) { ctx.shadowColor = hex2rgba(color, 0.6); ctx.shadowBlur = 12 }
  // Pantograph wire
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(S / 2, 0); ctx.lineTo(S / 2, 8); ctx.stroke()
  ctx.shadowBlur = 0
  // Body (longer, flatter)
  ctx.fillStyle = color
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(2, 8, S - 4, S - 16, 4)
  else ctx.rect(2, 8, S - 4, S - 16)
  ctx.fill()
  // Windows
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillRect(5, 11, 7, 6); ctx.fillRect(14, 11, 7, 6); ctx.fillRect(23, 11, 7, 6)
  // Wheels
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(9, S - 7, 4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(S - 9, S - 7, 4, 0, Math.PI * 2); ctx.fill()
}

function drawSubway(ctx: CanvasRenderingContext2D, color: string, highlighted: boolean) {
  const r = S / 2 - 2
  const cx = S / 2, cy = S / 2
  if (highlighted) { ctx.shadowColor = hex2rgba(color, 0.8); ctx.shadowBlur = 16 }
  // Glow ring
  const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r)
  grad.addColorStop(0, color)
  grad.addColorStop(0.65, color)
  grad.addColorStop(1, hex2rgba(color, 0))
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  // Center symbol
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${S * 0.38}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('M', cx, cy + 1)
}

function drawRail(ctx: CanvasRenderingContext2D, color: string, highlighted: boolean) {
  if (highlighted) { ctx.shadowColor = hex2rgba(color, 0.6); ctx.shadowBlur = 12 }
  // Locomotive body
  ctx.fillStyle = color
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(2, 6, S - 4, S - 14, 4)
  else ctx.rect(2, 6, S - 4, S - 14)
  ctx.fill()
  // Nose
  ctx.beginPath()
  ctx.moveTo(S - 6, 6); ctx.lineTo(S, 12); ctx.lineTo(S, S - 8); ctx.lineTo(S - 6, S - 8)
  ctx.fill()
  ctx.shadowBlur = 0
  // Windows
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillRect(5, 10, 8, 6); ctx.fillRect(15, 10, 8, 6)
  // Headlight
  ctx.fillStyle = '#FFB612'
  ctx.beginPath(); ctx.arc(S - 2, S / 2, 4, 0, Math.PI * 2); ctx.fill()
  // Wheels
  ctx.fillStyle = '#111'
  ctx.fillRect(3, S - 9, 12, 4); ctx.fillRect(S - 15, S - 9, 12, 4)
}

function drawPatco(ctx: CanvasRenderingContext2D, color: string, highlighted: boolean) {
  if (highlighted) { ctx.shadowColor = hex2rgba(color, 0.7); ctx.shadowBlur = 14 }
  // Diamond
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(S / 2, 1); ctx.lineTo(S - 1, S / 2)
  ctx.lineTo(S / 2, S - 1); ctx.lineTo(1, S / 2)
  ctx.closePath(); ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${S * 0.35}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('P', S / 2, S / 2 + 1)
}

export function getBillboardImage(mode: TransitMode, highlighted = false): string {
  const key = `${mode}-${highlighted}`
  if (imageCache.has(key)) return imageCache.get(key)!

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  const color = getModeColor(mode)

  switch (mode) {
    case 'bus':     drawBus(ctx, color, highlighted);    break
    case 'trolley': drawTrolley(ctx, color, highlighted); break
    case 'subway':  drawSubway(ctx, color, highlighted);  break
    case 'rail':    drawRail(ctx, color, highlighted);    break
    case 'patco':   drawPatco(ctx, color, highlighted);   break
  }

  const url = canvas.toDataURL()
  imageCache.set(key, url)
  return url
}

export function clearBillboardCache() {
  imageCache.clear()
}
