'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CodeSymbol } from './code-symbol'
import { CodeWindow } from './code-window'
import { SNIPPETS } from './snippets'
import { sceneState } from './scene-state'

// A night plain the visitor travels across by scrolling. The camera moves away from
// the viewer (towards -z), passing one landmark per section:
//
//   z =   0   monolith of glowing code glyphs      Hero
//   z = -15   hologram emblem on a stone dais      About
//   z = -31   ring of obelisks                     Expertise
//   z = -47   three standing screens (real work)   Work
//   z = -62   server towers                        Experience
//   z = -78   terminal beacon                      Contact
//
// Everything is built from primitives and canvas textures: nothing to download.

const ACCENT = '#4af2a1'
const BLUE = '#79c0ff'
const ORANGE = '#ffa657'
const VIOLET = '#d2a8ff'
const GLYPHS = ['{', '}', '</>', '=>', '()', '[]', ';', '&&', '||', '::', '#', '0', '1', '!=', '++', '/*', '*/', '<>', '$', '@', '%', '?:', '...', 'fn', 'if', '=', '~', '^']

const noRay = () => null
const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity })
const solid = (color, extra) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.1, ...extra })

function Box({ p, s, m, r }) {
  return (
    <mesh position={p} rotation={r} material={m} raycast={noRay}>
      <boxGeometry args={s} />
    </mesh>
  )
}

function seeded(seed) {
  let x = seed
  return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646 }
}

// Height of the ground at (x, z): rolling dunes that flatten into a path down the middle.
export function groundHeight(x, z) {
  const away = THREE.MathUtils.smoothstep(Math.abs(x), 7, 26)
  const dunes = Math.sin(x * 0.11 + z * 0.05) * 1.6 + Math.sin(x * 0.045 - z * 0.09 + 1.7) * 2.4 + Math.sin(x * 0.23 + z * 0.19) * 0.45
  const ripples = Math.sin(x * 0.9 + z * 0.35) * 0.05 + Math.sin(z * 0.7 - x * 0.2) * 0.04
  return dunes * away * 1.25 + ripples + away * 1.2
}

function Ground({ m }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(190, 240, 120, 150)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0, -42)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)))
    g.computeVertexNormals()
    return g
  }, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} material={m.sand} raycast={noRay} />
}

// Weathered blocks, pillars and lintels scattered beside the path.
function Ruins({ m }) {
  const mesh = useRef(null)
  const blocks = useMemo(() => {
    const rnd = seeded(41)
    const out = []
    for (let i = 0; i < 70; i++) {
      const side = rnd() > 0.5 ? 1 : -1
      const x = side * (8 + rnd() * 34)
      const z = 14 - rnd() * 118
      const tall = rnd() > 0.55
      const w = 0.5 + rnd() * 1.3
      const h = tall ? 1.6 + rnd() * 3.6 : 0.4 + rnd() * 0.9
      const d = 0.5 + rnd() * (tall ? 0.9 : 2.4)
      out.push({ x, z, w, h, d, ry: rnd() * Math.PI, tilt: (rnd() - 0.5) * (tall ? 0.12 : 0.3) })
    }
    return out
  }, [])
  useEffect(() => {
    const dummy = new THREE.Object3D()
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, groundHeight(b.x, b.z) + b.h / 2 - 0.15, b.z)
      dummy.rotation.set(b.tilt, b.ry, b.tilt * 0.6)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [blocks])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, blocks.length]} material={m.stone} raycast={noRay} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  )
}

