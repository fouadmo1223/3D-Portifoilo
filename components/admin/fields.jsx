'use client'

import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ImagePlus, Languages, Loader2, Plus, Trash2, X } from 'lucide-react'
import { api } from './api'
import { filterKey } from '@/lib/validators'

const errorFor = (errors, path) => errors?.[path] ?? Object.entries(errors ?? {}).find(([k]) => k.startsWith(`${path}.`))?.[1]

function Label({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8rem] font-medium text-bone/90">
      {children}{required && <span className="ms-1 text-accent" aria-hidden="true">*</span>}
    </label>
  )
}
const Hint = ({ children }) => (children ? <p className="mt-1.5 text-xs text-mute">{children}</p> : null)
const Problem = ({ children }) => (children ? <p role="alert" className="mt-1.5 text-xs text-danger">{children}</p> : null)

function Input({ id, value, onChange, area, rows = 3, invalid, mono, ...rest }) {
  const cls = `admin-input ${mono ? 'font-mono text-[0.85rem]' : ''}`
  return area
    ? <textarea id={id} rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} className={cls} {...rest} />
    : <input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} className={cls} {...rest} />
}

// Which language the bilingual fields are showing. Provided by the form.
export const LangContext = createContext({ lang: 'en', setLang: () => {} })
const LANGS = [['en', 'English'], ['ar', 'عربي']]
const NAME = { en: 'English', ar: 'Arabic' }
const filled = (x) => (Array.isArray(x) ? x.length > 0 : Boolean(x && String(x).trim()))

// The English / Arabic pill. Every bilingual field in the form follows it.
export function LangSwitch({ className = '' }) {
  const { lang, setLang } = useContext(LangContext)
  const id = useId()
  return (
    <div role="radiogroup" aria-label="Language being edited" className={`inline-flex shrink-0 items-center rounded-full border border-line-strong bg-coal p-1 ${className}`}>
      {LANGS.map(([code, label]) => {
        const on = lang === code
        return (
          <button key={code} type="button" role="radio" aria-checked={on} lang={code} onClick={() => setLang(code)} className={`relative rounded-full px-3.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? 'text-ink' : 'text-mute hover:text-bone'}`}>
            {on && <motion.span layoutId={`lang-${id}`} className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
            <span className="relative">{label}</span>
          </button>
        )
      })}
      <Languages size={14} className="mx-2 text-mute" aria-hidden="true" />
    </div>
  )
}

// Legend for a bilingual field: its label, the language on show, and a nudge when the other one is empty.
function LocLegend({ field, other, otherEmpty }) {
  const { lang, setLang } = useContext(LangContext)
  return (
    <legend className="mb-1.5 flex w-full items-center gap-2 text-[0.8rem] font-medium text-bone/90">
      <span>{field.label}{field.required && <span className="ms-1 text-accent" aria-hidden="true">*</span>}</span>
      <span className="font-mono text-[0.6rem] uppercase tracking-widest text-faint">{lang}</span>
      {otherEmpty && <button type="button" onClick={() => setLang(other)} className="ms-auto font-mono text-[0.6rem] uppercase tracking-widest text-syn-orange hover:underline">{NAME[other]} empty</button>}
    </legend>
  )
}

// English and Arabic share one input; the switch picks which is shown.
function LocField({ field, value, onChange, errors, path }) {
  const id = useId()
  const { lang } = useContext(LangContext)
  const other = lang === 'en' ? 'ar' : 'en'
  const v = value ?? { en: '', ar: '' }
  const otherError = errors?.[`${path}.${other}`]
  return (
    <fieldset className="min-w-0">
      <LocLegend field={field} other={other} otherEmpty={filled(v[lang]) && !filled(v[other])} />
      <div key={lang} className="admin-swap">
        <Input
          id={`${id}-${lang}`}
          aria-label={`${field.label} (${NAME[lang]})`}
          area={field.area}
          rows={field.rows}
          value={v[lang]}
          onChange={(x) => onChange({ ...v, [lang]: x })}
          invalid={Boolean(errors?.[`${path}.${lang}`])}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          lang={lang}
        />
      </div>
      <Problem>{errors?.[`${path}.${lang}`]}</Problem>
      <Problem>{otherError && `${NAME[other]}: ${otherError}`}</Problem>
      <Hint>{field.hint}</Hint>
    </fieldset>
  )
}

const toLines = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean)

