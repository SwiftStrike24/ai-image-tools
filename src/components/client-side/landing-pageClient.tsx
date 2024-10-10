"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useAnimation, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ArrowRight, Wand2, Maximize, Layout, Download, Sparkles, Home, Zap, Image as ImageIcon, ArrowUpCircle, HelpCircle, CreditCard, SplitSquareVertical } from 'lucide-react'
import Image from 'next/image'
import { useToast } from "@/hooks/use-toast"
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from "@clerk/nextjs"

// UI Components
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { Dock, DockIcon } from "@/components/ui/dock"

// Custom Components
import { addToWaitlist } from '@/actions/waitlist-actions'
import Link from 'next/link'

// Dynamically imported components
const BeforeAfterSlider = dynamic(() => import('@/components/BeforeAfterSlider'), { ssr: false })
const ImageCarousel = dynamic(() => import('@/components/ImageCarousel'), { ssr: false })
const AnimatedGradientText = dynamic(() => import('@/components/magicui/animated-gradient-text'), { ssr: false })
const BlurFade = dynamic(() => import('@/components/magicui/blur-fade'), { ssr: false })
const ShimmerButton = dynamic(() => import('@/components/magicui/shimmer-button'), { ssr: false })
const GridPattern = dynamic(() => import('@/components/magicui/animated-grid-pattern'), { ssr: false })
const HyperText = dynamic(() => import('@/components/magicui/hyper-text'), { ssr: false })

// Constants
const MAX_EMAIL_LENGTH = 40
const IMAGE_GEN_VIDEO_URL = "/videos/landingPage-HowTo/Howto-ImageGen.webm"
const UPSCALE_VIDEO_URL = "/videos/landingPage-HowTo/Howto-Upscale.webm"

// Types
interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface DockItem {
  icon: React.ElementType | 'separator';
  label: string;
  onClick?: () => void;
  isSpecial?: boolean;
}

interface BeforeAfterImage {
  before: string;
  after: string;
}

