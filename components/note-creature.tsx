'use client'

import { useEffect, useRef, useState } from 'react'
import { useSoundieStore } from '@/lib/soundie-store'

interface AudioContextType {
  ctx: AudioContext | null
  oscillator: OscillatorNode | null
  gain: GainNode | null
  convolver: ConvolverNode | null
}

export function NoteCreature() {
  const { note, currentSession, startSession, updateSessionElapsed, completeSession, stopSession } = useSoundieStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<AudioContextType>({
    ctx: null,
    oscillator: null,
    gain: null,
    convolver: null,
  })
  const animationRef = useRef<number | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate creature size based on level and listen time
  const creatureSize = 160 + (note.level - 1) * 30 + Math.min(note.totalListenTime / 1200, 50)
  const glowIntensity = currentSession.active ? 0.7 : 0.4

  // Lore array
  const loreFragments = [
    "In the Pythagorean system, C was considered the first emanation of silence — the moment before music begins.",
    "Ancient cultures believed C was the frequency of the Earth itself—grounding, stabilizing, returning us home.",
    "Medieval monks sang C to align the body with the cosmos. Its vibration was said to heal the spine.",
    "In Ayurvedic medicine, C resonates with the root chakra—the foundation of all energy and stability.",
    "Modern neuroscience shows C-frequency sounds reduce cortisol and activate the parasympathetic nervous system.",
  ]

  const nextLoreUnlock = (loreUnlocked: number) => {
    const minutesNeeded = (loreUnlocked + 1) * 15
    const minutesHad = Math.floor(note.totalListenTime / 60)
    return Math.max(0, minutesNeeded - minutesHad)
  }

  // Initialize Web Audio
  useEffect(() => {
    const initAudio = async () => {
      if (audioRef.current.ctx) return

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create gain node for volume control
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0.2 // Soft volume
      gainNode.connect(audioContext.destination)

      // Create convolver for subtle reverb
      const convolverNode = audioContext.createConvolver()
      convolverNode.connect(gainNode)

      // Create a simple impulse response for reverb
      const rate = audioContext.sampleRate
      const length = rate * 2 // 2 seconds of reverb
      const impulseResponse = audioContext.createBuffer(2, length, rate)
      const left = impulseResponse.getChannelData(0)
      const right = impulseResponse.getChannelData(1)

      for (let i = 0; i < length; i++) {
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }

      convolverNode.buffer = impulseResponse

      audioRef.current = {
        ctx: audioContext,
        oscillator: null,
        gain: gainNode,
        convolver: convolverNode,
      }
    }

    initAudio().catch(console.error)
  }, [])

  // Handle session timer
  useEffect(() => {
    if (!currentSession.active) {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
      return
    }

    sessionIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - currentSession.startedAt) / 1000)
      updateSessionElapsed(elapsed)

      if (elapsed >= currentSession.duration) {
        stopSession()
        completeSession()
        setIsPlaying(false)
        pauseAudio()
      }
    }, 100)

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
    }
  }, [currentSession.active, currentSession.startedAt, currentSession.duration, updateSessionElapsed, stopSession, completeSession])

  // Play/pause audio
  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  const playAudio = () => {
    const ctx = audioRef.current.ctx
    if (!ctx) return

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Create new oscillator
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = note.frequency

    // Create envelope for smooth start
    const gain = audioRef.current.gain!
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.5)

    osc.connect(audioRef.current.convolver!)
    osc.start()

    audioRef.current.oscillator = osc
    setIsPlaying(true)

    if (!currentSession.active) {
      startSession()
    }
  }

  const pauseAudio = () => {
    const ctx = audioRef.current.ctx
    const osc = audioRef.current.oscillator

    if (osc && ctx) {
      const gain = audioRef.current.gain!
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

      setTimeout(() => {
        osc.stop()
        audioRef.current.oscillator = null
      }, 300)
    }

    setIsPlaying(false)
  }

  // Breathing animation
  useEffect(() => {
    if (!isPlaying && !currentSession.active) return

    const animate = () => {
      // Creature scales up and down gently
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, currentSession.active])

  const progressPercent = (currentSession.elapsed / currentSession.duration) * 100
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
      {/* Main creature section */}
      <div className="flex flex-col items-center gap-12 mb-16">
        {/* Creature visual */}
        <div className="relative">
          {/* Glow background */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              width: creatureSize + 40,
              height: creatureSize + 40,
              backgroundColor: `rgba(255, 107, 74, ${glowIntensity * 0.15})`,
              filter: `blur(${20 + (currentSession.active ? 10 : 0)}px)`,
              left: -20,
              top: -20,
            }}
          />

          {/* Creature blob */}
          <svg
            width={creatureSize}
            height={creatureSize}
            viewBox="0 0 200 200"
            className="relative z-10 transition-all duration-300"
            style={{
              filter: currentSession.active ? 'drop-shadow(0 0 30px rgba(255, 107, 74, 0.4))' : 'drop-shadow(0 0 15px rgba(255, 107, 74, 0.2))',
              animation: isPlaying ? 'breathe 4s ease-in-out infinite' : 'none',
            }}
          >
            {/* Organic blob shape */}
            <path
              d="M 100 50 C 130 45, 155 65, 160 95 C 165 125, 145 155, 115 160 C 85 165, 50 150, 45 115 C 40 85, 65 45, 100 50 Z"
              fill="url(#creatureGradient)"
              opacity={note.level / 5 * 0.8 + 0.3}
            />

            {/* Gradient definition */}
            <defs>
              <radialGradient id="creatureGradient" cx="40%" cy="40%">
                <stop offset="0%" stopColor="#FF8C6E" />
                <stop offset="100%" stopColor="#FF6B4A" />
              </radialGradient>
            </defs>

            {/* Eyes - more visible at higher levels */}
            {note.level >= 2 && (
              <>
                <circle cx="75" cy="85" r={4 + note.level} fill="rgba(26, 20, 16, 0.5)" />
                <circle cx="125" cy="85" r={4 + note.level} fill="rgba(26, 20, 16, 0.5)" />
              </>
            )}

            {/* Mouth/detail - more visible at higher levels */}
            {note.level >= 3 && (
              <path
                d="M 85 120 Q 100 130, 115 120"
                stroke="rgba(26, 20, 16, 0.3)"
                strokeWidth="2"
                fill="none"
              />
            )}
          </svg>
        </div>

        {/* Creature name */}
        <div className="text-center">
          <h1 className="text-creature-name text-coral mb-2">{note.name}</h1>
          <p className="text-mono text-ink-muted">{note.frequency} Hz</p>
        </div>

        {/* Progress section */}
        {currentSession.active && (
          <div className="w-full max-w-xs">
            <div className="mb-4">
              <p className="text-sm text-ink-muted text-center mb-2 font-mono">
                Listening Session
              </p>
              <div className="bg-pearl-dark rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-coral transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-ink-muted text-center mt-2 font-mono">
                {formatTime(currentSession.elapsed)} / {formatTime(currentSession.duration)}
              </p>
            </div>
          </div>
        )}

        {/* XP/Growth section */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-ink-muted font-mono">Level {note.level}</p>
            <p className="text-xs text-ink-muted font-mono">
              {Math.floor(note.totalListenTime / 60)}m {note.totalListenTime % 60}s
            </p>
          </div>
          <div className="bg-pearl-dark rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-coral transition-all duration-500"
              style={{
                width: `${((note.totalListenTime % 600) / 600) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-ink-muted text-center mt-2 font-mono">
            {600 - (note.totalListenTime % 600)}s to level up
          </p>
        </div>

        {/* Listen button */}
        <button
          onClick={toggleAudio}
          className={`
            px-8 py-4 rounded-full font-mono text-sm font-semibold
            transition-all duration-200 shadow-lg
            ${
              isPlaying
                ? 'bg-coral-dark text-pearl hover:bg-coral glow-coral-intense'
                : 'bg-coral text-pearl hover:bg-coral-light glow-coral'
            }
          `}
        >
          {isPlaying ? 'Stop Listening' : 'Listen'}
        </button>
      </div>

      {/* Lore panel */}
      <div className="w-full max-w-md px-6 py-8 bg-pearl-dark rounded-2xl border border-pearl-border">
        <h2 className="text-lora text-lg font-semibold text-ink mb-4">The Foundation</h2>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs text-ink-muted font-mono mb-1">Frequency</p>
            <p className="text-lora text-ink">{note.frequency} Hz</p>
          </div>

          <div>
            <p className="text-xs text-ink-muted font-mono mb-1">Healing Property</p>
            <p className="text-lora text-sm text-ink">
              Grounding. Stability. The note that anchors all others. Ancient cultures used it to calm the nervous system before sleep.
            </p>
          </div>

          <div>
            <p className="text-xs text-ink-muted font-mono mb-2">Lore</p>
            <p className="text-lora text-sm text-ink italic">
              "{loreFragments[Math.max(0, note.loreUnlocked - 1)]}"
            </p>
          </div>
        </div>

        <div className="border-t border-pearl-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-ink-muted font-mono">Lore Discovered</p>
            <p className="text-sm font-mono font-semibold text-coral">
              {note.loreUnlocked} / 5
            </p>
          </div>

          {note.loreUnlocked < 5 ? (
            <p className="text-xs text-ink-muted">
              Listen for {nextLoreUnlock(note.loreUnlocked)} more minute{nextLoreUnlock(note.loreUnlocked) !== 1 ? 's' : ''} to reveal the next fragment.
            </p>
          ) : (
            <p className="text-xs text-unlocked font-semibold">All lore unlocked!</p>
          )}
        </div>
      </div>
    </div>
  )
}

// CSS animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `
  document.head.appendChild(style)
}
