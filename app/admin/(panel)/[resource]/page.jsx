import { notFound } from 'next/navigation'
import { RESOURCES } from '@/components/admin/config'
import { ResourceList } from '@/components/admin/resource-list'

export async function generateMetadata({ params }) {
  const { resource } = await params
  return { title: RESOURCES[resource]?.label ?? 'Not found' }
}

export default async function ResourcePage({ params }) {
  const { resource } = await params
  if (!Object.hasOwn(RESOURCES, resource)) notFound()
  return <ResourceList resource={resource} />
}
