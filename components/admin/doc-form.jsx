'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2, Trash2 } from 'lucide-react'
import { Field, LangContext, LangSwitch } from './fields'

const hasLoc = (fields) => fields.some((f) => f.type === 'loc' || f.type === 'locList' || (f.fields && hasLoc(f.fields)))
const strip = ({ _id, __v, createdAt, updatedAt, ...rest }) => rest

// One form for every document type. `groups` (from config.js) decides the fields;
// `save` receives the cleaned document and returns the stored one.
export function DocForm({ groups, initial, save, remove, backHref, heading, saveLabel = 'Save changes' }) {
  const [doc, setDoc] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [status, setStatus] = useState('idle') // idle | saving | saved
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [lang, setLang] = useState('en')
  const language = useMemo(() => ({ lang, setLang }), [lang])
  const bilingual = useMemo(() => groups.some((g) => hasLoc(g.fields)), [groups])
  const dirty = useMemo(() => JSON.stringify(doc) !== JSON.stringify(saved), [doc, saved])

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const submit = async (e) => {
    e.preventDefault()
    setStatus('saving')
    setError('')
    setFieldErrors({})
    try {
      const item = await save(strip(doc))
      if (item) { setDoc(item); setSaved(item) } else setSaved(doc)
      setStatus('saved')
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 2500)
    } catch (err) {
      setStatus('idle')
      setError(err.message)
      setFieldErrors(err.fields ?? {})
      // If every problem is in the language that is hidden, show that language.
      const keys = Object.keys(err.fields ?? {})
      const inLang = (code) => keys.some((k) => new RegExp(`(^|\\.)${code}(\\.|$)`).test(k))
      const other = lang === 'en' ? 'ar' : 'en'
      if (inLang(other) && !inLang(lang)) setLang(other)
      // Bring the first problem into view.
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    }
  }

  return (
    <LangContext.Provider value={language}>
    <form onSubmit={submit} noValidate className="mx-auto max-w-4xl pb-24">
      <div className="admin-rise mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          {backHref && <Link href={backHref} className="mb-2 inline-flex items-center gap-1.5 text-xs text-mute hover:text-bone"><ArrowLeft size={13} />Back to list</Link>}
          <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {bilingual && <LangSwitch />}
          {remove && <button type="button" onClick={remove} className="admin-btn hover:!border-danger hover:!text-danger"><Trash2 size={14} />Delete</button>}
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((group, i) => (
          <section key={group.title} style={{ '--i': i + 1 }} className="admin-rise admin-card overflow-hidden">
            <h2 className="flex items-center gap-2.5 border-b border-line bg-coal/50 px-5 py-3.5 font-mono text-[0.7rem] uppercase tracking-widest text-mute"><span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />{group.title}<span className="ms-auto text-faint">{String(i + 1).padStart(2, '0')}</span></h2>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              {group.fields.map((f) => (
                <div key={f.name} className={f.half ? '' : 'md:col-span-2'}>
                  <Field field={f} value={doc[f.name]} onChange={(v) => setDoc((d) => ({ ...d, [f.name]: v }))} errors={fieldErrors} path={f.name} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 backdrop-blur-md lg:start-60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3 lg:px-10">
          <p className="min-w-0 truncate text-sm" role="status">
            {error ? <span className="text-danger">{error}</span>
              : status === 'saved' ? <span className="inline-flex items-center gap-1.5 text-accent"><Check size={14} />Saved. The site is updated.</span>
                : dirty ? <span className="text-mute">Unsaved changes</span>
                  : <span className="text-faint">No changes</span>}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            {bilingual && <LangSwitch className="max-sm:hidden" />}
            <button type="submit" disabled={status === 'saving' || !dirty} className="admin-btn admin-btn-primary">
              {status === 'saving' && <Loader2 size={14} className="animate-spin" />}
              {status === 'saving' ? 'Saving…' : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
    </LangContext.Provider>
  )
}