// Lists are edited as one item per line; the raw text is kept locally so blank lines survive typing.
function LinesInput({ id, value, onChange, dir, rows = 4, label }) {
  const [raw, setRaw] = useState(() => (value ?? []).join('\n'))
  return <textarea id={id} rows={rows} dir={dir} aria-label={label} className="admin-input" value={raw} onChange={(e) => { setRaw(e.target.value); onChange(toLines(e.target.value)) }} />
}

function LocListField({ field, value, onChange }) {
  const id = useId()
  const { lang } = useContext(LangContext)
  const other = lang === 'en' ? 'ar' : 'en'
  const v = value ?? { en: [], ar: [] }
  return (
    <fieldset className="min-w-0">
      <LocLegend field={field} other={other} otherEmpty={filled(v[lang]) && !filled(v[other])} />
      <div key={lang} className="admin-swap">
        <LinesInput id={`${id}-${lang}`} label={`${field.label} (${NAME[lang]})`} value={v[lang]} onChange={(x) => onChange({ ...v, [lang]: x })} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
      </div>
      <Hint>{field.hint}</Hint>
    </fieldset>
  )
}

function TagsField({ field, value, onChange }) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const tags = value ?? []
  const add = (text) => {
    const next = text.split(',').map((s) => s.trim()).filter(Boolean).filter((t) => !tags.includes(t))
    if (next.length) onChange([...tags, ...next])
    setDraft('')
  }
  return (
    <div>
      <Label htmlFor={id}>{field.label}</Label>
      <div className="admin-input flex flex-wrap items-center gap-1.5 !p-1.5 focus-within:border-accent">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-md border border-line-strong bg-ash px-2 py-1 font-mono text-xs">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-mute hover:text-danger"><X size={12} /></button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft) }
            else if (e.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1))
          }}
          onBlur={() => draft && add(draft)}
          placeholder={tags.length ? '' : 'Type and press Enter'}
          className="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-faint"
        />
      </div>
      <Hint>Press Enter or comma to add.</Hint>
    </div>
  )
}

// Upload button shared by single-image and gallery fields.
function UploadButton({ onUploaded, multiple, children }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pick = async (e) => {
    const files = [...e.target.files]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setError('')
    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)
        const { url } = await api('upload', { method: 'POST', form })
        onUploaded(url)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/gif" multiple={multiple} hidden onChange={pick} />
      <button type="button" disabled={busy} onClick={() => input.current.click()} className="admin-btn">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
        {busy ? 'Uploading…' : children}
      </button>
      {error && <p role="alert" className="basis-full text-xs text-danger">{error}</p>}
    </>
  )
}

function ImageField({ field, value, onChange, error }) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} required={field.required}>{field.label}</Label>
      <div className="flex gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-coal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus size={18} className="text-faint" />}
        </div>
        <div className="min-w-0 flex-1">
          <Input id={id} value={value} onChange={onChange} invalid={Boolean(error)} placeholder="https://… or upload" mono />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <UploadButton onUploaded={onChange}>Upload image</UploadButton>
            {value && <button type="button" onClick={() => onChange('')} className="admin-btn">Clear</button>}
          </div>
        </div>
      </div>
      <Problem>{error}</Problem>
      <Hint>{field.hint}</Hint>
    </div>
  )
}

const move = (list, i, by) => {
  const next = [...list]
  const [item] = next.splice(i, 1)
  next.splice(i + by, 0, item)
  return next
}

