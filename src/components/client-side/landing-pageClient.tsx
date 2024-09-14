"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Wand2, Maximize, Layout, Download } from 'lucide-react'
import Image from 'next/image'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'

const ImageCarousel = () => {
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const controls = useAnimation()
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch('/api/getImages')
        const data = await res.json()
        setImages(data.images)
      } catch (error) {
        console.error('Failed to fetch images:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchImages()
  }, [])

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
              duration: images.length * 5,
              ease: "linear",
            },
          },
        })
      }
      animate()
    }
  }, [isLoading, images, controls])

  if (isLoading || images.length === 0) return null

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
            key={index}
            className="flex-shrink-0 w-40 h-40 mx-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src={src}
              alt={`AI Generated Image ${index + 1}`}
              width={200}
              height={200}
              className="rounded-lg object-cover w-full h-full"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const containerRef = useRef(null)

  const features = [
    { icon: <Wand2 className="w-6 h-6 text-purple-400" />, title: "AI Image Generation", description: "Create stunning visuals from text prompts" },
    { icon: <Maximize className="w-6 h-6 text-purple-400" />, title: "Image Upscaling", description: "Enhance image quality up to 10x" },
    { icon: <Layout className="w-6 h-6 text-purple-400" />, title: "Multiple Aspect Ratios", description: "Support for various dimensions" },
    { icon: <Download className="w-6 h-6 text-purple-400" />, title: "High-Quality Outputs", description: "Generate WebP, JPG, or PNG formats" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white" ref={containerRef}>
      <nav className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-purple-500">FluxScale AI</h1>
        <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
          Sign In <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </nav>
      
      <main className="container mx-auto px-4 py-16">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-4">Supercharge Your Visuals with AI</h2>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">Transform ideas into stunning images in seconds</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <ImageCarousel />
        </motion.div>

        <motion.div 
          className="flex justify-center my-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="w-full max-w-md">
            <Input 
              type="email" 
              placeholder="Enter your email for early access" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 bg-gray-800 text-white border-purple-500"
            />
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Join Waitlist <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-gray-800 p-6 rounded-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold ml-3">{feature.title}</h3>
              </div>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mb-16 p-8 rounded-lg bg-gray-800 max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold mb-4 text-center">See the Difference</h3>
          <p className="text-gray-300 text-center mb-6">Experience the power of AI-enhanced images</p>
          <div className="max-w-3xl mx-auto">
            <BeforeAfterSlider
              beforeImage="/images/landing-page/before-after-images/before-image.jpg"
              afterImage="/images/landing-page/before-after-images/after-image.jpg"
              beforeAlt="Image before AI enhancement"
              afterAlt="Image after AI enhancement"
            />
          </div>
        </motion.div>

        <motion.div 
          className="relative h-[400px] bg-purple-900 rounded-lg overflow-hidden"
          style={{ scale: 1, y: '0%', opacity: 1 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">Experience the Magic</h3>
              <p className="text-xl mb-8">Join now and revolutionize your creative process</p>
              <Button className="bg-white text-purple-900 hover:bg-gray-200">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

      </main>

      <footer className="text-center py-8 text-gray-400">
        © 2024 FluxScale AI. All rights reserved.
      </footer>
    </div>
  )
}