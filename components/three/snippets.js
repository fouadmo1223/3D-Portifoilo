// Code shown in the floating editor windows. Short, real, and representative of the stack.
export const SNIPPETS = {
  react: {
    title: 'Hero.jsx',
    code: `import { Canvas } from '@react-three/fiber'

export default function Hero() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  return (
    <Canvas camera={{ fov: 32 }}>
      <Scene ready={ready} />
    </Canvas>
  )
}`,
  },
  node: {
    title: 'routes/projects.js',
    code: `router.get('/projects', async (req, res) => {
  const page = Number(req.query.page) || 1
  const projects = await Project
    .find({ published: true })
    .sort({ order: 1 })
    .skip((page - 1) * 12)
    .limit(12)

  res.json({ projects, page })
})`,
  },
  shader: {
    title: 'glow.frag',
    code: `uniform float uTime;
varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5);
  float ring = sin(d * 40.0 - uTime * 4.0);
  vec3 glow = vec3(0.29, 0.95, 0.63);
  vec3 col = mix(vec3(0.02), glow, ring);
  gl_FragColor = vec4(col, 1.0 - d * 2.0);
}`,
  },
  mongo: {
    title: 'models/Project.js',
    code: `const ProjectSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  technologies: [String],
  featured: { type: Boolean, default: false },
}, { timestamps: true })

// indexed for the portfolio feed
ProjectSchema.index({ featured: -1, order: 1 })

export default model('Project', ProjectSchema)`,
  },
  terminal: {
    title: 'zsh — fouad@portfolio',
    terminal: true,
    code: `fouad@portfolio:~$ npm run contact
> portfolio@1.0.0 contact
> opening a channel to Fouad...
✓ connected · replies within a day
fouad@portfolio:~$ say "hello"`,
  },
}

export const TOKENS = [
  ['const', '#ff7b72'], ['=>', '#ff7b72'], ['{ }', '#e6edf3'], ['</>', '#4af2a1'], ['async', '#ff7b72'],
  ['await', '#ff7b72'], ['useState()', '#d2a8ff'], ['useEffect', '#d2a8ff'], ['[ ]', '#e6edf3'], ['npm run dev', '#4af2a1'],
  ['git push', '#4af2a1'], ['import', '#ff7b72'], ['export', '#ff7b72'], ['return', '#ff7b72'], ['null', '#79c0ff'],
  ['true', '#79c0ff'], ['===', '#e6edf3'], ['&&', '#e6edf3'], ['.map()', '#d2a8ff'], ['Promise', '#ffa657'],
  ['JSX', '#7ee787'], ['<div>', '#7ee787'], ['0x4af2a1', '#79c0ff'], ['fetch()', '#d2a8ff'], ['vec3', '#ff7b72'],
  ['res.json', '#d2a8ff'], ['200 OK', '#4af2a1'], ['Schema', '#ffa657'], ['() =>', '#ff7b72'], ['...props', '#e6edf3'],
  ['"use client"', '#a5d6ff'], ['THREE', '#ffa657'], ['gsap.to', '#d2a8ff'], ['// TODO', '#8b949e'], ['λ', '#4af2a1'], ['#', '#8b949e'],
]
