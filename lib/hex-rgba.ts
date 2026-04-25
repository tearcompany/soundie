export function hexToRgba(hex: string, alpha: number): string {
  const s = hex.replace('#', '')
  const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
