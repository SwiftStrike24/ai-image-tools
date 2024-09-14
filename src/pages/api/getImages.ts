import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const directory = path.join(process.cwd(), 'public', 'images', 'landing-page', 'AI-Image-Generated-carousel')
  try {
    const files = fs.readdirSync(directory)
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/.test(file))
    const imagePaths = imageFiles.map(file => `/images/landing-page/AI-Image-Generated-carousel/${file}`)
    res.status(200).json({ images: imagePaths })
  } catch (error) {
    console.error('Error reading images:', error)
    res.status(500).json({ images: [] })
  }
}
