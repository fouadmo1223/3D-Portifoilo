'use client'

// Runs `cb` once the loader has finished (immediately if it already has).
export function onIntro(cb) {
  if (document.documentElement.dataset.introDone) {
    cb()
    return () => {}
  }
  window.addEventListener('p3d:intro', cb, { once: true })
  return () => window.removeEventListener('p3d:intro', cb)
}

export function markIntroDone() {
  document.documentElement.dataset.introDone = '1'
  window.dispatchEvent(new Event('p3d:intro'))
}
