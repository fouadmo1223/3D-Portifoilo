'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { World } from './world'
import { MagicDust } from './magic-dust'
import { Sky } from './sky'
import { sceneState, STATIONS, ORBIT_PIVOT } from './scene-state'

const tmpPos = new THREE.Vector3()
const tmpLook = new THREE.Vector3()
const smooth = (t) => t * t * (3 - 2 * t)

const BASE_FOV = 34

// A star field that travels with the camera, so the sky never runs out on the way across the plain.
function StarDome({ count }) {
  const group = useRef(null)
  useFrame((state) => { group.current?.position.copy(state.camera.position) })
  return (
    <group ref={group}>
      <Stars radius={70} depth={40} count={count} factor={6} saturation={0.2} fade speed={sceneState.reducedMotion ? 0 : 0.7} />
    </group>
  )
}

function CameraRig({ narrow }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(...STATIONS[0].look))
  const lastScroll = useRef(typeof window !== 'undefined' ? window.scrollY : 0)
  const orbit = useRef(0)

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05)
    const s = sceneState
    const last = STATIONS.length - 1
    const st = THREE.MathUtils.clamp(s.station, 0, last)
    const i = Math.min(Math.floor(st), last - 1)
    const t = smooth(st - i)
    const a = narrow ? STATIONS[i].phone : STATIONS[i]
    const b = narrow ? STATIONS[i + 1].phone : STATIONS[i + 1]
    const mirror = s.rtl ? -1 : 1

    tmpPos.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], t) * mirror,
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
    )
    tmpLook.set(
      THREE.MathUtils.lerp(a.look[0], b.look[0], t) * mirror,
      THREE.MathUtils.lerp(a.look[1], b.look[1], t),
      THREE.MathUtils.lerp(a.look[2], b.look[2], t),
    )
    // Dragging in the hero swings the camera around the monolith.
    orbit.current = THREE.MathUtils.damp(orbit.current, s.orbit * THREE.MathUtils.clamp(1 - st * 2.2, 0, 1), 5, delta)
    if (Math.abs(orbit.current) > 0.0005) {
      const cos = Math.cos(orbit.current)
      const sin = Math.sin(orbit.current)
      for (const v of [tmpPos, tmpLook]) {
        const x = v.x - ORBIT_PIVOT[0] * mirror
        const z = v.z - ORBIT_PIVOT[2]
        v.x = ORBIT_PIVOT[0] * mirror + x * cos + z * sin
        v.z = ORBIT_PIVOT[2] - x * sin + z * cos
      }
    }
    // Scroll speed, smoothed: feeds the grid warp and a slight lens push.
    const y = window.scrollY
    const speed = Math.min(1, Math.abs(y - lastScroll.current) / Math.max(delta, 0.001) / 3200)
    lastScroll.current = y
    s.velocity = s.reducedMotion ? 0 : THREE.MathUtils.damp(s.velocity, speed, speed > s.velocity ? 6 : 2.2, delta)
    const fov = BASE_FOV + s.velocity * 7
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix() }

    tmpPos.x += s.pointer.x * 0.45
    tmpPos.y += s.pointer.y * 0.3
    // Entrance: start further back and higher, then dolly in.
    tmpPos.z += (1 - s.intro) * 9
    tmpPos.y += (1 - s.intro) * 2.2

    const lambda = s.reducedMotion ? 50 : 2.1
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tmpPos.x, lambda, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, tmpPos.y, lambda, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tmpPos.z, lambda, delta)
    look.current.x = THREE.MathUtils.damp(look.current.x, tmpLook.x, lambda, delta)
    look.current.y = THREE.MathUtils.damp(look.current.y, tmpLook.y, lambda, delta)
    look.current.z = THREE.MathUtils.damp(look.current.z, tmpLook.z, lambda, delta)
    camera.lookAt(look.current)
  })
  return null
}

// One half-resolution bloom pass on capable machines; nothing on the rest.
// (The vignette is plain CSS in the backdrop, so it costs no GPU pass.)
function Effects({ tier }) {
  if (tier !== 'high') return null
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.34} luminanceSmoothing={0.25} intensity={0.85} mipmapBlur radius={0.7} resolutionScale={0.5} />
    </EffectComposer>
  )
}

function initialTier() {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = window.innerWidth < 768
  const memory = navigator.deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 8
  if (coarse || small || memory <= 2) return 'low'
  if (memory < 8 || cores < 8) return 'mid'
  return 'high'
}

const downgrade = (tier) => (tier === 'high' ? 'mid' : 'low')

export default function Scene({ onReady, shots }) {
  const [tier, setTier] = useState('mid')
  const [dpr, setDpr] = useState(1)
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const t = initialTier()
    setTier(t)
    setDpr(t === 'high' ? Math.min(window.devicePixelRatio, 1.25) : 1)
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: BASE_FOV, near: 0.1, far: 150, position: [-2, 4, 26] }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        requestAnimationFrame(() => onReady?.())
      }}
    >
      <color attach="background" args={['#070c18']} />
      <fog attach="fog" args={['#070c18', 16, 82]} />
      <PerformanceMonitor
        onDecline={() => { setTier(downgrade); setDpr((d) => Math.max(0.85, d - 0.2)) }}
        flipflops={3}
        onFallback={() => { setTier('low'); setDpr(1) }}
      />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#8fb0ff', '#0a1020', 0.9]} />
      {/* moonlight from behind the landmarks, plus a faint fill from the viewer's side */}
      <directionalLight position={[-12, 14, -26]} intensity={2.2} color="#9db9ff" />
      <directionalLight position={[5, 6, 12]} intensity={0.3} color="#cfe6ff" />
      <CameraRig narrow={narrow} />
      {tier !== 'low' && <Sky />}
      <StarDome count={tier === 'low' ? 1200 : 3200} />

      <World shots={shots} rtl={sceneState.rtl} />
      <MagicDust trail={!narrow && tier !== 'low'} />
      <Effects tier={tier} />
    </Canvas>
  )
}
