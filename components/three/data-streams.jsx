'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './scene-state'

const PER_CURVE = 4

// Glowing packets travelling along arcs from each editor window into the core.
export function DataStreams({ sources, target = [0, 0.3, 0] }) {
  const packets = useRef(null)
  const curves = useMemo(() => sources.map((src) => {
    const a = new THREE.Vector3(...src)
    const b = new THREE.Vector3(...target)
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 1.4, 0))
    return new THREE.QuadraticBezierCurve3(a, mid, b)
  }), [sources, target])
  const lineGeometries = useMemo(() => curves.map((c) => new THREE.BufferGeometry().setFromPoints(c.getPoints(48))), [curves])
  useEffect(() => () => lineGeometries.forEach((g) => g.dispose()), [lineGeometries])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = curves.length * PER_CURVE

  useFrame((state) => {
    if (!packets.current) return
    const t = state.clock.elapsedTime
    const visible = sceneState.intro
    curves.forEach((curve, ci) => {
      for (let k = 0; k < PER_CURVE; k++) {
        const u = sceneState.reducedMotion ? (k + 0.5) / PER_CURVE : ((t * 0.18 + k / PER_CURVE + ci * 0.13) % 1)
        curve.getPoint(u, dummy.position)
        dummy.scale.setScalar(visible * (0.6 + Math.sin(u * Math.PI) * 0.8))
        dummy.updateMatrix()
        packets.current.setMatrixAt(ci * PER_CURVE + k, dummy.matrix)
      }
    })
    packets.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {lineGeometries.map((g, i) => (
        <line key={i} geometry={g}>
          <lineBasicMaterial color="#79c0ff" transparent opacity={0.16} toneMapped={false} />
        </line>
      ))}
      <instancedMesh ref={packets} args={[null, null, count]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color="#4af2a1" toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
