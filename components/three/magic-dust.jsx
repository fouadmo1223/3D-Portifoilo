'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './scene-state'

const MAX = 160
const DEPTH = 7 // world units in front of the camera where the dust lives

const vertex = /* glsl */ `
  attribute float aLife;
  attribute float aSeed;
  varying float vLife;
  varying float vSeed;
  void main() {
    vLife = aLife;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (10.0 + aSeed * 22.0) * aLife * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  varying float vLife;
  varying float vSeed;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    // Soft core plus a four-point twinkle.
    float glow = smoothstep(0.5, 0.0, d);
    float star = max(0.0, 1.0 - abs(p.x) * 14.0) * max(0.0, 1.0 - abs(p.y) * 3.0)
               + max(0.0, 1.0 - abs(p.y) * 14.0) * max(0.0, 1.0 - abs(p.x) * 3.0);
    vec3 green = vec3(0.29, 0.95, 0.63);
    vec3 blue = vec3(0.47, 0.75, 1.0);
    vec3 purple = vec3(0.82, 0.66, 1.0);
    vec3 col = vSeed < 0.5 ? mix(green, blue, vSeed * 2.0) : mix(blue, purple, vSeed * 2.0 - 1.0);
    float a = (glow * glow + star * 0.6) * vLife;
    gl_FragColor = vec4(col * a * 1.6, a);
  }
`

// Stardust that follows the cursor. One draw call, one pooled buffer.
export function MagicDust({ trail = true }) {
  const points = useRef(null)
  const head = useRef(0)
  const last = useRef({ x: 0, y: 0 })
  const vel = useMemo(() => new Float32Array(MAX * 3), [])
  const decay = useMemo(() => new Float32Array(MAX).fill(1), [])
  const tmp = useMemo(() => ({ p: new THREE.Vector3() }), [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3))
    g.setAttribute('aLife', new THREE.BufferAttribute(new Float32Array(MAX), 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(Float32Array.from({ length: MAX }, () => Math.random()), 1))
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, dt) => {
    const s = sceneState
    if (s.reducedMotion || !trail) return
    const d = Math.min(dt, 0.05)
    const pos = geometry.attributes.position
    const life = geometry.attributes.aLife
    const cam = state.camera

    const place = (nx, ny) => tmp.p.set(nx, ny, 0.5).unproject(cam).sub(cam.position).normalize().multiplyScalar(DEPTH).add(cam.position)
    const spawn = (x, y, z, vx, vy, vz, seconds) => {
      const i = head.current
      head.current = (i + 1) % MAX
      pos.setXYZ(i, x, y, z)
      vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz
      life.setX(i, 1)
      decay[i] = 1 / seconds
    }

    if (trail) {
      const dx = s.pointer.x - last.current.x
      const dy = s.pointer.y - last.current.y
      const moved = Math.hypot(dx, dy)
      if (moved > 0.004) {
        last.current.x = s.pointer.x
        last.current.y = s.pointer.y
        const n = Math.min(4, 1 + Math.floor(moved * 40))
        for (let k = 0; k < n; k++) {
          place(s.pointer.x - dx * (k / n), s.pointer.y - dy * (k / n))
          spawn(
            tmp.p.x + (Math.random() - 0.5) * 0.12, tmp.p.y + (Math.random() - 0.5) * 0.12, tmp.p.z,
            (Math.random() - 0.5) * 0.35, 0.15 + Math.random() * 0.35, (Math.random() - 0.5) * 0.35,
            0.7 + Math.random() * 0.7,
          )
        }
      }
    }

    const drag = Math.exp(-2.2 * d)
    for (let i = 0; i < MAX; i++) {
      const l = life.array[i]
      if (l <= 0) continue
      life.array[i] = Math.max(0, l - d * decay[i])
      vel[i * 3] *= drag; vel[i * 3 + 1] = vel[i * 3 + 1] * drag + 0.25 * d; vel[i * 3 + 2] *= drag
      pos.array[i * 3] += vel[i * 3] * d
      pos.array[i * 3 + 1] += vel[i * 3 + 1] * d
      pos.array[i * 3 + 2] += vel[i * 3 + 2] * d
    }
    pos.needsUpdate = true
    life.needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry} frustumCulled={false} renderOrder={10} raycast={() => null}>
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
