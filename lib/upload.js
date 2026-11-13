import 'server-only'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import { ApiError } from './http'

const MAX_BYTES = 8 * 1024 * 1024
// SVG is excluded on purpose: it can carry scripts.
const TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }

const hasCloudinary = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

// Magic-byte check so a renamed file can't pretend to be an image.
function sniff(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  if (buf.subarray(4, 12).toString().startsWith('ftypavi')) return 'image/avif'
  if (buf.subarray(0, 3).toString() === 'GIF') return 'image/gif'
  return null
}

export async function storeImage(file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new ApiError(400, 'No file received.')
  if (file.size > MAX_BYTES) throw new ApiError(413, 'Images must be 8 MB or smaller.')
  const buffer = Buffer.from(await file.arrayBuffer())
  const type = sniff(buffer)
  if (!type || !TYPES[type]) throw new ApiError(415, 'Only PNG, JPG, WebP, AVIF or GIF images are allowed.')

  if (hasCloudinary()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'portfolio3d', resource_type: 'image' }, (err, res) => (err ? reject(err) : resolve(res)))
        .end(buffer)
    })
    return { url: result.secure_url, width: result.width, height: result.height, storage: 'cloudinary' }
  }

  // Local fallback for development. Hosts like Vercel have a read-only disk, so set Cloudinary keys there.
  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${TYPES[type]}`
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), buffer)
  return { url: `/uploads/${name}`, storage: 'local' }
}
