import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/auth'
import { AdminShell } from '@/components/admin/shell'

// The proxy already guards /admin; this second check keeps the shell from rendering without a session.
export default async function PanelLayout({ children }) {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  return <AdminShell username={String(admin.sub ?? 'admin')}>{children}</AdminShell>
}
