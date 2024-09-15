"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, AnimatePresence, useInView, useScroll } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Wand2, Maximize, Layout, Download, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import Image from 'next/image'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import { addToWaitlist } from '@/actions/waitlist-actions'
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import ShinyButton from "@/components/magicui/shiny-button"
import AnimatedCheckmark from '@/components/AnimatedCheckmark'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const emailInputRef = useRef<HTMLTextAreaElement>(null)
  const waitlistRef = useRef<HTMLDivElement>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const MAX_EMAIL_LENGTH = 40 // Set a reasonable maximum length for email addresses

  const features = [
    { icon: <Wand2 className="w-6 h-6" />, title: "AI Image Generation", description: "Create stunning visuals from text prompts using FLUX.1 model", badge: "FLUX.1" },
    { icon: <Maximize className="w-6 h-6" />, title: "Image Upscaling", description: "Enhance image quality up to 10x", badge: "2x-10x" },
    { icon: <Layout className="w-6 h-6" />, title: "Multiple Aspect Ratios", description: "Support for various dimensions", badge: "Flexible" },
    { icon: <Download className="w-6 h-6" />, title: "High-Quality Outputs", description: "Generate WebP, JPG, or PNG formats", badge: "HD" },
  ]

  const faqs = [
    {
      question: "What's included in the free tier?",
      answer: "Our free tier offers 20 image upscales and 20 image generations per day. Each feature has its own counter, giving you plenty of room to experiment with both capabilities."
    },
    {
      question: "Which AI model is used for image generation?",
      answer: "We use the cutting-edge FLUX.1 model for image generation, known for its exceptional quality and versatility in creating stunning visuals from text prompts."
    },
    {
      question: "How does image upscaling work?",
      answer: "Our AI-powered upscaling technology enhances the resolution and quality of your images, making them sharper and more detailed without losing the original essence. We offer multiple upscale options: 2x, 4x, 6x, 8x, and 10x."
    },
    {
      question: "Can I use the generated images commercially?",
      answer: "Yes, all images generated using our platform are free for commercial use."
    }
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
      setIsSuccess(true);
      toast({
        title: "Welcome aboard!",
        description: result.message,
        duration: 5000,
      });
      setEmail('');
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } else {
      setFormError(result.message);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const scrollToWaitlist = () => {
    waitlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
            <div ref={waitlistRef} className="w-full max-w-md">
              <h3 className="text-2xl font-bold mb-4 text-center">Join the Waitlist</h3>
              <p className="text-gray-300 text-center mb-6">Be the first to experience the future of AI-powered image enhancement</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input 
                    ref={emailInputRef}
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
                <ShinyButton 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
                  disabled={isSubmitting || isSuccess}
                >
                  {isSubmitting ? (
                    'Joining...'
                  ) : isSuccess ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="flex justify-center items-center"
                    >
                      <AnimatedCheckmark />
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Join Waitlist</span>
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  )}
                </ShinyButton>
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
                whileHover={{ scale: 1.05, zIndex: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-semibold text-white">{feature.title}</CardTitle>
                    <motion.div
                      className="text-purple-400"
                      animate={{ rotate: 0 }}
                      whileHover={{ rotate: 360, scale: 2 }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                    <Badge 
                      variant="secondary" 
                      className="mt-4 bg-purple-700 text-white hover:bg-purple-600 transition-colors duration-300"
                    >
                      {feature.badge}
                    </Badge>
                  </CardContent>
                </Card>
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
            className="mb-16 p-8 rounded-lg max-w-4xl mx-auto"
          >
            <h3 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-purple-700">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full text-lg font-semibold text-white"
                    >
                      {faq.question}
                    </motion.div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-gray-300 pt-2"
                    >
                      {faq.answer}
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-16"
          >
            <ShinyButton
              onClick={scrollToWaitlist}
              className="px-8 py-4 text-lg font-semibold"
              text="Join the AI Revolution"
            />
          </motion.div>

          {/* New Pricing Coming Soon component */}
          <motion.div
            variants={itemVariants}
            className="mb-16"
          >
            <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500 shadow-lg hover:shadow-purple-500/20 transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center justify-center mb-4"
                >
                  <Sparkles className="w-8 h-8 text-purple-400 mr-2" />
                  <h3 className="text-2xl font-bold text-white">Pricing Coming Soon</h3>
                </motion.div>
                <p className="text-purple-200 mb-4">Get ready for flexible plans tailored to your needs</p>
                <Badge variant="secondary" className="bg-purple-700 text-white hover:bg-purple-600 transition-colors duration-300">
                  Stay Tuned
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.footer
            variants={itemVariants}
            className="text-center py-8 text-gray-400"
          >
            © 2024 FluxScale AI. All rights reserved.
          </motion.footer>
        </main>
      </motion.div>
    </AnimatePresence>
  )
}