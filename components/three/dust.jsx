'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './scene-state'

// Slow-drifting motes catching the key light. Count scales with device tier.
export function Dust({ count = 500 }) {
  const ref = useRef(null)
  const { geometry, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = Math.random() * 7 - 1.7
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
      speeds[i] = 0.02 + Math.random() * 0.08
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: g, speeds }
  }, [count])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, dt) => {
    if (sceneState.reducedMotion || !ref.current) return
    const pos = geometry.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) + speeds[i] * dt
      if (y > 5.3) y = -1.7
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + i) * 0.0008)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.018} color="#9fe8ff" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}
