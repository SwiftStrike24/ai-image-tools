"use client";

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2 as MagicWandIcon, Maximize2 as ArrowsExpandIcon, Layout as LayoutIcon, Sparkles as SparklesIcon, Brain as BrainIcon, Star as StarIcon, FlaskConical as FlaskIcon, ChevronDown as ChevronDownIcon, Github as GithubIcon, Instagram as InstagramIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { SiX } from '@icons-pack/react-simple-icons'

const features = [
  { name: 'AI Image Generation', icon: <MagicWandIcon className="w-6 h-6" />, description: 'Create stunning visuals with our advanced AI' },
  { name: 'Image Upscaling', icon: <ArrowsExpandIcon className="w-6 h-6" />, description: 'Enhance image quality up to 10x' },
  { name: 'Multiple Aspect Ratios', icon: <LayoutIcon className="w-6 h-6" />, description: 'Perfect for various platforms and uses' },
  { name: 'Face Enhancement', icon: <SparklesIcon className="w-6 h-6" />, description: 'Automatically improve facial features' },
  { name: 'Smart Prompt Enhancement', icon: <BrainIcon className="w-6 h-6" />, description: 'Get better results with AI-assisted prompts' },
  { name: 'High-Quality Outputs', icon: <StarIcon className="w-6 h-6" />, description: 'Professional-grade images every time' },
]

const faqItems = [
  {
    question: 'What AI models does FluxScale AI use?',
    answer: 'FluxScale AI uses FLUX.1 for image generation and Real-ESRGAN for upscaling, providing state-of-the-art results.'
  },
  {
    question: 'How many images can I generate per day?',
    answer: 'The number of images you can generate depends on your subscription plan. Our free tier offers 20 images per day, while paid plans offer unlimited generations.'
  },
  {
    question: 'Can I use the generated images commercially?',
    answer: 'Yes, you have full rights to use the images you generate for both personal and commercial purposes.'
  },
  {
    question: 'How does FluxScale AI ensure image quality?',
    answer: 'We use advanced AI models and post-processing techniques to ensure high-quality outputs. Our face enhancement feature further improves portrait images.'
  },
  {
    question: 'Is my data safe with FluxScale AI?',
    answer: 'Absolutely. We use industry-standard encryption and never store your generated images on our servers without your explicit permission.'
  }
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* RetroGrid Background */}
      <div className="fixed inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-gray-900 opacity-50"></div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center z-10 max-w-4xl mx-auto px-4"
          >
            <h1 className="text-6xl font-bold mb-4">FluxScale AI</h1>
            <p className="text-2xl mb-8">Transform Your Visuals with AI</p>
            <p className="text-xl mb-12">fluxscaleai.com</p>
            <div className="space-x-4">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                <Link href="/upscaler">Start Creating</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                Learn More
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">Powerful Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                >
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold ml-2">{feature.name}</h3>
                  </div>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Images Section */}
        {/* Temporarily removed due to missing images */}

        {/* Why Choose FluxScale AI */}
        <section className="py-20 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">Why Choose FluxScale AI?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Cutting-Edge Technology</h3>
                <p>Powered by the latest AI models, ensuring top-quality results every time.</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">User-Friendly Interface</h3>
                <p>Intuitive design makes it easy for anyone to create stunning visuals.</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Rapid Processing</h3>
                <p>Generate and upscale images in seconds, not minutes.</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Flexible Output Options</h3>
                <p>Choose from various formats and sizes to suit your needs.</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Constant Improvements</h3>
                <p>Regular updates to enhance features and performance.</p>
              </div>
              <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Dedicated Support</h3>
                <p>Our team is always ready to assist you with any questions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqItems.map((item, index) => (
                <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                  <button
                    className="w-full p-4 text-left flex justify-between items-center"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="text-lg font-semibold">{item.question}</span>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${openFaq === index ? 'transform rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 pb-4"
                      >
                        <p className="text-gray-300">{item.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-8">Ready to Transform Your Visuals?</h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto">Join thousands of creators who are already using FluxScale AI to bring their ideas to life.</p>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
              <Link href="/upscaler">Get Started for Free</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p>&copy; 2023 FluxScale AI. All rights reserved.</p>
                <p className="text-gray-400">fluxscaleai.com</p>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <GithubIcon className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <SiX className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <InstagramIcon className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}