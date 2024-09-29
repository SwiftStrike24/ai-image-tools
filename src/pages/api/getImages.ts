import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

let cachedImages: string[] | null = null
const cacheTimeout = 5 * 60 * 1000 // 5 minutes

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (cachedImages) {
    return res.status(200).json({ images: cachedImages })
  }

  const directory = path.join(process.cwd(), 'public', 'images', 'landing-page', 'AI-Image-Generated-carousel')
  try {
    const files = fs.readdirSync(directory)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/.test(file))
    cachedImages = imageFiles.map(file => `/images/landing-page/AI-Image-Generated-carousel/${file}`)
    
    // Set a timeout to clear the cache after 5 minutes
    setTimeout(() => {
      cachedImages = null
    }, cacheTimeout)

    res.status(200).json({ images: cachedImages })
  } catch (error) {
    console.error('Error reading images:', error)
    res.status(500).json({ images: [] })
  }
}
