import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="backdrop-fallback flex min-h-[100svh] flex-col items-start justify-end gap-8 p-[var(--gutter)] pb-[12vh]">
      <p className="t-label text-accent">404</p>
      <h1 className="t-display max-w-[14ch]">This page drifted out of the light.</h1>
      <Link href="/" className="t-label border border-line-strong px-5 py-3 transition-colors hover:border-accent hover:text-accent">Return home</Link>
    </main>
  )
}
