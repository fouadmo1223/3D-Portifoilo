'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { CodeSymbol } from './code-symbol'
import { CodeWindow } from './code-window'
import { CodeTokens } from './code-tokens'
import { GridFloor } from './grid-floor'
import { DataStreams } from './data-streams'
import { MagicDust } from './magic-dust'
import { Sky } from './sky'
import { SNIPPETS } from './snippets'
import { sceneState, STATIONS } from './scene-state'

const tmpPos = new THREE.Vector3()
const tmpLook = new THREE.Vector3()
const smooth = (t) => t * t * (3 - 2 * t)

// Editor windows clustered around the core, kept clear of the hero copy.
const WINDOWS = [
  { snippet: SNIPPETS.react, position: [-0.9, 1.75, -2.6], rotation: [0, 0.14, 0.02], width: 2.0, delay: 0.4 },
  { snippet: SNIPPETS.node, position: [1.9, 1.7, -3.0], rotation: [0, -0.36, -0.02], width: 2.0, delay: 1.2 },
  { snippet: SNIPPETS.shader, position: [2.0, -1.5, -0.6], rotation: [0, -0.3, 0.02], width: 1.8, delay: 2 },
]
const BASE_FOV = 34

function CameraRig({ narrow }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(...STATIONS[0].look))
  const lastScroll = useRef(typeof window !== 'undefined' ? window.scrollY : 0)

  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05)
    const s = sceneState
    const last = STATIONS.length - 1
    const st = THREE.MathUtils.clamp(s.station, 0, last)
    const i = Math.min(Math.floor(st), last - 1)
    const t = smooth(st - i)
    const a = STATIONS[i]
    const b = STATIONS[i + 1]
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
    if (narrow) {
      // Phones: centre the subject behind the text and step back.
      const dir = tmpPos.clone().sub(tmpLook).normalize()
      tmpLook.x *= 0.1
      tmpPos.addScaledVector(dir, 4.5)
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
    tmpPos.z += (1 - s.intro) * 1.2
    tmpPos.y += (1 - s.intro) * 3.2

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

export default function Scene({ onReady }) {
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

  const windows = narrow ? WINDOWS.slice(0, 2) : WINDOWS

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: tier !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: BASE_FOV, near: 0.1, far: 80, position: [0, 3, 16] }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
        requestAnimationFrame(() => onReady?.())
      }}
    >
      <color attach="background" args={['#05070c']} />
      <fog attach="fog" args={['#05070c', 10, 42]} />
      <PerformanceMonitor
        onDecline={() => { setTier(downgrade); setDpr((d) => Math.max(0.85, d - 0.2)) }}
        flipflops={3}
        onFallback={() => { setTier('low'); setDpr(1) }}
      />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 6, 4]} intensity={0.9} color="#bfe9ff" />
      <pointLight position={[-6, 3, 3]} intensity={10} distance={18} color="#79c0ff" />
      <CameraRig narrow={narrow} />
      {tier !== 'low' && <Sky />}

      <Suspense fallback={null}>
        <CodeSymbol />
      </Suspense>
      {windows.map((w, i) => <CodeWindow key={w.snippet.title} {...w} channel={i === 0 ? 'focus' : null} />)}
      <DataStreams sources={windows.map((w) => w.position)} />
      <CodeTokens count={tier === 'high' ? 30 : tier === 'mid' ? 22 : 12} />
      <Sparkles count={tier === 'low' ? 40 : 80} scale={[26, 12, 40]} position={[0, 3.5, 4]} size={2.2} speed={0.3} opacity={0.55} color="#9fd4ff" />
      <CodeWindow snippet={SNIPPETS.terminal} position={[0, 0.4, 12]} width={2.9} active={[3.8, 5.5]} speed={30} channel="terminal" onlyNear />
      <GridFloor />
      <MagicDust trail={!narrow && tier !== 'low'} />
      <Effects tier={tier} />
    </Canvas>
  )
}
