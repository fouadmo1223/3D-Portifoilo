'use client'

import Image from 'next/image'
import { cloudinaryLoader, isCloudinary } from '@/lib/image'

// next/image that hands Cloudinary sources to Cloudinary's own transformer.
export function Img({ src, ...props }) {
  return <Image src={src} loader={isCloudinary(src) ? cloudinaryLoader : undefined} {...props} />
}