function GalleryField({ field, value, onChange, error }) {
  const images = value ?? []
  const latest = useRef(images)
  latest.current = images
  return (
    <div>
      <p className="mb-1.5 text-[0.8rem] font-medium text-bone/90">{field.label}</p>
      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {images.map((src, i) => (
            <li key={src + i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-coal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/85 p-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <span className="flex">
                  <button type="button" disabled={i === 0} onClick={() => onChange(move(images, i, -1))} aria-label="Move earlier" className="admin-icon"><ArrowUp size={13} className="-rotate-90" /></button>
                  <button type="button" disabled={i === images.length - 1} onClick={() => onChange(move(images, i, 1))} aria-label="Move later" className="admin-icon"><ArrowDown size={13} className="-rotate-90" /></button>
                </span>
                <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label="Remove image" className="admin-icon hover:text-danger"><Trash2 size={13} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <UploadButton multiple onUploaded={(url) => { latest.current = [...latest.current, url]; onChange(latest.current) }}>Add images</UploadButton>
      </div>
      <Problem>{error}</Problem>
    </div>
  )
}

function BoolField({ field, value, onChange }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={Boolean(value)}
        onClick={() => onChange(!value)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors ${value ? 'border-accent bg-accent/25' : 'border-line-strong bg-coal'}`}
      >
        <span className={`absolute top-0.5 size-3.5 rounded-full transition-[left,background-color] ${value ? 'left-[18px] bg-accent' : 'left-0.5 bg-mute'}`} />
      </button>
      <div>
        <label htmlFor={id} className="cursor-pointer text-sm text-bone">{field.label}</label>
        {field.hint && <p className="text-xs text-mute">{field.hint}</p>}
      </div>
    </div>
  )
}

const chipClass = (on) => `flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${on ? 'border-accent bg-accent/15 text-accent' : 'border-line text-mute hover:border-line-strong hover:text-bone'}`

// Stack filters for a project. The list itself lives in the Filters collection, so adding or
// removing one here changes it for every project and for the site.
function FiltersField({ field, value, onChange }) {
  const picked = value ?? []
  const addId = useId()
  const [list, setList] = useState(null) // [{ _id, key, label }]
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState('') // 'add' or the id being removed
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    api('filters?limit=200').then((d) => { if (alive) setList(d.items) }).catch((err) => { if (alive) { setList([]); setError(err.message) } })
    return () => { alive = false }
  }, [])

  const add = async () => {
    const label = draft.trim()
    const key = filterKey(label)
    if (!key || busy) return
    setError('')
    const existing = list?.find((f) => f.key === key)
    if (existing) { // already in the list: just tick it
      setDraft('')
      if (!picked.includes(key)) onChange([...picked, key])
      return
    }
    setBusy('add')
    try {
      const { item } = await api('filters', { method: 'POST', body: { label } })
      setList((l) => [...(l ?? []), item])
      onChange([...picked, item.key])
      setDraft('')
    } catch (err) { setError(err.message) } finally { setBusy('') }
  }

  const remove = async (f) => {
    if (busy || !window.confirm(`Remove the filter "${f.label}" from the site? It is also taken off every project that uses it.`)) return
    setError('')
    setBusy(f._id)
    try {
      await api(`filters/${f._id}`, { method: 'DELETE' })
      setList((l) => l.filter((x) => x._id !== f._id))
      if (picked.includes(f.key)) onChange(picked.filter((k) => k !== f.key))
    } catch (err) { setError(err.message) } finally { setBusy('') }
  }

  return (
    <fieldset aria-busy={!list || Boolean(busy)}>
      <legend className="mb-1.5 text-[0.8rem] font-medium text-bone/90">{field.label}</legend>
      <div className="flex flex-wrap gap-2">
        {!list && [16, 14, 20, 12, 16].map((w, i) => <span key={i} aria-hidden="true" className="admin-skeleton block h-[30px] !rounded-full" style={{ width: `${w * 4}px` }} />)}
        {list?.map((f) => {
          const on = picked.includes(f.key)
          const removing = busy === f._id
          return (
            <span key={f._id} className={`group/chip relative flex items-center transition-opacity ${removing ? 'opacity-50' : ''}`}>
              <label title={f.key} className={`${chipClass(on)} pe-7`}>
                <input type="checkbox" checked={on} disabled={removing} onChange={() => onChange(on ? picked.filter((x) => x !== f.key) : [...picked, f.key])} className="sr-only" />
                {f.label}
              </label>
              <button type="button" onClick={() => remove(f)} disabled={Boolean(busy)} aria-label={`Remove the filter ${f.label}`} title="Remove this filter everywhere" className="absolute end-1.5 grid size-4 place-items-center rounded-full text-faint transition-colors hover:bg-danger/20 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed">
                {removing ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
              </button>
            </span>
          )
        })}
        {list && (
          <span className="flex items-center rounded-full border border-dashed border-line-strong ps-3 font-mono text-xs focus-within:border-accent">
            <label htmlFor={addId} className="sr-only">Add a filter</label>
            <input id={addId} value={draft} disabled={busy === 'add'} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} placeholder="add filter" maxLength={30} className="w-24 bg-transparent py-1.5 outline-none placeholder:text-faint" />
            <button type="button" onClick={add} disabled={!filterKey(draft) || Boolean(busy)} aria-label="Add filter" className="admin-icon !rounded-full">
              {busy === 'add' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            </button>
          </span>
        )}
      </div>
      <Problem>{error}</Problem>
      <Hint>{field.hint}</Hint>
    </fieldset>
  )
}

function ChecksField({ field, value, onChange }) {
  const picked = value ?? []
  const options = [...new Set([...field.options, ...picked])]
  return (
    <fieldset>
      <legend className="mb-1.5 text-[0.8rem] font-medium text-bone/90">{field.label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = picked.includes(o)
          return (
            <label key={o} className={chipClass(on)}>
              <input type="checkbox" checked={on} onChange={() => onChange(on ? picked.filter((x) => x !== o) : [...picked, o])} className="sr-only" />
              {o}
            </label>
          )
        })}
      </div>
      <Hint>{field.hint}</Hint>
    </fieldset>
  )
}

function Repeater({ field, value, onChange, errors, path }) {
  const rows = value ?? []
  return (
    <div>
      <ul className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="rounded-xl border border-line bg-coal/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[0.65rem] uppercase tracking-widest text-faint">{field.label} {i + 1}</span>
              <span className="flex">
                <button type="button" disabled={i === 0} onClick={() => onChange(move(rows, i, -1))} aria-label="Move up" className="admin-icon"><ArrowUp size={14} /></button>
                <button type="button" disabled={i === rows.length - 1} onClick={() => onChange(move(rows, i, 1))} aria-label="Move down" className="admin-icon"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove" className="admin-icon hover:text-danger"><Trash2 size={14} /></button>
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {field.fields.map((f) => (
                <div key={f.name} className={f.half ? '' : 'md:col-span-2'}>
                  <Field field={f} value={row[f.name]} onChange={(x) => onChange(rows.map((r, j) => (j === i ? { ...r, [f.name]: x } : r)))} errors={errors} path={`${path}.${i}.${f.name}`} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onChange([...rows, structuredClone(field.blank)])} className="admin-btn mt-3"><Plus size={14} />{field.add}</button>
    </div>
  )
}

function SimpleField({ field, value, onChange, error }) {
  const id = useId()
  let control
  if (field.type === 'select') {
    control = (
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="admin-input capitalize">
        {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  } else if (field.type === 'lines') {
    control = <LinesInput id={id} value={value} onChange={onChange} rows={3} />
  } else {
    const type = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
    const shown = field.type === 'date' && value ? String(value).slice(0, 10) : value
    control = <Input id={id} type={type} value={shown ?? ''} onChange={onChange} invalid={Boolean(error)} min={field.min} max={field.max} placeholder={field.placeholder} mono={field.mono} />
  }
  return (
    <div>
      <Label htmlFor={id} required={field.required}>{field.label}</Label>
      {control}
      <Problem>{error}</Problem>
      <Hint>{field.hint}</Hint>
    </div>
  )
}

export function Field({ field, value, onChange, errors, path }) {
  const error = errorFor(errors, path)
  switch (field.type) {
    case 'loc': return <LocField field={field} value={value} onChange={onChange} errors={errors} path={path} />
    case 'locList': return <LocListField field={field} value={value} onChange={onChange} />
    case 'tags': return <TagsField field={field} value={value} onChange={onChange} />
    case 'image': return <ImageField field={field} value={value} onChange={onChange} error={error} />
    case 'gallery': return <GalleryField field={field} value={value} onChange={onChange} error={error} />
    case 'checks': return <ChecksField field={field} value={value} onChange={onChange} />
    case 'filters': return <FiltersField field={field} value={value} onChange={onChange} />
    case 'bool': return <BoolField field={field} value={value} onChange={onChange} />
    case 'repeater': return <Repeater field={field} value={value} onChange={onChange} errors={errors} path={path} />
    default: return <SimpleField field={field} value={value} onChange={onChange} error={error} />
  }
}
