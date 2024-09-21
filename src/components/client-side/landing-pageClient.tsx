"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, AnimatePresence, useInView } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { ArrowRight, Wand2, Maximize, Layout, Download, Sparkles, CreditCard, Menu, UserCheck } from 'lucide-react'
import Image from 'next/image'
import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import { addToWaitlist } from '@/actions/waitlist-actions'
import { useToast } from "@/hooks/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import ShimmerButton from "@/components/magicui/shimmer-button"
import AnimatedCheckmark from '@/components/AnimatedCheckmark'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Head from 'next/head'
import GridPattern from "@/components/magicui/animated-grid-pattern"
import HyperText from "@/components/magicui/hyper-text"
import BlurFade from "@/components/magicui/blur-fade"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { PricingComponentComponent } from '@/components/pricing-component'
import { styled } from '@stitches/react';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const PricingWrapper = styled('div', {
  '& > div': {
    background: 'transparent !important',
    backdropFilter: 'none !important',
    WebkitBackdropFilter: 'none !important',
  },
  '& .pricing-card': {
    background: 'rgba(30, 30, 30, 0.6) !important',
    backdropFilter: 'blur(20px) !important',
    WebkitBackdropFilter: 'blur(20px) !important',
  }
});

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
  const pricingRef = useRef<HTMLDivElement>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const MAX_EMAIL_LENGTH = 40 // Set a reasonable maximum length for email addresses

  const features = [
    { icon: <Wand2 className="w-6 h-6" />, title: "AI Image Generation", description: "Create stunning visuals from text prompts using FLUX.1 model", badge: "FLUX.1" },
    { icon: <Maximize className="w-6 h-6" />, title: "Image Upscaling", description: "Enhance image quality up to 10x with Real-ESRGAN", badge: "Real-ESRGAN" },
    { icon: <Layout className="w-6 h-6" />, title: "Multiple Aspect Ratios", description: "Support for various dimensions", badge: "16:9 • 1:1 • 9:16 • more" },
    { icon: <UserCheck className="w-6 h-6" />, title: "Face Enhancement", description: "Run GFPGAN to improve facial details during upscaling", badge: "GFPGAN" },
    { icon: <Sparkles className="w-6 h-6" />, title: "Prompt Enhancement", description: "Boost prompts with Meta-Llama 3 (8B) or GPT-4o-mini during generation", badge: "AI-Powered" },
    { icon: <Download className="w-6 h-6" />, title: "High-Quality Outputs", description: "Generate WebP, JPG, or PNG formats", badge: "HD" },
  ]

  const faqs = [
    {
      question: "What's included in the free tier?",
      answer: "10 image upscales, 10 image generations, and 5 prompt enhancements per day during generation. Choose your LLM for prompt enhancement."
    },
    {
      question: "Which AI models do you use?",
      answer: "FLUX.1 for image generation and Real-ESRGAN for upscaling."
    },
    {
      question: "How does image upscaling work?",
      answer: "Real-ESRGAN enhances image resolution and quality. We offer 2x, 4x, 6x, 8x, and 10x upscaling."
    },
    {
      question: "What's special about Real-ESRGAN?",
      answer: "It removes artifacts, restores details, and produces natural-looking results."
    },
    {
      question: "How does GFPGAN face enhancement work?",
      answer: "GFPGAN automatically improves facial details during upscaling, enhancing eyes, nose, and mouth for more realistic portraits."
    },
    {
      question: "Can I use the images commercially?",
      answer: "Yes, all generated and upscaled images are free for commercial use."
    },
    {
      question: "How does Prompt Enhancement work?",
      answer: "We use Meta-Llama 3 (8B) or GPT-4o-mini to automatically enhance your prompts during image generation, resulting in more detailed and creative outputs."
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent default form submission
      handleSubmit(e as unknown as React.FormEvent)
    }
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

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  const [beforeAfterImages, setBeforeAfterImages] = useState<{ before: string; after: string }[]>([])

  useEffect(() => {
    // Set up the before and after image pairs
    setBeforeAfterImages([
      { before: '/images/landing-page/before-after-images/before-image2.webp', after: '/images/landing-page/before-after-images/after-image2.jpg' },
      { before: '/images/landing-page/before-after-images/before-image.jpg', after: '/images/landing-page/before-after-images/after-image.jpg' },
      { before: '/images/landing-page/before-after-images/before-image3.webp', after: '/images/landing-page/before-after-images/after-image3.jpg' },
      { before: '/images/landing-page/before-after-images/before-image4.webp', after: '/images/landing-page/before-after-images/after-image4.jpg' },
    ])
  }, [])

  const featuresRef = useRef<HTMLDivElement>(null)
  const beforeAfterRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden"
        ref={containerRef}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
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
          <Head>
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
          </Head>
          <motion.nav
            className="p-4 flex justify-between items-center"
            variants={itemVariants}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                <HyperText
                  text="FluxScale AI"
                  className="text-2xl font-bold text-purple-500"
                  duration={2000} // Adjust the duration (in milliseconds) here
                />
              </motion.div>
            </motion.div>
            
            {/* Desktop navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="hidden md:flex space-x-4"
            >
              <Button
                onClick={() => scrollToSection(featuresRef)}
                className="bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Features
              </Button>
              <Button
                onClick={() => scrollToSection(beforeAfterRef)}
                className="bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Before/After
              </Button>
              <Button
                onClick={() => scrollToSection(faqRef)}
                className="bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                FAQ
              </Button>
              <Button
                onClick={scrollToPricing}
                className="bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pricing
              </Button>
            </motion.div>

            {/* Mobile navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button className="md:hidden bg-black hover:bg-gray-900 text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gray-900 text-white border-l border-purple-500">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Button
                    onClick={() => {
                      scrollToSection(featuresRef)
                      document.body.click() // Close the sheet
                    }}
                    className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 justify-start"
                  >
                    Features
                  </Button>
                  <Button
                    onClick={() => {
                      scrollToSection(beforeAfterRef)
                      document.body.click() // Close the sheet
                    }}
                    className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 justify-start"
                  >
                    Before/After
                  </Button>
                  <Button
                    onClick={() => {
                      scrollToSection(faqRef)
                      document.body.click() // Close the sheet
                    }}
                    className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 justify-start"
                  >
                    FAQ
                  </Button>
                  <Button
                    onClick={() => {
                      scrollToPricing()
                      document.body.click() // Close the sheet
                    }}
                    className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 justify-start"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pricing
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </motion.nav>
          
          <main className="container mx-auto px-4 py-16">
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
                <h3 className="text-2xl font-bold mb-4 text-center">Join the Waitlist</h3>
                <p className="text-gray-300 text-center mb-6">Be the first to experience the future of AI-powered image enhancement</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input 
                      ref={emailInputRef}
                      placeholder="Enter your email for early access" 
                      value={email} 
                      onChange={handleEmailChange}
                      onKeyDown={handleKeyDown}
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
                  <ShimmerButton 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
                    disabled={isSubmitting || isSuccess}
                    shimmerColor="#8B5CF6"
                    shimmerSize="0.1em"
                    shimmerDuration="2s"
                  >
                    {isSubmitting ? (
                      <span className="text-white">Joining...</span>
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
                      <div className="flex items-center justify-center text-white">
                        <span>Join Waitlist</span>
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    )}
                  </ShimmerButton>
                </form>
              </div>
            </motion.div>

            <motion.div 
              ref={featuresRef}
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
                          {feature.icon}
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
            </motion.div>

            <motion.div
              ref={beforeAfterRef}
              variants={itemVariants}
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

            <motion.div
              ref={faqRef}
              variants={itemVariants}
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

            <motion.div
              variants={itemVariants}
              className="flex justify-center mb-16"
            >
              <ShimmerButton
                onClick={scrollToWaitlist}
                className="px-8 py-4 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded"
                shimmerColor="#8B5CF6"
                shimmerSize="0.1em"
                shimmerDuration="2s"
              >
                <span className="text-white">Join the AI Revolution</span>
              </ShimmerButton>
            </motion.div>

            {/* New Pricing Section with background override */}
            <motion.div
              ref={pricingRef}
              variants={itemVariants}
              className="mb-24 pt-16"
            >
              <h2 className="text-4xl font-bold mb-8 text-center">
                <AnimatedGradientText>
                  Choose Your Plan
                </AnimatedGradientText>
              </h2>
              <p className="text-xl text-gray-300 text-center mb-12">
                Unlock the full potential of AI-powered image tools
              </p>
              <PricingWrapper>
                <PricingComponentComponent />
              </PricingWrapper>
            </motion.div>

            <motion.footer
              variants={itemVariants}
              className="text-center py-8 text-gray-400"
            >
              © 2024 FluxScale AI. All rights reserved.
            </motion.footer>
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}