// The hero: a tall slab whose face is a wall of code glyphs with the </> mark in the middle.
// A few glyphs change every moment, so it reads as alive without costing a shader.
function Monolith({ m, flip }) {
  const W = 512
  const H = 1536
  const COLS = 8
  const ROWS = 26
  const face = useRef(null)
  const since = useRef(0)
  const { ctx, texture, cells } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    const rnd = seeded(11)
    const cells = Array.from({ length: COLS * ROWS }, () => ({ g: GLYPHS[Math.floor(rnd() * GLYPHS.length)], a: 0.25 + rnd() * 0.75 }))
    return { ctx: canvas.getContext('2d'), texture, cells }
  }, [])
  useEffect(() => () => texture.dispose(), [texture])

  const cw = W / COLS
  const ch = H / ROWS
  const emblem = (row) => row >= 4 && row <= 8 // rows left clear for the mark
  const drawCell = (i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    if (emblem(row)) return // never paint over the mark
    ctx.fillStyle = '#04070d'
    ctx.fillRect(col * cw, row * ch, cw, ch)
    const c = cells[i]
    ctx.fillStyle = `rgba(74, 242, 161, ${c.a.toFixed(2)})`
    ctx.fillText(c.g, col * cw + cw / 2, row * ch + ch / 2)
  }
  useEffect(() => {
    ctx.fillStyle = '#04070d'
    ctx.fillRect(0, 0, W, H)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '600 26px ui-monospace, Consolas, monospace'
    cells.forEach((_, i) => drawCell(i))
    // the mark
    ctx.shadowColor = ACCENT
    ctx.shadowBlur = 38
    ctx.fillStyle = '#b9ffe0'
    ctx.font = '700 150px ui-monospace, Consolas, monospace'
    ctx.fillText('</>', W / 2, ch * 6.5)
    ctx.shadowBlur = 0
    ctx.font = '600 26px ui-monospace, Consolas, monospace'
    texture.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, texture, cells])

  useFrame((state, dt) => {
    const s = sceneState
    if (face.current) face.current.color.setScalar(0.82 + (s.reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.1) + s.velocity * 0.4)
    if (s.reducedMotion || s.station > 1.4) return
    since.current += dt
    if (since.current < 0.14) return
    since.current = 0
    for (let n = 0; n < 5; n++) {
      const i = Math.floor(Math.random() * cells.length)
      cells[i] = { g: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], a: Math.random() > 0.8 ? 1 : 0.25 + Math.random() * 0.6 }
      drawCell(i)
    }
    texture.needsUpdate = true
  })

  return (
    <group>
      <Box p={[0, 3.6, 0]} s={[2.5, 7.6, 0.95]} m={m.obsidian} r={[0, 0, 0]} />
      <mesh position={[0, 3.6, 0.48]} scale={[flip, 1, 1]} raycast={noRay}>
        <planeGeometry args={[2.3, 6.9]} />
        <meshBasicMaterial ref={face} map={texture} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <Box p={[0, 7.42, 0]} s={[2.5, 0.03, 0.95]} m={m.accent} />
      <Box p={[0, 0.04, 0.9]} s={[2.5, 0.03, 0.03]} m={m.accentDim} />
      {/* light spilling onto the sand */}
      <mesh position={[0, 0.03, 1.6]} rotation-x={-Math.PI / 2} raycast={noRay}>
        <circleGeometry args={[4.2, 40]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 3.4, 2.4]} intensity={26} distance={16} color={ACCENT} />
    </group>
  )
}

function Dais({ m, flip }) {
  const beam = useRef(null)
  const ring = useRef(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (beam.current) beam.current.material.opacity = 0.02 + (sceneState.reducedMotion ? 0 : Math.sin(t * 1.3) * 0.007)
    if (ring.current && !sceneState.reducedMotion) ring.current.rotation.z = t * 0.4
  })
  return (
    <group>
      <mesh position={[0, 0.14, 0]} material={m.stone} raycast={noRay}><cylinderGeometry args={[1.5, 1.75, 0.28, 10]} /></mesh>
      <mesh position={[0, 0.36, 0]} material={m.obsidian} raycast={noRay}><cylinderGeometry args={[1.05, 1.2, 0.18, 40]} /></mesh>
      <mesh ref={ring} position={[0, 0.46, 0]} rotation-x={-Math.PI / 2} material={m.accent} raycast={noRay}><ringGeometry args={[0.8, 0.86, 48, 1, 0, Math.PI * 1.7]} /></mesh>
      <mesh ref={beam} position={[0, 2.4, 0]} raycast={noRay}>
        <cylinderGeometry args={[1.1, 0.8, 4, 40, 1, true]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.02} depthWrite={false} />
      </mesh>
      <group position={[0, 1.95, 0]} scale={[0.55 * flip, 0.55, 0.55]}>
        <Suspense fallback={null}><CodeSymbol position={[0, 0, 0]} /></Suspense>
      </group>
      {/* two broken pillars framing it */}
      <Box p={[-2.4, 1.5, -1.2]} s={[0.7, 3.0, 0.7]} m={m.stone} r={[0, 0.3, 0.03]} />
      <Box p={[2.5, 0.9, -1.0]} s={[0.7, 1.8, 0.7]} m={m.stone} r={[0, -0.2, -0.05]} />
      <pointLight position={[0, 2.2, 1.4]} intensity={16} distance={12} color={ACCENT} />
    </group>
  )
}

