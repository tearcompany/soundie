'use client'

import { useState } from 'react'

const LOCKED_NOTES = [
  { name: 'D', frequency: 293.66 },
  { name: 'E', frequency: 329.63 },
  { name: 'F', frequency: 349.23 },
  { name: 'G', frequency: 392.00 },
  { name: 'A', frequency: 440.00 },
  { name: 'B', frequency: 493.88 },
  { name: 'C#', frequency: 277.18 },
  { name: 'D#', frequency: 311.13 },
  { name: 'F#', frequency: 369.99 },
  { name: 'G#', frequency: 415.30 },
  { name: 'A#', frequency: 466.16 },
]

export function LockedNotes() {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-pearl via-pearl to-transparent px-6 py-8 pointer-events-none">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs text-ink-muted font-mono text-center mb-4 pointer-events-auto">
          Keep listening to C to discover what lies beyond...
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap pointer-events-auto">
          {LOCKED_NOTES.map((note) => (
            <div
              key={note.name}
              className="relative group"
              onMouseEnter={() => setHoveredNote(note.name)}
              onMouseLeave={() => setHoveredNote(null)}
            >
              {/* Silhouette blob */}
              <svg
                width={48}
                height={48}
                viewBox="0 0 200 200"
                className="transition-all duration-200 hover:scale-110"
                style={{
                  opacity: 0.4,
                  filter: `brightness(${hoveredNote === note.name ? 0.7 : 0.5})`,
                }}
              >
                <path
                  d="M 100 50 C 130 45, 155 65, 160 95 C 165 125, 145 155, 115 160 C 85 165, 50 150, 45 115 C 40 85, 65 45, 100 50 Z"
                  fill="currentColor"
                  className="text-locked"
                />
              </svg>

              {/* Hover tooltip */}
              {hoveredNote === note.name && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap">
                  <div className="bg-ink text-pearl px-3 py-2 rounded-md text-xs font-mono shadow-lg">
                    <p className="font-semibold">{note.name}</p>
                    <p className="text-pearl/70">{note.frequency} Hz</p>
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ink" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
