export function shouldPlayBellOnTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return !window.matchMedia('(pointer: coarse) and (hover: none)').matches
}
