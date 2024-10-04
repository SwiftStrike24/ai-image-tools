import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'
import Image from 'next/image'

const ImageCarousel: React.FC = () => {
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const controls = useAnimation()
  const carouselRef = useRef<HTMLDivElement>(null)

  // You can adjust this value to change the speed of the carousel
  // Lower values will make it faster, higher values will make it slower
  const CAROUSEL_DURATION_PER_IMAGE = 2 // seconds

  const shuffleArray = useCallback((array: string[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/getImages')
        const data = await res.json()
        setImages(shuffleArray(data.images))
      } catch (error) {
        console.error('Failed to fetch images:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchImages()
  }, [shuffleArray])

  useEffect(() => {
    if (!isLoading && images.length > 0 && carouselRef.current) {
      const animate = async () => {
        const carouselWidth = carouselRef.current!.scrollWidth / 2
        await controls.start({
          x: [-carouselWidth, 0],
          transition: {
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: images.length * CAROUSEL_DURATION_PER_IMAGE,
              ease: "linear",
            },
          },
        })
      }
      animate()
    }
  }, [isLoading, images, controls])

  if (isLoading || images.length === 0) return null

  // Duplicate the images array to create a seamless loop
  const extendedImages = [...images, ...images]

  return (
    <div className="w-full overflow-hidden py-8">
      <motion.div
        ref={carouselRef}
        className="flex"
        animate={controls}
        style={{ width: `${extendedImages.length * 160}px` }}
      >
        {extendedImages.map((src, index) => (
          <motion.div
            key={`${src}-${index}`}
            className="flex-shrink-0 w-40 h-40 mx-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src={src}
              alt={`AI Generated Image ${(index % images.length) + 1}`}
              width={200}
              height={200}
              className="rounded-lg object-cover w-full h-full"
              loading="lazy"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default React.memo(ImageCarousel)
