'use client'

import { useEffect, useRef } from 'react'
import { Application, BlurFilter, Container, Graphics } from 'pixi.js'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function hexToInt(hex: string): number {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex
  return Number.parseInt(normalized, 16)
}

type Particle = {
  g: Graphics
  angle: number
  radius: number
  speed: number
  phase: number
}

type PixiNoteOrbProps = {
  size?: number
  noteHex: string
  partnerHex?: string | null
  noteShort: string
  frequencyHz: number
  isPlaying: boolean
  pulseDepth: number
  orbEvolution: number
  ambientShimmer: boolean
  sacredClimax: boolean
  arrivalTransition: boolean
}

export function PixiNoteOrb({
  size = 108,
  noteHex,
  partnerHex,
  noteShort,
  frequencyHz,
  isPlaying,
  pulseDepth,
  orbEvolution,
  ambientShimmer,
  sacredClimax,
  arrivalTransition,
}: PixiNoteOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let disposed = false
    let destroyed = false
    const mount = mountRef.current
    if (!mount) return

    const app = new Application()
    const safeDestroy = () => {
      if (destroyed) return
      destroyed = true
      try {
        app.destroy()
      } catch {
        // Ignore teardown errors from partially initialized app state.
      }
    }

    void (async () => {
      await app.init({
        width: size,
        height: size,
        antialias: true,
        autoDensity: true,
        resolution: Math.max(1, window.devicePixelRatio || 1),
        backgroundAlpha: 0,
      })
      if (disposed) {
        safeDestroy()
        return
      }

      mount.innerHTML = ''
      mount.appendChild(app.canvas)

      const root = new Container()
      root.x = size / 2
      root.y = size / 2
      app.stage.addChild(root)

      const haloOuter = new Graphics()
      const haloInner = new Graphics()
      const core = new Graphics()
      const partner = new Graphics()
      const highlight = new Graphics()

      haloOuter.filters = [new BlurFilter({ strength: 5 })]
      haloInner.filters = [new BlurFilter({ strength: 2 })]

      root.addChild(haloOuter)
      root.addChild(haloInner)
      root.addChild(partner)
      root.addChild(core)
      root.addChild(highlight)

      const baseInt = hexToInt(noteHex)
      const partnerInt = partnerHex ? hexToInt(partnerHex) : baseInt
      const particles: Particle[] = []
      const particleCount = 24
      for (let i = 0; i < particleCount; i++) {
        const g = new Graphics()
        const radius = 32 + (i % 7) * 2
        const speed = 0.003 + (i % 5) * 0.0007
        const phase = (i * Math.PI * 2) / particleCount
        g.circle(0, 0, i % 4 === 0 ? 1.8 : 1.1).fill({ color: baseInt, alpha: 0.42 })
        root.addChild(g)
        particles.push({ g, angle: phase, radius, speed, phase })
      }

      const hzNorm = clamp((frequencyHz - 100) / 400, 0, 1)
      let t = 0

      app.ticker.add((ticker) => {
        t += ticker.deltaMS

        const waveSpeed = 0.002 + hzNorm * 0.004
        const breathe = isPlaying ? Math.sin(t * waveSpeed) : Math.sin(t * 0.0012)
        const pulseBoost = isPlaying ? 0.055 + hzNorm * 0.035 : 0.02
        const phaseBoost = arrivalTransition ? 0.045 : 0
        const depthBoost = clamp(pulseDepth * 0.003, 0, 0.09)
        const evoBoost = clamp(orbEvolution * 0.003, 0, 0.06)
        const climaxBoost = sacredClimax ? 0.065 : 0
        const scale = 1 + breathe * pulseBoost + phaseBoost + depthBoost + evoBoost + climaxBoost

        core.clear()
        core.circle(0, 0, 33).fill({ color: baseInt, alpha: 0.92 })
        core.scale.set(scale)

        partner.clear()
        if (partnerHex) {
          partner.circle(0, 0, 31).fill({
            color: partnerInt,
            alpha: 0.25 + (Math.sin(t * 0.0016) + 1) * 0.17,
          })
        }

        haloOuter.clear()
        haloOuter.circle(0, 0, 39 + (ambientShimmer ? 3 : 0)).fill({
          color: baseInt,
          alpha: 0.17 + (isPlaying ? 0.12 : 0.04),
        })

        haloInner.clear()
        haloInner.circle(0, 0, 35).fill({
          color: partnerHex ? partnerInt : baseInt,
          alpha: 0.16 + (arrivalTransition ? 0.09 : 0.02),
        })

        highlight.clear()
        highlight.circle(-9, -11, 9.5).fill({ color: 0xffffff, alpha: 0.2 })

        for (const p of particles) {
          const localSpeed = p.speed * (isPlaying ? 1.8 + hzNorm * 1.3 : 0.9)
          p.angle += ticker.deltaMS * localSpeed
          const r = p.radius + Math.sin(t * 0.0013 + p.phase) * (ambientShimmer ? 3.5 : 1.2)
          p.g.x = Math.cos(p.angle) * r
          p.g.y = Math.sin(p.angle) * r
          p.g.alpha = 0.22 + (isPlaying ? 0.18 : 0.04) + (sacredClimax ? 0.12 : 0)
        }
      })
    })()

    return () => {
      disposed = true
      safeDestroy()
    }
  }, [
    size,
    noteHex,
    partnerHex,
    frequencyHz,
    isPlaying,
    pulseDepth,
    orbEvolution,
    ambientShimmer,
    sacredClimax,
    arrivalTransition,
  ])

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="h-full w-full overflow-hidden rounded-full" />
      <span className="pointer-events-none absolute inset-0 z-[2] inline-flex items-center justify-center font-mono text-sm font-bold uppercase tracking-wide text-white">
        {noteShort}
      </span>
    </div>
  )
}