// Component
export default function LandingPage() {
  // State
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [beforeAfterImages, setBeforeAfterImages] = useState<BeforeAfterImage[]>([])

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLTextAreaElement>(null)
  const waitlistRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const beforeAfterRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const upscalingRef = useRef<HTMLDivElement>(null)

  // Hooks
  const { toast } = useToast()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const controls = useAnimation()
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  const { scrollY } = useScroll()

  // Animations
  const featuresOpacity = useTransform(scrollY, [0, 300], [0, 1])
  const featuresY = useTransform(scrollY, [0, 300], [100, 0])
  const howItWorksOpacity = useTransform(scrollY, [300, 600], [0, 1])
  const howItWorksY = useTransform(scrollY, [300, 600], [100, 0])
  const beforeAfterOpacity = useTransform(scrollY, [600, 900], [0, 1])
  const beforeAfterY = useTransform(scrollY, [600, 900], [100, 0])
  const upscalingOpacity = useTransform(scrollY, [900, 1200], [0, 1])
  const upscalingY = useTransform(scrollY, [900, 1200], [100, 0])
  const faqOpacity = useTransform(scrollY, [1200, 1500], [0, 1])
  const faqY = useTransform(scrollY, [1200, 1500], [100, 0])

  const [imageGenVideoRef, imageGenVideoInView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  })

  const [upscaleVideoRef, upscaleVideoInView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  })

  // Data
  const features: Feature[] = [
    { icon: Wand2, title: "AI Image Generation", description: "Create stunning visuals from text prompts using FLUX.1 model", badge: "FLUX.1" },
    { icon: Maximize, title: "AI Image Upscaling", description: "Enhance image quality up to 10x with Real-ESRGAN", badge: "Real-ESRGAN" },
    { icon: Layout, title: "Multiple Aspect Ratios", description: "Support for various dimensions", badge: "16:9 • 1:1 • 9:16 • more" },
    { icon: SplitSquareVertical, title: "Face Enhancement", description: "Run GFPGAN to improve facial details during upscaling", badge: "GFPGAN" },
    { icon: Sparkles, title: "Prompt Enhancement", description: "Boost prompts with Meta-Llama 3 (8B) or GPT-4o-mini during generation", badge: "AI-Powered" },
    { icon: Download, title: "High-Quality Outputs", description: "Generate WebP, JPG, or PNG formats", badge: "HD" },
  ]

  const faqs: FAQ[] = [
    {
      question: "What's included in the free tier?",
      answer: "10 image upscales, 10 image generations, and 10 prompt enhancements per day during generation. Choose your LLM for prompt enhancement."
    },
    {
      question: "Which AI models do you use?",
      answer: "We use FLUX.1 for stunning image generation and Real-ESRGAN to upscale images for sharp, high-quality results."
    },
    {
      question: "How does image upscaling work?",
      answer: "Real-ESRGAN boosts image resolution by 2x, 4x, 6x, 8x, or 10x, improving both clarity and detail."
    },
    {
      question: "What's special about Real-ESRGAN?",
      answer: "It restores lost details, removes artifacts, and produces natural-looking results."
    },
    {
      question: "How does GFPGAN face enhancement work?",
      answer: "GFPGAN refines facial features like eyes, nose, and mouth for sharp, lifelike portraits during upscaling."
    },
    {
      question: "Can I use the images commercially?",
      answer: "Yes, all generated and upscaled images are free for commercial use."
    },
    {
      question: "How does Prompt Enhancement work?",
      answer: "AI-powered prompt enhancement using models like Meta-Llama 3 (8B) or GPT-4o-mini refines prompts for more detailed and creative outputs."
    }
  ]

  const dockItems: DockItem[] = [
    { icon: Home, label: "Home", onClick: () => window.scrollTo({top: 0, behavior: 'smooth'}) },
    { icon: Zap, label: "Features", onClick: () => scrollToSection(featuresRef) },
    { icon: ImageIcon, label: "Generating", onClick: () => scrollToSection(howItWorksRef) },
    { icon: SplitSquareVertical, label: "Before & After", onClick: () => scrollToSection(beforeAfterRef) },
    { icon: ArrowUpCircle, label: "Upscaling", onClick: () => scrollToSection(upscalingRef) },
    { icon: HelpCircle, label: "FAQ", onClick: () => scrollToSection(faqRef) },
    { icon: 'separator', label: '' },
    { icon: CreditCard, label: "Pricing", onClick: () => router.push('/pricing') },
    { icon: Sparkles, label: "Enter App", onClick: () => handleEnterApp('/generator'), isSpecial: true },
  ]

  // Helpers
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const yOffset = -80; // Adjust this value based on your header height
      const element = ref.current;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({top: y, behavior: 'smooth'});
    }
  }

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  };

  // Event Handlers
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

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newEmail = e.target.value.slice(0, MAX_EMAIL_LENGTH)
    setEmail(newEmail)
    setFormError(null)
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent default form submission
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleEnterApp = useCallback((path: string) => {
    if (isLoaded) {
      if (isSignedIn) {
        router.push(path)
      } else {
        router.push(`/sign-in?redirect=${encodeURIComponent(path)}`)
      }
    }
  }, [isLoaded, isSignedIn, router])

  // Effects
  useEffect(() => {
    if (inView) {
      controls.start('visible')
    }
  }, [controls, inView])

  useEffect(() => {
    // Set up the before and after image pairs
    const imagePairs = [
      { before: '/images/landing-page/before-after-images/before-image5.webp', after: '/images/landing-page/before-after-images/after-image5.jpg' },
      { before: '/images/landing-page/before-after-images/before-image2.webp', after: '/images/landing-page/before-after-images/after-image2.jpg' },
      { before: '/images/landing-page/before-after-images/before-image.jpg', after: '/images/landing-page/before-after-images/after-image.jpg' },
      { before: '/images/landing-page/before-after-images/before-image3.webp', after: '/images/landing-page/before-after-images/after-image3.jpg' },
      { before: '/images/landing-page/before-after-images/before-image4.webp', after: '/images/landing-page/before-after-images/after-image4.jpg' },
      { before: '/images/landing-page/before-after-images/before-image6.webp', after: '/images/landing-page/before-after-images/after-image6.jpg' },
      { before: '/images/landing-page/before-after-images/before-image7.webp', after: '/images/landing-page/before-after-images/after-image7.jpg' },
    ]

    setBeforeAfterImages(imagePairs)

    // Preload images
    Promise.all(imagePairs.flatMap(pair => [preloadImage(pair.before), preloadImage(pair.after)]))
      .catch(error => console.error('Failed to preload images:', error))
  }, [])

  useEffect(() => {
    // Delay scrolling to top
    setTimeout(() => {
      window.scrollTo(0, 0)
    }, 500);

    // Optional: Disable scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const imageGenVideo = document.getElementById('imageGenVideo') as HTMLVideoElement
    const upscaleVideo = document.getElementById('upscaleVideo') as HTMLVideoElement

    if (imageGenVideoInView && imageGenVideo) {
      imageGenVideo.play()
    } else if (imageGenVideo) {
      imageGenVideo.pause()
      imageGenVideo.currentTime = 0
    }

    if (upscaleVideoInView && upscaleVideo) {
      upscaleVideo.play()
    } else if (upscaleVideo) {
      upscaleVideo.pause()
      upscaleVideo.currentTime = 0
    }
  }, [imageGenVideoInView, upscaleVideoInView])

  // Animation Variants
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

  // Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "FluxScale AI",
    "description": "Advanced AI-powered image upscaling and generation tools",
    "operatingSystem": "Web",
    "applicationCategory": "Multimedia",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "SwiftStrike24"
    },
    "url": "https://fluxscaleai.com"
  }

  // Render
  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden"
        ref={containerRef}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Head>
          <link rel="preload" href={IMAGE_GEN_VIDEO_URL} as="video" type="video/webm" />
          <link rel="preload" href="/images/landing-page/before-after-images/before-image.jpg" as="image" />
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        </Head>
        <GridPattern
          width={60}
          height={60}
          x={-1}
          y={-1}
          strokeDasharray={0}
          numSquares={100}
          className="absolute inset-0 z-0 opacity-50"
          maxOpacity={0.3}
          duration={8}
          repeatDelay={0}
        />
        
        <div className="relative z-20">
          <motion.nav
            className="p-4 flex justify-between items-center fixed w-full bg-black bg-opacity-50 backdrop-blur-md z-50"
            variants={itemVariants}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <HyperText
                text="FluxScale AI"
                className="text-2xl font-bold text-purple-500"
                duration={2000}
              />
            </motion.div>
          </motion.nav>
          
          <main className="container mx-auto px-4 py-16 pt-24">
            <BlurFade>
              <div className="flex justify-center items-center">
                <AnimatedGradientText className="text-4xl md:text-6xl font-bold mb-4 text-center">
                  <div className="flex items-center justify-center">
                    <span className="text-white">Supercharge Your Visuals with AI</span>
                  </div>
                </AnimatedGradientText>
              </div>
            </BlurFade>
            <motion.div 
              className="text-center"
              variants={itemVariants}
            >
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
                <h3 className="text-2xl font-bold mb-4 text-center">Experience AI-Powered Image Generation</h3>
                <ShimmerButton 
                  onClick={() => handleEnterApp('/generator')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
                  shimmerColor="#8B5CF6"
                  shimmerSize="0.1em"
                  shimmerDuration="2s"
                >
                  <div className="flex items-center justify-center text-white">
                    <span>Enter App</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </ShimmerButton>
              </div>
            </motion.div>

            <FeaturesSection 
              features={features} 
              featuresRef={featuresRef} 
              featuresOpacity={featuresOpacity} 
              featuresY={featuresY} 
              itemVariants={itemVariants}
            />

            <HowItWorksSection 
              howItWorksRef={howItWorksRef} 
              howItWorksOpacity={howItWorksOpacity} 
              howItWorksY={howItWorksY} 
              itemVariants={itemVariants}
              imageGenVideoRef={imageGenVideoRef}
              handleEnterApp={handleEnterApp}
            />

            <BeforeAfterSection 
              beforeAfterRef={beforeAfterRef} 
              beforeAfterOpacity={beforeAfterOpacity} 
              beforeAfterY={beforeAfterY} 
              beforeAfterImages={beforeAfterImages}
            />

            <UpscalingSection 
              upscalingRef={upscalingRef} 
              upscalingOpacity={upscalingOpacity} 
              upscalingY={upscalingY} 
              itemVariants={itemVariants}
              upscaleVideoRef={upscaleVideoRef}
              handleEnterApp={handleEnterApp}
            />

            <FAQSection 
              faqRef={faqRef} 
              faqOpacity={faqOpacity} 
              faqY={faqY} 
              faqs={faqs}
            />

            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-16"
            >
              <ShimmerButton
                onClick={() => handleEnterApp('/generator')}
                className="px-8 py-4 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded"
                shimmerColor="#8B5CF6"
                shimmerSize="0.1em"
                shimmerDuration="2s"
              >
                <span className="text-white">Enter App</span>
              </ShimmerButton>
            </motion.div>

            <motion.footer
              variants={itemVariants}
              className="text-center py-8 text-gray-400"
            >
              © 2024 FluxScale AI. All rights reserved.
            </motion.footer>
          </main>
        </div>
        <Dock>
          {dockItems.map((item, index) => (
            item.icon === 'separator' ? (
              <div key={index} className="w-px h-8 bg-gray-600 mx-2" />
            ) : (
              <DockIcon 
                key={index} 
                onClick={item.onClick} 
                label={item.label}
                className={item.isSpecial ? 'relative' : ''}
              >
                {item.isSpecial ? (
                  <>
                    <div className="absolute inset-0 bg-purple-500 rounded-full animate-pulse opacity-50" />
                    <item.icon className="w-8 h-8 text-white relative z-10" />
                  </>
                ) : (
                  <item.icon className="w-8 h-8 text-white" />
                )}
              </DockIcon>
            )
          ))}
        </Dock>
      </motion.div>
    </AnimatePresence>
  )
}

