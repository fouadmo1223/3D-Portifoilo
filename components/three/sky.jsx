'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './scene-state'

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 mv = viewMatrix * vec4(position + cameraPosition, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`

// Aurora ribbons low on the horizon plus a field of twinkling stars.
// Everything is computed from the view direction, so it costs one cheap pass.
const skyFragment = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
  }
  float ribbon(float az, float el, float centre, float width, float seed) {
    float c = centre + 0.07 * sin(az * 2.0 + uTime * 0.11 + seed) + 0.06 * noise(vec2(az * 3.0 + seed, uTime * 0.05));
    float rays = noise(vec2(az * 26.0 + seed * 7.0, uTime * 0.22));
    rays = 0.15 + 0.85 * rays * rays;
    // Patches drift along the horizon so the curtain is never a full band.
    float drift = smoothstep(0.35, 0.75, noise(vec2(az * 1.6 + seed + uTime * 0.02, seed)));
    float x = (el - c) / width;
    // Sharp lower edge, soft fall-off upward — the way curtains of aurora hang.
    float shape = x < 0.0 ? exp(-x * x * 30.0) : exp(-x * 3.2);
    return shape * rays * drift;
  }
  void main() {
    vec3 d = normalize(vDir);
    float az = atan(d.x, -d.z);
    float el = d.y;

    vec3 green = vec3(0.29, 0.95, 0.63);
    vec3 blue = vec3(0.47, 0.75, 1.0);
    vec3 purple = vec3(0.82, 0.66, 1.0);

    float a1 = ribbon(az, el, 0.17, 0.07, 0.0);
    float a2 = ribbon(az * 0.8 + 1.7, el, 0.27, 0.09, 4.0);
    vec3 col = mix(green, blue, smoothstep(0.1, 0.35, el)) * a1 * 0.34;
    col += mix(blue, purple, smoothstep(0.2, 0.5, el)) * a2 * 0.24;
    col *= smoothstep(0.0, 0.08, el) * (1.0 + uEnergy * 1.2);

    vec2 uv = vec2(az * 40.0, el * 70.0);
    float s = hash(floor(uv));
    float star = step(0.975, s) * smoothstep(0.45, 0.0, length(fract(uv) - 0.5));
    star *= 0.55 + 0.45 * sin(uTime * (1.0 + s * 3.0) + s * 80.0);
    col += vec3(0.8, 0.9, 1.0) * star * 0.7 * smoothstep(-0.05, 0.2, el);

    gl_FragColor = vec4(col, 1.0);
  }
`

const streakFragment = /* glsl */ `
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    float head = smoothstep(0.0, 1.0, vUv.x);
    float core = smoothstep(0.5, 0.0, abs(vUv.y - 0.5));
    gl_FragColor = vec4(vec3(0.75, 0.95, 1.0) * head * head * core * uAlpha * 2.0, 1.0);
  }
`
const streakVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

// One shooting star, re-used: it waits, streaks across the far sky, then waits again.
function ShootingStar({ delay }) {
  const mesh = useRef(null)
  const state = useRef({ wait: delay, t: 1, from: new THREE.Vector3(), dir: new THREE.Vector3() })
  const uniforms = useMemo(() => ({ uAlpha: { value: 0 } }), [])

  useFrame((three, dt) => {
    const st = state.current
    const m = mesh.current
    if (!m || sceneState.reducedMotion) return
    if (st.t >= 1) {
      st.wait -= dt
      uniforms.uAlpha.value = 0
      if (st.wait > 0) return
      const cam = three.camera.position
      const left = Math.random() < 0.5 ? -1 : 1
      st.from.set(cam.x + (Math.random() - 0.5) * 30, cam.y + 6 + Math.random() * 7, cam.z - 30)
      st.dir.set(left * (5 + Math.random() * 5), -(2.5 + Math.random() * 3), 0)
      m.rotation.z = Math.atan2(st.dir.y, st.dir.x)
      st.t = 0
      st.wait = 5 + Math.random() * 8
    }
    st.t = Math.min(1, st.t + dt / 0.9)
    m.position.copy(st.from).addScaledVector(st.dir, st.t)
    uniforms.uAlpha.value = Math.sin(st.t * Math.PI)
  })

  return (
    <mesh ref={mesh} frustumCulled={false}>
      <planeGeometry args={[3.2, 0.05]} />
      <shaderMaterial vertexShader={streakVertex} fragmentShader={streakFragment} uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  )
}

export function Sky() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uEnergy: { value: 0 } }), [])
  useFrame((_, dt) => {
    if (!sceneState.reducedMotion) uniforms.uTime.value += Math.min(dt, 0.05)
    uniforms.uEnergy.value = sceneState.velocity
  })
  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[60, 32, 16]} />
        <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} depthTest={false} toneMapped={false} fog={false} />
      </mesh>
      <ShootingStar delay={3} />
      <ShootingStar delay={8} />
    </>
  )
}
