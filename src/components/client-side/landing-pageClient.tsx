"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, AnimatePresence, useInView } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Wand2, Maximize, Layout, Download } from 'lucide-react'
import Image from 'next/image'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import { addToWaitlist } from '@/actions/waitlist-actions'
import { useToast } from "@/hooks/use-toast"

const ImageCarousel = () => {
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const controls = useAnimation()
  const carouselRef = useRef<HTMLDivElement>(null)

  // You can adjust this value to change the speed of the carousel
  // Lower values will make it faster, higher values will make it slower
  const CAROUSEL_DURATION_PER_IMAGE = 2 // seconds

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
            key={index}
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
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const containerRef = useRef(null)
  const { toast } = useToast()
  const emailInputRef = useRef<HTMLInputElement>(null)

  const MAX_EMAIL_LENGTH = 40 // Set a reasonable maximum length for email addresses

  const features = [
    { icon: <Wand2 className="w-6 h-6 text-purple-400" />, title: "AI Image Generation", description: "Create stunning visuals from text prompts" },
    { icon: <Maximize className="w-6 h-6 text-purple-400" />, title: "Image Upscaling", description: "Enhance image quality up to 10x" },
    { icon: <Layout className="w-6 h-6 text-purple-400" />, title: "Multiple Aspect Ratios", description: "Support for various dimensions" },
    { icon: <Download className="w-6 h-6 text-purple-400" />, title: "High-Quality Outputs", description: "Generate WebP, JPG, or PNG formats" },
  ]

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email) {
      setFormError("Please enter an email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const result = await addToWaitlist(email);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Welcome aboard!",
        description: result.message,
        duration: 5000,
      });
      setEmail('');
    } else {
      setFormError(result.message);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.slice(0, MAX_EMAIL_LENGTH) // Limit the input length
    setEmail(newEmail)
    setFormError(null)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  const scrollToEmailInput = () => {
    emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    emailInputRef.current?.focus()
  }

  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref)

  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  const emailInputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-gray-900 text-white"
        ref={containerRef}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.nav
          className="p-4 flex justify-between items-center"
          variants={itemVariants}
        >
          <h1 className="text-2xl font-bold text-purple-500">FluxScale AI</h1>
          <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
            Sign In <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.nav>
        
        <main className="container mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Supercharge Your Visuals with AI</h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">Transform ideas into stunning images in seconds</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ImageCarousel />
          </motion.div>

          <motion.div 
            ref={ref}
            animate={controls}
            initial="hidden"
            variants={emailInputVariants}
            className="flex justify-center my-16 px-4"
          >
            <div className="w-full max-w-md">
              <h3 className="text-2xl font-bold mb-4 text-center">Join the Waitlist</h3>
              <p className="text-gray-300 text-center mb-6">Be the first to experience the future of AI-powered image enhancement</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input 
                    ref={emailInputRef}
                    type="email" 
                    placeholder="Enter your email for early access" 
                    value={email} 
                    onChange={handleEmailChange}
                    maxLength={MAX_EMAIL_LENGTH}
                    className={`w-full bg-gray-800 text-white border-purple-500 ${formError ? 'border-red-500' : ''}`}
                    required
                  />
                  {formError && (
                    <p className="text-red-400 text-sm mt-1">{formError}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {email.length}/{MAX_EMAIL_LENGTH}
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'} 
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 mt-24"
            variants={itemVariants}
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
            variants={itemVariants}
            className="mb-16 p-8 rounded-lg max-w-5xl mx-auto"
          >
            <h3 className="text-2xl font-bold mb-4 text-center">See the Difference</h3>
            <p className="text-gray-300 text-center mb-6">Experience the power of AI-enhanced images</p>
            <div className="w-full">
              <BeforeAfterSlider
                beforeImage="/images/landing-page/before-after-images/before-image.jpg"
                afterImage="/images/landing-page/before-after-images/after-image.jpg"
                beforeAlt="Image before AI enhancement"
                afterAlt="Image after AI enhancement"
              />
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="relative h-[400px] bg-purple-900 rounded-lg overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4">Experience the Magic</h3>
                <p className="text-xl mb-8">Join now and revolutionize your creative process</p>
                <Button 
                  className="bg-white text-purple-900 hover:bg-gray-200"
                  onClick={scrollToEmailInput}
                >
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </main>

        <motion.footer
          variants={itemVariants}
          className="text-center py-8 text-gray-400"
        >
          © 2024 FluxScale AI. All rights reserved.
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  )
}