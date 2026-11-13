import connectDB from '@/lib/db'
import { handle, json } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'
import Project from '@/models/Project'
import Experience from '@/models/Experience'
import Skill from '@/models/Skill'
import Playground from '@/models/Playground'
import Message from '@/models/Message'

export const dynamic = 'force-dynamic'

export const GET = handle(async () => {
  await requireAdmin()
  await connectDB()
  const [projects, published, featured, experience, skills, playground, messages, unread, latest] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ published: true }),
    Project.countDocuments({ featured: true, published: true }),
    Experience.countDocuments(),
    Skill.countDocuments(),
    Playground.countDocuments(),
    Message.countDocuments(),
    Message.countDocuments({ read: false }),
    Message.find().sort({ createdAt: -1 }).limit(5).select('name email subject read createdAt').lean(),
  ])
  return json({ projects, published, featured, experience, skills, playground, messages, unread, latest })
})
