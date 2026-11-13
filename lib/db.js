import mongoose from 'mongoose'

// Reuse one connection across hot reloads and serverless invocations.
const cached = globalThis.__p3dMongoose ?? (globalThis.__p3dMongoose = { conn: null, promise: null })

export default async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to .env.local.')
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    })
  }
  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }
  return cached.conn
}
