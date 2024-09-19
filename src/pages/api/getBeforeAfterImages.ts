import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const imageDir = path.join(process.cwd(), 'public', 'images', 'landing-page', 'before-after-images')
    const files = await fs.readdir(imageDir)
    
    const imagePairs = files.reduce((acc, file) => {
      if (file.startsWith('before-')) {
        const afterFile = `after-${file.slice(7)}`
        if (files.includes(afterFile)) {
          acc.push({
            before: `/images/landing-page/before-after-images/${file}`,
            after: `/images/landing-page/before-after-images/${afterFile}`
          })
        }
      }
      return acc
    }, [] as { before: string; after: string }[])

    res.status(200).json({ imagePairs })
  } catch (error) {
    console.error('Error loading before/after images:', error)
    res.status(500).json({ error: 'Failed to load images' })
  }
}