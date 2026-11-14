// Mutable state shared between DOM scroll logic and the render loop.
// Written by ScrollTrigger/pointer handlers, read inside useFrame — no React re-renders.
export const sceneState = {
  station: 0,          // float: 0 = hero … STATIONS.length - 1 = contact
  intro: 0,            // 0 → 1 entrance animation
  pointer: { x: 0, y: 0 },
  velocity: 0,         // 0 → 1 smoothed scroll speed, drives the warp
  workPresence: 0,     // 0 → 1 while the Work reel is on screen
  activeProject: 0,    // index into the reel's projects
  focus: null,         // { title, code } published by a hovered job or principle
  terminal: null,      // { code } mirrored from the contact form
  orbit: 0,            // radians the visitor has dragged the camera around the monolith (hero only)
  impulse: 0,          // extra spin from clicks on the </> core
  rtl: false,
  reducedMotion: false,
}

// World layout: a night plain the camera crosses towards -z (see world.jsx).
// Each station frames one landmark in the part of the screen the section's text
// leaves empty (desktop, LTR; RTL mirrors the world and the camera, phones step back).
export const ORBIT_PIVOT = [4.5, 3, 0] // dragging in the hero swings the camera around the monolith
// `phone` is the framing for narrow screens: the landmark sits centred behind the text.
export const STATIONS = [
  { id: 'hero',       pos: [-1.2, 1.3, 13.5],  look: [0.7, 3.3, 0],      phone: { pos: [4.5, 1.6, 19],    look: [4.5, 4.4, 0] } },     // monolith, towering on the right
  { id: 'about',      pos: [-1.4, 2.0, -5.5],  look: [0.8, 1.9, -15],    phone: { pos: [-3.6, 2.2, -2],   look: [-3.6, 2.2, -15] } },  // hologram dais, on the left
  { id: 'expertise',  pos: [0, 2.2, -19],      look: [0, 5.2, -31],      phone: { pos: [0, 2.2, -15],     look: [0, 5.6, -31] } },     // obelisk ring under open sky
  { id: 'work',       pos: [0, 2.6, -36],      look: [0, 2.7, -47],      phone: { pos: [0, 2.6, -31],     look: [0, 2.7, -47] } },     // the standing screens
  { id: 'experience', pos: [0.4, 1.8, -52],    look: [-0.8, 2.3, -62],   phone: { pos: [4.6, 2.2, -47],   look: [4.6, 2.8, -62] } },   // server towers, on the right
  { id: 'contact',    pos: [0, 2.0, -67],      look: [0.9, 2.3, -78],    phone: { pos: [3.6, 2.2, -63],   look: [3.6, 2.7, -78] } },   // terminal beacon, on the right
]