// A half ring of obelisks; the DOM skill ring sits in the open sky above them.
function Obelisks({ m }) {
  const stones = useMemo(() => Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.08 + (i / 8) * 0.84)
    return { x: Math.cos(a) * 7.5, z: -Math.sin(a) * 5.5, h: 3.4 + ((i * 37) % 5) * 0.55, cap: [m.accent, m.blue, m.violet][i % 3] }
  }), [m])
  return (
    <group>
      {stones.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation-y={-s.x * 0.06}>
          <Box p={[0, s.h / 2, 0]} s={[0.62, s.h, 0.62]} m={m.obsidian} />
          <mesh position={[0, s.h + 0.3, 0]} rotation-y={Math.PI / 4} material={m.obsidian} raycast={noRay}><coneGeometry args={[0.44, 0.6, 4]} /></mesh>
          <Box p={[0, s.h * 0.72, 0.315]} s={[0.07, s.h * 0.34, 0.01]} m={s.cap} />
          <Box p={[0, 0.05, 0.33]} s={[0.62, 0.03, 0.03]} m={s.cap} />
        </group>
      ))}
      <pointLight position={[0, 2.5, -1]} intensity={14} distance={14} color={BLUE} />
    </group>
  )
}

// Three standing screens showing real project covers.
function Screens({ m, shots, flip }) {
  const [textures, setTextures] = useState([])
  useEffect(() => {
    if (!shots?.length) return
    let alive = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    const loaded = []
    shots.slice(0, 3).forEach((src, i) => loader.load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      loaded.push(tex)
      if (alive) setTextures((list) => { const next = [...list]; next[i] = tex; return next })
      else tex.dispose()
    }, undefined, () => {}))
    return () => { alive = false; loaded.forEach((t) => t.dispose()) }
  }, [shots])
  return (
    <group>
      {[[-5.6, 0.5, 0.42], [0, -0.8, 0], [5.6, 0.5, -0.42]].map(([x, z, ry], i) => (
        <group key={x} position={[x, 0, z]} rotation-y={ry}>
          <Box p={[0, 2.5, -0.07]} s={[4.3, 2.75, 0.12]} m={m.obsidian} />
          <Box p={[-1.6, 0.6, -0.07]} s={[0.14, 1.2, 0.14]} m={m.obsidian} />
          <Box p={[1.6, 0.6, -0.07]} s={[0.14, 1.2, 0.14]} m={m.obsidian} />
          <mesh position={[0, 2.5, 0]} scale={[flip, 1, 1]} raycast={noRay}>
            <planeGeometry args={[4.1, 2.56]} />
            {textures[i]
              ? <meshBasicMaterial key="cover" map={textures[i]} toneMapped={false} color="#9aa3b5" side={THREE.DoubleSide} />
              : <meshBasicMaterial key="blank" color="#0b1220" side={THREE.DoubleSide} />}
          </mesh>
          <Box p={[0, 1.1, 0]} s={[4.1, 0.03, 0.03]} m={i === 1 ? m.accent : m.blue} />
        </group>
      ))}
      <pointLight position={[0, 2.6, 4]} intensity={12} distance={14} color={BLUE} />
    </group>
  )
}

