'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './scene-state'
import { monoFont, tokenCanvas } from './code-texture'
import { TOKENS } from './snippets'

// Syntax tokens drifting through the space as camera-facing sprites.
export function CodeTokens({ count = 36 }) {
  const group = useRef(null)
  const items = useMemo(() => {
    const font = monoFont()
    return Array.from({ length: count }, (_, i) => {
      const [text, color] = TOKENS[i % TOKENS.length]
      const canvas = tokenCanvas(text, color, font)
      const map = new THREE.CanvasTexture(canvas)
      map.colorSpace = THREE.SRGBColorSpace
      const h = 0.16 + Math.random() * 0.16
      return {
        map,
        scale: [h * (canvas.width / canvas.height), h, 1],
        position: new THREE.Vector3((Math.random() - 0.5) * 22, -1.4 + Math.random() * 9, -20 + Math.random() * 30),
        speed: 0.05 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.35 + Math.random() * 0.5,
      }
    })
  }, [count])
  useEffect(() => () => items.forEach((it) => it.map.dispose()), [items])

  useFrame((state, dt) => {
    if (sceneState.reducedMotion || !group.current) return
    const t = state.clock.elapsedTime
    group.current.children.forEach((sprite, i) => {
      const it = items[i]
      sprite.position.y += it.speed * dt
      sprite.position.x += Math.sin(t * 0.4 + it.phase) * 0.002
      if (sprite.position.y > 8) sprite.position.y = -1.6
    })
  })

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <sprite key={i} position={it.position} scale={it.scale}>
          <spriteMaterial map={it.map} transparent opacity={it.opacity} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
}
