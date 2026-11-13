import { NextResponse } from 'next/server'

// Lets the chat widget hide itself instead of showing a broken button when no key is set.
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENROUTER_API_KEY) })
}