function Tower({ m, height = 4, phase = 0 }) {
  const leds = useRef([])
  const rows = Math.floor((height - 0.5) / 0.235)
  useFrame((state) => {
    if (sceneState.reducedMotion || sceneState.station < 2.6) return
    const t = state.clock.elapsedTime + phase
    leds.current.forEach((led, i) => { if (led) led.visible = Math.sin(t * (2 + (i % 5)) + i * 1.7) > -0.35 })
  })
  return (
    <group>
      <Box p={[0, height / 2, 0]} s={[1.3, height, 1.3]} m={m.obsidian} />
      <Box p={[0, height + 0.02, 0]} s={[1.34, 0.04, 1.34]} m={m.blue} />
      {Array.from({ length: rows }, (_, i) => (
        <group key={i} position={[0, 0.35 + i * 0.235, 0.655]}>
          <Box p={[0, 0, 0]} s={[1.12, 0.18, 0.02]} m={m.panel} />
          <Box p={[-0.26, 0, 0.012]} s={[0.46, 0.02, 0.01]} m={m.accentDim} />
          {[0.24, 0.34, 0.44].map((x, j) => (
            <mesh key={j} ref={(el) => { leds.current[i * 3 + j] = el }} position={[x, 0, 0.014]} material={j === 2 ? m.orange : j === 1 ? m.blue : m.accent} raycast={noRay}>
              <circleGeometry args={[0.02, 8]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Beacon({ m, flip }) {
  return (
    <group rotation-y={-0.42}>
      <mesh position={[0, 0.1, 0]} material={m.stone} raycast={noRay}><cylinderGeometry args={[1.1, 1.3, 0.2, 10]} /></mesh>
      <Box p={[0, 0.95, -0.1]} s={[0.16, 1.5, 0.16]} m={m.obsidian} />
      <Box p={[0, 2.6, -0.06]} s={[3.5, 2.24, 0.1]} m={m.obsidian} r={[-0.08, 0, 0]} />
      <group position={[0, 2.6, 0.01]} rotation={[-0.08, 0, 0]} scale={[flip, 1, 1]}>
        <CodeWindow snippet={SNIPPETS.terminal} position={[0, 0, 0]} width={3.3} active={[3.6, 5.5]} speed={30} channel="terminal" fixed />
      </group>
      <Box p={[0, 1.46, 0.03]} s={[3.5, 0.03, 0.03]} m={m.orange} r={[-0.08, 0, 0]} />
      {/* signal beam into the sky */}
      <mesh position={[0, 12, -0.6]} raycast={noRay}>
        <cylinderGeometry args={[0.05, 0.05, 20, 8, 1, true]} />
        <meshBasicMaterial color={ORANGE} toneMapped={false} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 2.4, 2.2]} intensity={14} distance={11} color={ORANGE} />
    </group>
  )
}

export function World({ shots, rtl = false }) {
  const flip = rtl ? -1 : 1 // the world is mirrored for RTL; screens are flipped back so text reads correctly
  const m = useMemo(() => ({
    sand: solid('#141d33', { roughness: 1, metalness: 0 }),
    stone: solid('#18233b', { roughness: 0.95 }),
    obsidian: solid('#070b13', { roughness: 0.35, metalness: 0.7 }),
    panel: solid('#0e1522', { roughness: 0.4, metalness: 0.6 }),
    accent: glow(ACCENT),
    accentDim: glow(ACCENT, 0.45),
    blue: glow(BLUE),
    violet: glow(VIOLET),
    orange: glow(ORANGE),
  }), [])
  useEffect(() => () => Object.values(m).forEach((x) => x.dispose()), [m])

  return (
    <group scale={[flip, 1, 1]}>
      <Ground m={m} />
      <Ruins m={m} />
      <group position={[4.5, 0, 0]} rotation-y={-0.26}><Monolith m={m} flip={flip} /></group>
      <group position={[-3.6, 0, -15]}><Dais m={m} flip={flip} /></group>
      <group position={[0, 0, -31]}><Obelisks m={m} /></group>
      <group position={[0, 0, -47]}><Screens m={m} shots={shots} flip={flip} /></group>
      <group position={[4.6, 0, -62]}>
        <group rotation-y={-0.3}><Tower m={m} height={5.2} /></group>
        <group position={[2.6, 0, -2.4]} rotation-y={-0.5}><Tower m={m} height={3.6} phase={2} /></group>
        <group position={[-1.2, 0, -3.6]} rotation-y={-0.1}><Tower m={m} height={4.2} phase={5} /></group>
        <pointLight position={[-0.5, 2.6, 2.6]} intensity={14} distance={12} color={BLUE} />
      </group>
      <group position={[3.6, 0, -78]}><Beacon m={m} flip={flip} /></group>
    </group>
  )
}
