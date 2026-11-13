import { notFound } from 'next/navigation'
import { RESOURCES } from '@/components/admin/config'
import { ResourceEditor } from '@/components/admin/resource-editor'

export default async function ResourceItemPage({ params }) {
  const { resource, id } = await params
  if (!Object.hasOwn(RESOURCES, resource) || !(id === 'new' || /^[a-f0-9]{24}$/.test(id))) notFound()
  return <ResourceEditor resource={resource} id={id} />
}
