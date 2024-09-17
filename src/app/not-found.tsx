'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import ShinyButton from "@/components/magicui/shiny-button";
import RetroGrid from "@/components/magicui/retro-grid";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="relative h-screen w-full bg-gray-900 overflow-hidden">
      <RetroGrid />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-9xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800"
        >
          404
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-semibold mb-4"
        >
          Page Not Found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl mb-8 text-center max-w-md"
        >
          Oops! It seems like you've ventured into uncharted territory.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex space-x-4 items-center"
        >
          <ShinyButton 
            onClick={() => router.push('/')} 
            className="flex items-center justify-center text-lg py-3 px-6"
          >
            Return Home
          </ShinyButton>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="bg-white text-black hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center text-sm py-2 px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Go Back</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}