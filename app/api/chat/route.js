import { z } from 'zod'
import { handle, json, readJson, ApiError } from '@/lib/http'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { askAssistant, parseModels } from '@/lib/chat'

export const runtime = 'nodejs'
export const maxDuration = 60

const turn = z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(3000) })
const body = z.object({ chatInput: z.string().trim().min(1).max(1000), history: z.array(turn).max(12).default([]) })

export const POST = handle(async (req) => {
  if (!rateLimit(`chat:${clientIp(req)}`, { limit: 20, windowMs: 60_000 })) throw new ApiError(429, 'Too many messages, please slow down.')
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new ApiError(503, 'Chat is not configured.')
  const { chatInput, history } = body.parse(await readJson(req, 50_000))

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45_000)
  req.signal.addEventListener('abort', () => controller.abort(), { once: true })
  try {
    const result = await askAssistant({
      apiKey,
      models: parseModels(process.env.OPENROUTER_MODELS),
      input: chatInput,
      history,
      signal: controller.signal,
    })
    if (result.error) throw new ApiError(result.error === 'rate_limited' ? 429 : 502, 'The assistant is unavailable right now.')
    return json({ output: result.answer }, { headers: { 'Cache-Control': 'no-store' } })
  } finally {
    clearTimeout(timeout)
  }
})
