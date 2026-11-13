'use client'

import { useEffect, useState } from 'react'
import { setTerminal, terminalFromForm } from '@/components/three/focus'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { SplitText } from '@/components/motion/split-text'
import { Reveal } from '@/components/motion/reveal'
import { Magnetic } from '@/components/motion/magnetic'
import { useLocale } from './locale-provider'
import { SectionLabel } from './section-label'

// Inline field that sits inside the sentence and grows with its content.
function Blank({ name, value, onChange, placeholder, error, type = 'text', autoComplete, label }) {
  return (
    <span className="relative inline-flex flex-col align-baseline">
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={label}
        aria-invalid={Boolean(error)}
        required
        size={Math.max(placeholder.length, value.length, 6)}
        className={`min-w-0 max-w-full border-b bg-transparent px-1 pb-1 text-accent placeholder:text-faint focus:outline-none ${error ? 'border-danger' : 'border-line-strong focus:border-accent'}`}
      />
      {error && <span className="t-mono absolute top-full mt-1 whitespace-nowrap text-danger" role="alert">{error}</span>}
    </span>
  )
}

export function Contact({ profile }) {
  const { t } = useLocale()
  const L = t.contact.letter
  const [form, setForm] = useState({ name: '', subject: '', email: '', message: '', company: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [copied, setCopied] = useState(false)
  // The 3D terminal beside the form echoes what is being written.
  useEffect(() => { setTerminal(terminalFromForm(form, status)) }, [form, status])
  useEffect(() => () => setTerminal(null), [])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setServerError('')
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrors(data.fields ?? {})
        setServerError(data.fields ? '' : data.error || t.chat.error)
        setStatus('error')
        return
      }
      setStatus('sent')
      setForm({ name: '', subject: '', email: '', message: '', company: '' })
    } catch {
      setServerError(t.chat.error)
      setStatus('error')
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <section id="contact" data-station="contact" className="relative z-10 pb-16 pt-[16vh]">
      <div className="wrap grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SectionLabel index={5}>{t.contact.label}</SectionLabel>
          <Reveal as="h2" className="t-display mt-8 max-w-[13ch]"><SplitText text={t.contact.title} /></Reveal>

          {profile.email && (
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Magnetic strength={0.2}>
                <a href={`mailto:${profile.email}`} className="link-line font-display text-[clamp(1.6rem,4.4vw,3.6rem)] leading-none" dir="ltr">{profile.email}</a>
              </Magnetic>
              <button type="button" onClick={copy} className="t-label inline-flex items-center gap-2 text-mute transition-colors hover:text-bone" aria-live="polite">
                {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
                {copied ? t.contact.copied : t.contact.copy}
              </button>
            </div>
          )}

          {status === 'sent' ? (
            <div className="mt-16 max-w-[52ch] border-s border-accent ps-6" role="status">
              <p className="t-lead">{L.sent}</p>
              <button type="button" onClick={() => setStatus('idle')} className="t-label link-line mt-6 text-mute">{L.another}</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-16 max-w-[44rem]">
              <p className="t-lead leading-[1.7]">
                {L.dear}{' '}{L.name}{' '}
                <Blank name="name" label={L.namePh} value={form.name} onChange={set('name')} placeholder={L.namePh} error={errors.name} autoComplete="name" />{' '}
                {L.about}{' '}
                <Blank name="subject" label={L.aboutPh} value={form.subject} onChange={set('subject')} placeholder={L.aboutPh} error={errors.subject} />.{' '}
                {L.reach}{' '}
                <Blank name="email" type="email" label={L.emailPh} value={form.email} onChange={set('email')} placeholder={L.emailPh} error={errors.email} autoComplete="email" />.
              </p>
              <label className="mt-10 block">
                <span className="sr-only">{L.detailsPh}</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={set('message')}
                  rows={4}
                  placeholder={L.detailsPh}
                  aria-invalid={Boolean(errors.message)}
                  required
                  className={`w-full resize-y border-b bg-transparent py-3 text-lg text-bone placeholder:text-faint focus:outline-none ${errors.message ? 'border-danger' : 'border-line-strong focus:border-accent'}`}
                />
                {errors.message && <span className="t-mono mt-2 block text-danger" role="alert">{errors.message}</span>}
              </label>
              {/* Honeypot: hidden from people, tempting to bots */}
              <input type="text" name="company" value={form.company} onChange={set('company')} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Magnetic>
                  <button type="submit" disabled={status === 'sending'} className="group inline-flex items-center gap-3 bg-bone px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-accent disabled:opacity-60">
                    {status === 'sending' ? L.sending : L.send}
                    <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45 rtl:-scale-x-100" />
                  </button>
                </Magnetic>
                {serverError && <p className="t-mono text-danger" role="alert">{serverError}</p>}
              </div>
            </form>
          )}
        </div>

        <aside className="self-end lg:col-span-3 lg:col-start-10">
          <p className="t-label text-mute">{t.contact.elsewhere}</p>
          <ul className="mt-5 border-t border-line">
            {profile.socialLinks.map((link) => (
              <li key={link.url} className="border-b border-line">
                <a href={link.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between py-4">
                  <span className="font-display text-2xl">{link.label}</span>
                  <ArrowUpRight className="size-4 text-faint transition-[color,transform] duration-500 group-hover:-translate-y-0.5 group-hover:text-accent rtl:-scale-x-100" />
                </a>
              </li>
            ))}
            {profile.cvUrl && (
              <li className="border-b border-line">
                <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between py-4">
                  <span className="font-display text-2xl">CV</span>
                  <ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-accent rtl:-scale-x-100" />
                </a>
              </li>
            )}
          </ul>
          {profile.phones.length > 0 && (
            <ul className="t-mono mt-6 space-y-1 text-mute" dir="ltr">
              {profile.phones.map((p) => <li key={p}><a href={`tel:${p.replace(/\s/g, '')}`} className="link-line">{p}</a></li>)}
            </ul>
          )}
        </aside>
      </div>
    </section>
  )
}