// Extracted Components
const FeaturesSection: React.FC<{
  features: Feature[];
  featuresRef: React.RefObject<HTMLDivElement>;
  featuresOpacity: any;
  featuresY: any;
  itemVariants: any;
}> = ({ features, featuresRef, featuresOpacity, featuresY, itemVariants }) => (
  <motion.section
    ref={featuresRef}
    style={{ opacity: featuresOpacity, y: featuresY }}
    className="py-20"
  >
    <div className="container mx-auto px-4">
      <motion.h3 variants={itemVariants} className="text-3xl font-bold mb-10 text-center">
        Features
      </motion.h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 mt-24">
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
                  className="text-purple-400 relative w-8 h-8"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <feature.icon />
                  </motion.div>
                </motion.div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{feature.description}</p>
                <Badge 
                  variant="secondary" 
                  className="mt-4 bg-gradient-to-r from-purple-700 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-500 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {feature.badge}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.section>
)

const HowItWorksSection: React.FC<{
  howItWorksRef: React.RefObject<HTMLDivElement>;
  howItWorksOpacity: any;
  howItWorksY: any;
  itemVariants: any;
  imageGenVideoRef: (node?: Element | null | undefined) => void;
  handleEnterApp: (path: string) => void;
}> = ({ howItWorksRef, howItWorksOpacity, howItWorksY, itemVariants, imageGenVideoRef, handleEnterApp }) => (
  <motion.section
    ref={howItWorksRef}
    style={{ opacity: howItWorksOpacity, y: howItWorksY }}
    className="py-20"
  >
    <div className="container mx-auto px-4">
      <motion.h3 variants={itemVariants} className="text-3xl font-bold mb-10 text-center">
        How AI Image Generation Works
      </motion.h3>
      <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
        <motion.div 
          ref={imageGenVideoRef}
          variants={itemVariants} 
          className="w-full md:w-1/2 relative aspect-video"
        >
          <video
            id="imageGenVideo"
            src={IMAGE_GEN_VIDEO_URL}
            loop
            muted
            playsInline
            className="rounded-lg w-full h-full object-cover"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="w-full md:w-1/2 space-y-4">
          <h4 className="text-2xl font-semibold">Create AI-Powered Images in 4 Steps</h4>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter your creative text prompt</li>
            <li>Choose image settings (aspect ratio, number of images)</li>
            <li>Optionally enhance your prompt with AI</li>
            <li>Generate and download your AI masterpiece</li>
          </ol>
          <p className="text-sm text-gray-300 mt-4">
            Powered by FLUX.1, advanced AI model that transforms your ideas into stunning visuals.
          </p>
          <ShimmerButton 
            onClick={() => handleEnterApp('/generator')}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            <span className="text-white">Try Image Generator Now</span>
          </ShimmerButton>
        </motion.div>
      </div>
    </div>
  </motion.section>
)

