import connectDB from '@/lib/db'
import { handle, json, readJson, ApiError } from '@/lib/http'
import { contactSchema } from '@/lib/validators'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import Message from '@/models/Message'
import { mirrorMessage } from '@/lib/mirror'
import { randomUUID } from 'crypto'

export const POST = handle(async (req) => {
  if (!rateLimit(`contact:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60_000 })) {
    throw new ApiError(429, 'You have sent several messages already. Please try again later or email me directly.')
  }
  const { company, ...data } = contactSchema.parse(await readJson(req, 20_000))
  // Honeypot filled in: pretend success so bots learn nothing.
  if (company) return json({ ok: true }, { status: 201 })
  await connectDB()
  // Also copied to the classic portfolio's inbox, so either dashboard shows every message.
  await mirrorMessage('create', await Message.create({ ...data, syncId: randomUUID() }))
  return json({ ok: true }, { status: 201 })
})
