'use client'

import { useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// Sidereus Atmospheric Background — pure Canvas 2D
// Monet "Impression, Sunrise" color philosophy:
// misty blues, soft lavender, distant warm gold, volumetric fog.
// No WebGL / Three.js dependency — zero chunk-loading risk.
// ─────────────────────────────────────────────────────────────

const PALETTE = [
  [143, 169, 216],  // Morning Blue  #8FA9D8
  [181, 166, 216],  // Lavender      #B5A6D8
  [ 94, 111, 163],  // Muted Indigo  #5E6FA3
  [224, 185, 106],  // Sunrise Gold  #E0B96A
]

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; alpha: number
  color: number[]
  phase: number
}

function noise2d(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 0.8 + t * 0.3) * 0.35 +
    Math.sin(y * 0.6 + t * 0.2) * 0.25 +
    Math.sin((x + y) * 0.4 + t * 0.15) * 0.2 +
    Math.sin(x * 0.2 - y * 0.3 + t * 0.1) * 0.2
  )
}

export default function AtmosphereBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    // ── Particles ───────────────────────────────────────────
    const COUNT = 200
    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const col = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      return {
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00015,
        vy: -Math.random() * 0.00008 - 0.00002,
        size: 0.8 + Math.random() * 2.5,
        alpha: 0.04 + Math.random() * 0.14,
        color: col,
        phase: Math.random() * Math.PI * 2,
      }
    })

    function resize() {
      if (!canvas) return
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height

      // ── 1. Deep background gradient ──────────────────────
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0.0, '#050608')
      bg.addColorStop(0.4, '#080C11')
      bg.addColorStop(0.7, '#0B0E13')
      bg.addColorStop(1.0, '#0E1219')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ── 2. Volumetric fog bands (slow-moving) ────────────
      for (let i = 0; i < 4; i++) {
        const layerT = t * (0.04 + i * 0.012)
        const xOff = Math.sin(layerT + i * 1.7) * W * 0.18
        const yBase = H * (0.25 + i * 0.18)
        const spread = H * (0.22 + i * 0.06)
        const alpha = 0.018 + i * 0.006
        const c = PALETTE[i % PALETTE.length]

        const fog = ctx.createRadialGradient(
          W * 0.5 + xOff, yBase, 0,
          W * 0.5 + xOff, yBase, spread
        )
        fog.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${alpha})`)
        fog.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
        ctx.fillStyle = fog
        ctx.fillRect(0, 0, W, H)
      }

      // ── 3. Horizon warmth — faint Sunrise Gold glow ──────
      const horizonY = H * 0.72
      const warmGlow = ctx.createRadialGradient(
        W * 0.3, horizonY, 0,
        W * 0.3, horizonY, W * 0.45
      )
      const warmAlpha = 0.028 + Math.sin(t * 0.07) * 0.008
      warmGlow.addColorStop(0, `rgba(224,185,106,${warmAlpha})`)
      warmGlow.addColorStop(0.5, `rgba(228,184,160,${warmAlpha * 0.4})`)
      warmGlow.addColorStop(1, 'rgba(224,185,106,0)')
      ctx.fillStyle = warmGlow
      ctx.fillRect(0, 0, W, H)

      // ── 4. Center atmospheric haze ────────────────────────
      const centerHaze = ctx.createRadialGradient(
        W * 0.5, H * 0.4, 0,
        W * 0.5, H * 0.4, W * 0.55
      )
      const hazeA = 0.022 + Math.sin(t * 0.05 + 0.5) * 0.006
      centerHaze.addColorStop(0, `rgba(94,111,163,${hazeA})`)
      centerHaze.addColorStop(1, 'rgba(94,111,163,0)')
      ctx.fillStyle = centerHaze
      ctx.fillRect(0, 0, W, H)

      // ── 5. FBM-style fog wisps ────────────────────────────
      for (let row = 0; row < 3; row++) {
        for (let col2 = 0; col2 < 4; col2++) {
          const nx = (col2 + 0.5) / 4
          const ny = 0.2 + row * 0.25
          const n = noise2d(nx * 3, ny * 3, t * 0.08)
          if (n < 0.15) continue
          const wx = (nx + Math.sin(t * 0.06 + row) * 0.06) * W
          const wy = (ny + Math.cos(t * 0.05 + col2) * 0.04) * H
          const wr = (0.06 + n * 0.08) * W
          const wispAlpha = n * 0.04
          const wc = PALETTE[(row + col2) % PALETTE.length]
          const wisp = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr)
          wisp.addColorStop(0, `rgba(${wc[0]},${wc[1]},${wc[2]},${wispAlpha})`)
          wisp.addColorStop(1, `rgba(${wc[0]},${wc[1]},${wc[2]},0)`)
          ctx.fillStyle = wisp
          ctx.fillRect(0, 0, W, H)
        }
      }

      // ── 6. Particles ──────────────────────────────────────
      for (const p of particles) {
        // Drift with slight noise-based velocity
        const nx = noise2d(p.x * 2, p.y * 2, t * 0.1) * 0.0002
        p.x += p.vx + nx
        p.y += p.vy
        // Wrap
        if (p.x < -0.02) p.x = 1.02
        if (p.x > 1.02)  p.x = -0.02
        if (p.y < -0.02) p.y = 1.02

        const px = p.x * W
        const py = p.y * H
        const pulse = Math.sin(t * 0.8 + p.phase) * 0.3 + 0.7
        const glow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5)
        const [r, g, b] = p.color
        glow.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * pulse})`)
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── 7. Vignette ───────────────────────────────────────
      const vignette = ctx.createRadialGradient(
        W * 0.5, H * 0.5, H * 0.25,
        W * 0.5, H * 0.5, Math.max(W, H) * 0.9
      )
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)

      t += 1
    }

    function loop() {
      draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="atmosphere-canvas"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
