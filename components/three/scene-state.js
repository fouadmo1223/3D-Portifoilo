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
  impulse: 0,          // extra spin from clicks on the </> core
  rtl: false,
  reducedMotion: false,
}

// World layout of the code universe:
//   core (</> + editor windows)  at the origin
//   contact terminal             in front, at (0, 0.4, 12)
// Each station frames its subject in the part of the screen the section's text
// leaves empty (desktop, LTR — RTL mirrors x, phones re-centre and step back).
export const STATIONS = [
  { id: 'hero',       pos: [1.2, 0.5, 10.5],   look: [-3.1, -0.9, 0] },   // core upper right
  { id: 'about',      pos: [4.0, 1.4, 12.0],   look: [3.9, 0.5, 0] },     // core far left
  { id: 'expertise',  pos: [-4.3, 8.5, 11.0],  look: [-4.3, 8.5, -4] },   // open sky behind the skill ring
  { id: 'work',       pos: [0.0, 0.2, 10.8],   look: [0, 1.6, 0] },       // low, wide, calm
  { id: 'experience', pos: [-2.8, 1.0, 10.0],  look: [-2.9, 0.1, 0] },    // core right
  { id: 'contact',    pos: [-1.0, 0.6, 20.5],  look: [-2.4, 0.5, 12] },   // terminal right
]
