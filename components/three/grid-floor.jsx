'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneState } from './scene-state'

const vertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

// Neon grid that drifts toward the viewer and speeds up with scroll.
const fragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCam;
  varying vec3 vWorld;

  float grid(vec2 p, float size) {
    vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    vec2 p = vWorld.xz + vec2(0.0, uTime * 0.6);
    float minor = grid(p, 1.0) * 0.3;
    float major = grid(p, 5.0);
    float dist = length(vWorld.xz - uCam.xz);
    float fade = smoothstep(34.0, 4.0, dist);
    vec3 accent = vec3(0.29, 0.95, 0.63);
    vec3 col = vec3(0.30, 0.42, 0.58) * minor + accent * major * 0.8;

    float alpha = (minor + major) * fade * 0.6;
    gl_FragColor = vec4(col, alpha);
  }
`

export function GridFloor({ y = -2.2 }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCam: { value: new THREE.Vector3() },
  }), [])

  useFrame((state, dt) => {
    const s = sceneState
    const d = Math.min(dt, 0.05)
    if (!s.reducedMotion) uniforms.uTime.value += d * (1 + s.velocity * 9)
    uniforms.uCam.value.copy(state.camera.position)
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]} raycast={() => null}>
      <planeGeometry args={[140, 140]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
