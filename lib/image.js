// Cloudinary images are resized and re-encoded by Cloudinary itself (fast CDN,
// no load on our server). Everything else goes through Next's optimizer.
const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//

export const isCloudinary = (src) => typeof src === 'string' && CLOUDINARY.test(src)

export function cloudinaryUrl(src, width, quality = 'auto') {
  return src.replace('/image/upload/', `/image/upload/f_auto,q_${quality},c_limit,w_${width}/`)
}

export const cloudinaryLoader = ({ src, width, quality }) => cloudinaryUrl(src, width, quality ?? 'auto')

// Same-origin URL for WebGL textures.
// next/image only serves its configured widths, so snap to the nearest allowed one.
const OPTIMIZER_WIDTHS = [640, 750, 828, 1080, 1200, 1920]

export function textureUrl(src, width = 640) {
  if (isCloudinary(src)) return cloudinaryUrl(src, width)
  const w = OPTIMIZER_WIDTHS.find((x) => x >= width) ?? OPTIMIZER_WIDTHS.at(-1)
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`
}
