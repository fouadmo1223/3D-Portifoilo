import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/auth'
import { LoginForm } from '@/components/admin/login-form'

export const metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }) {
  if (await getAdmin()) redirect('/admin')
  const { next } = await searchParams
  return (
    <main dir="ltr" lang="en" className="grid min-h-dvh place-items-center bg-ink px-5 py-10 text-bone">
      <LoginForm next={typeof next === 'string' ? next : ''} />
    </main>
  )
}