const BeforeAfterSection: React.FC<{
  beforeAfterRef: React.RefObject<HTMLDivElement>;
  beforeAfterOpacity: any;
  beforeAfterY: any;
  beforeAfterImages: BeforeAfterImage[];
}> = ({ beforeAfterRef, beforeAfterOpacity, beforeAfterY, beforeAfterImages }) => (
  <motion.div
    ref={beforeAfterRef}
    style={{ opacity: beforeAfterOpacity, y: beforeAfterY }}
    className="mb-16 p-8 rounded-lg max-w-5xl mx-auto"
  >
    <h3 className="text-2xl font-bold mb-4 text-center">See the Difference</h3>
    <p className="text-gray-300 text-center mb-6">Experience the power of AI-enhanced images</p>
    <Carousel 
      className="w-full max-w-3xl mx-auto" 
      opts={{ 
        loop: true,
      }}
    >
      <CarouselContent>
        {beforeAfterImages.map((pair, index) => (
          <CarouselItem key={index}>
            <Card>
              <CardContent className="p-0">
                <BeforeAfterSlider
                  beforeImage={pair.before}
                  afterImage={pair.after}
                  beforeAlt={`Before image ${index + 1}`}
                  afterAlt={`After image ${index + 1}`}
                />
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="bg-purple-600 hover:bg-purple-700 text-white" />
      <CarouselNext className="bg-purple-600 hover:bg-purple-700 text-white" />
    </Carousel>
  </motion.div>
)

const UpscalingSection: React.FC<{
  upscalingRef: React.RefObject<HTMLDivElement>;
  upscalingOpacity: any;
  upscalingY: any;
  itemVariants: any;
  upscaleVideoRef: (node?: Element | null | undefined) => void;
  handleEnterApp: (path: string) => void;
}> = ({ upscalingRef, upscalingOpacity, upscalingY, itemVariants, upscaleVideoRef, handleEnterApp }) => (
  <motion.section
    ref={upscalingRef}
    style={{ opacity: upscalingOpacity, y: upscalingY }}
    className="py-20"
  >
    <div className="container mx-auto px-4">
      <motion.h3 variants={itemVariants} className="text-3xl font-bold mb-10 text-center">
        How AI Image Upscaling Works
      </motion.h3>
      <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
        <motion.div 
          ref={upscaleVideoRef}
          variants={itemVariants} 
          className="w-full md:w-1/2 relative aspect-video"
        >
          <video
            id="upscaleVideo"
            src={UPSCALE_VIDEO_URL}
            loop
            muted
            playsInline
            className="rounded-lg w-full h-full object-cover"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="w-full md:w-1/2 space-y-4">
          <h4 className="text-2xl font-semibold">Enhance Your Images in 4 Steps</h4>
          <ol className="list-decimal list-inside space-y-2">
            <li>Upload your image</li>
            <li>Choose upscaling settings (2x, 4x, 6x, 8x, or 10x)</li>
            <li>Apply optional face enhancement with GFPGAN</li>
            <li>Download your high-resolution masterpiece</li>
          </ol>
          <p className="text-sm text-gray-300 mt-4">
            Powered by Real-ESRGAN, an advanced AI model that enhances image quality and resolution.
          </p>
          <ShimmerButton 
            onClick={() => handleEnterApp('/upscaler')}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            <span className="text-white">Try Image Upscaler Now</span>
          </ShimmerButton>
        </motion.div>
      </div>
    </div>
  </motion.section>
)

const FAQSection: React.FC<{
  faqRef: React.RefObject<HTMLDivElement>;
  faqOpacity: any;
  faqY: any;
  faqs: FAQ[];
}> = ({ faqRef, faqOpacity, faqY, faqs }) => (
  <motion.div
    ref={faqRef}
    style={{ opacity: faqOpacity, y: faqY }}
    className="mb-16 p-8 rounded-lg max-w-4xl mx-auto"
  >
    <h3 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h3>
    <Accordion type="single" collapsible className="w-full space-y-4">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`} className="border-b border-purple-700">
          <AccordionTrigger 
            className="text-left hover:no-underline"
          >
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
)