'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './api'
import { RESOURCES, PROFILE_GROUPS, blankFrom } from './config'
import { DocForm } from './doc-form'
import { FormSkeleton } from './skeleton'

const Loading = () => <FormSkeleton />
const Failed = ({ children }) => <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{children}</p>

// Create (id === 'new') or edit one project, role or skill.
export function ResourceEditor({ resource, id }) {
  const cfg = RESOURCES[resource]
  const router = useRouter()
  const isNew = id === 'new'
  const [doc, setDoc] = useState(isNew ? blankFrom(cfg.groups) : null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isNew) return
    let alive = true
    api(`${resource}/${id}`).then(({ item }) => { if (alive) setDoc({ ...blankFrom(cfg.groups), ...item }) }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [resource, id, isNew, cfg.groups])

  if (error) return <Failed>{error}</Failed>
  if (!doc) return <Loading />

  const save = async (data) => {
    if (isNew) {
      const { item } = await api(resource, { method: 'POST', body: data })
      router.replace(`/admin/${resource}/${item._id}`)
      return { ...blankFrom(cfg.groups), ...item }
    }
    const { item } = await api(`${resource}/${id}`, { method: 'PUT', body: data })
    return { ...blankFrom(cfg.groups), ...item }
  }
  const remove = isNew ? null : async () => {
    if (!window.confirm(`Delete "${cfg.title(doc) || 'this item'}"? This cannot be undone.`)) return
    try {
      await api(`${resource}/${id}`, { method: 'DELETE' })
      router.push(`/admin/${resource}`)
    } catch (err) { setError(err.message) }
  }

  return (
    <DocForm
      key={doc._id ?? 'new'}
      groups={cfg.groups}
      initial={doc}
      save={save}
      remove={remove}
      backHref={`/admin/${resource}`}
      heading={isNew ? `New ${cfg.singular}` : cfg.title(doc) || `Edit ${cfg.singular}`}
      saveLabel={isNew ? `Create ${cfg.singular}` : 'Save changes'}
    />
  )
}

export function ProfileEditor() {
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    api('profile').then(({ item }) => { if (alive) setDoc({ ...blankFrom(PROFILE_GROUPS), ...(item ?? {}) }) }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [])
  if (error) return <Failed>{error}</Failed>
  if (!doc) return <Loading />
  const save = async (data) => {
    const { item } = await api('profile', { method: 'PUT', body: data })
    return { ...blankFrom(PROFILE_GROUPS), ...item }
  }
  return <DocForm groups={PROFILE_GROUPS} initial={doc} save={save} heading="Profile" />
}
