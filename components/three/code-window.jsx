'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from './scene-state'
import { countChars, drawWindow, monoFont, tokenize } from './code-texture'

const W = 768
const H = 480
const REDRAW = 1 / 12 // seconds between texture uploads

// A floating editor (or terminal) window that types its snippet, pauses, and starts over.
// With a `channel` it also listens to the page: when a section publishes content on
// sceneState[channel] (a hovered job, the contact form…) the window types that instead.
// It only redraws while its camera station is near, so idle windows cost nothing.
export function CodeWindow({ snippet, position, rotation = [0, 0, 0], width = 2.4, active = [0, 2.5], speed = 38, delay = 0, channel = null, onlyNear = false, fixed = false }) {
  const group = useRef(null)
  const edge = useRef(null)
  const typed = useRef(-delay * speed)
  const last = useRef({ chars: -1, cursor: null })
  const hold = useRef(0)
  const since = useRef(1)
  const hovered = useRef(false)
  const override = useRef(null)

  const { ctx, texture, base } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    const lines = tokenize(snippet.code, { terminal: snippet.terminal })
    return { ctx: canvas.getContext('2d'), texture, base: { title: snippet.title, lines, total: countChars(lines) } }
  }, [snippet])
  const content = useRef(base)
  const font = useMemo(() => monoFont(), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, (width * H) / W)), [width])
  useEffect(() => { content.current = base; override.current = null; last.current.chars = -1 }, [base])
  useEffect(() => () => { texture.dispose(); edges.dispose() }, [texture, edges])

  useFrame((state, dt) => {
    const s = sceneState

    // Swap content when the page publishes (or clears) something for this window.
    const incoming = channel ? s[channel] : null
    if (incoming !== override.current) {
      override.current = incoming
      if (incoming) {
        const lines = tokenize(incoming.code, { terminal: snippet.terminal })
        content.current = { title: incoming.title ?? snippet.title, lines, total: countChars(lines) }
        typed.current = incoming.instant ? content.current.total : 0
      } else {
        content.current = base
        typed.current = 0
      }
      hold.current = 0
      last.current.chars = -1
    }

    const { title, lines, total } = content.current
    const near = s.station >= active[0] && s.station <= active[1]
    if (near || incoming || last.current.chars < 0) {
      const rate = incoming ? speed * 3 : speed
      if (s.reducedMotion) typed.current = total
      else if (typed.current < total) typed.current += dt * rate
      else if (!incoming && (hold.current += dt) > 3.5) { hold.current = 0; typed.current = 0 }
      since.current += dt
      const chars = Math.max(0, Math.min(total, Math.floor(typed.current)))
      const cursor = Math.floor(state.clock.elapsedTime * 2) % 2 === 0
      if ((chars !== last.current.chars || cursor !== last.current.cursor) && since.current >= REDRAW) {
        since.current = 0
        drawWindow(ctx, { width: W, height: H, title, lines, visible: chars, cursor, terminal: snippet.terminal, font })
        texture.needsUpdate = true
        last.current = { chars, cursor }
      }
    }

    if (group.current) {
      // Hidden until the camera is on its way here, so it never blocks other views.
      if (onlyNear) group.current.visible = s.station > active[0] - 0.6
      const lit = hovered.current || Boolean(incoming)
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, lit && !fixed ? 1.08 : 1, 6, dt))
      // Lean toward the cursor so the windows feel like they are watching it.
      const lean = s.reducedMotion || fixed ? 0 : 1 // screens mounted on furniture stay put
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, rotation[1] + s.pointer.x * 0.16 * lean, 3, dt)
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, rotation[0] - s.pointer.y * 0.1 * lean, 3, dt)
      if (edge.current) edge.current.opacity = THREE.MathUtils.damp(edge.current.opacity, lit ? 0.9 : 0.28, 6, dt)
    }
  })

  const height = (width * H) / W
  return (
    <Float speed={sceneState.reducedMotion || fixed ? 0 : 1.4} rotationIntensity={fixed ? 0 : 0.25} floatIntensity={fixed ? 0 : 0.5} floatingRange={[-0.08, 0.08]}>
      <group ref={group} position={position} rotation={rotation}>
        <mesh
          {...(fixed ? { raycast: () => null } : {})}
          onPointerOver={(e) => { e.stopPropagation(); hovered.current = true }}
          onPointerOut={() => { hovered.current = false }}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <lineSegments geometry={edges} raycast={() => null}>
          <lineBasicMaterial ref={edge} color="#4af2a1" transparent opacity={0.28} toneMapped={false} />
        </lineSegments>
        {/* soft glow card behind the window */}
        <mesh position={[0, 0, -0.04]} scale={[1.06, 1.1, 1]} raycast={() => null}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#4af2a1" transparent opacity={0.05} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </Float>
  )
}
