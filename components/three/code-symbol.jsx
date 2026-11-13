'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, Text3D } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from './scene-state'

// The hero object: an extruded neon "</>" with two orbit rings.
// It turns toward the pointer, breathes, glows on hover and with scroll speed, and rises in on load.
export function CodeSymbol({ position = [0, 0.3, 0] }) {
  const root = useRef(null)
  const symbol = useRef(null)
  const ringA = useRef(null)
  const ringB = useRef(null)
  const spin = useRef(0)
  const hovered = useRef(false)
  const orbit = useRef(0)
  const boost = useRef(0)

  useFrame((state, dt) => {
    const s = sceneState
    const d = Math.min(dt, 0.05)
    const t = state.clock.elapsedTime
    if (!root.current) return
    root.current.position.y = position[1] + THREE.MathUtils.lerp(-4, 0, s.intro)
    root.current.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, s.intro))

    spin.current += s.impulse
    s.impulse = 0
    spin.current = THREE.MathUtils.damp(spin.current, 0, 1.6, d)
    const idle = s.reducedMotion ? 0 : Math.sin(t * 0.6) * 0.25
    symbol.current.rotation.y = THREE.MathUtils.damp(symbol.current.rotation.y, idle + s.pointer.x * 0.6, 3, d) + spin.current * d * 6
    symbol.current.rotation.x = THREE.MathUtils.damp(symbol.current.rotation.x, -s.pointer.y * 0.35, 3, d)

    const mat = symbol.current.children[0]?.material
    const breathe = s.reducedMotion ? 0 : Math.sin(t * 1.4) * 0.12
    if (mat) mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, (hovered.current ? 1.6 : s.focus ? 1.15 : 0.75) + breathe + s.velocity * 0.9, 5, d)

    if (!s.reducedMotion) {
      // Rings spin up while hovered or scrolling, then ease back.
      boost.current = THREE.MathUtils.damp(boost.current, (hovered.current ? 2.2 : 0) + (s.focus ? 1.6 : 0) + s.velocity * 4, 3, d)
      orbit.current += d * (1 + boost.current)
      const o = orbit.current
      ringA.current.rotation.x = o * 0.35
      ringA.current.rotation.y = o * 0.2
      ringB.current.rotation.y = -o * 0.3
      ringB.current.rotation.z = o * 0.15
    }
  })

  return (
    <group ref={root} position={position}>
      <group
        ref={symbol}
        onPointerOver={(e) => { e.stopPropagation(); hovered.current = true }}
        onPointerOut={() => { hovered.current = false }}
      >
        <Center>
          <Text3D
            font="/fonts/helvetiker_bold.typeface.json"
            size={1.15}
            height={0.32}
            curveSegments={6}
            bevelEnabled
            bevelThickness={0.035}
            bevelSize={0.025}
            bevelSegments={3}
            letterSpacing={0.02}
          >
            {'</>'}
            <meshPhysicalMaterial
              color="#0f2a20"
              emissive="#4af2a1"
              emissiveIntensity={0.75}
              metalness={0.4}
              roughness={0.18}
              clearcoat={1}
              clearcoatRoughness={0.1}
              toneMapped={false}
            />
          </Text3D>
        </Center>
      </group>
      <mesh ref={ringA} raycast={() => null}>
        <torusGeometry args={[2.05, 0.006, 8, 160]} />
        <meshBasicMaterial color="#79c0ff" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 2.4, 0, 0]} raycast={() => null}>
        <torusGeometry args={[2.45, 0.005, 8, 180]} />
        <meshBasicMaterial color="#d2a8ff" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <pointLight color="#4af2a1" intensity={6} distance={7} decay={1.8} />
    </group>
  )
}
