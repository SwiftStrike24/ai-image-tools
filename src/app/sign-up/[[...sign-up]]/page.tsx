"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import GridPattern from "@/components/magicui/animated-grid-pattern";
import AnimatedGradientText from "@/components/magicui/animated-gradient-text";
import BlurFade from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Theme } from "@clerk/types";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

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
  };

  const appearance: Theme = {
    elements: {
      formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white",
      card: "bg-transparent shadow-none",
      headerTitle: "text-white",
      headerSubtitle: "text-gray-400",
      socialButtonsBlockButton: "bg-gray-800 border border-gray-700 text-white hover:bg-gray-700",
      socialButtonsBlockButtonText: "text-white",
      dividerLine: "bg-gray-700",
      dividerText: "text-gray-400",
      formFieldLabel: "text-gray-300",
      formFieldInput: "bg-gray-800 border-gray-700 text-white placeholder-gray-500",
      footerActionLink: "hidden",
      footer: "hidden",
      formFieldInputShowPasswordButton: "text-gray-400",
    },
    layout: {
      socialButtonsPlacement: "bottom",
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden flex items-center justify-center"
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
      
      <div className="relative z-20 w-full max-w-md px-4 py-16">
        <BlurFade>
          <div className="flex justify-center items-center mb-8">
            <AnimatedGradientText className="text-3xl md:text-4xl font-bold mb-4 text-center">
              <div className="flex items-center justify-center">
                <span className="text-white">Join FluxScale AI</span>
              </div>
            </AnimatedGradientText>
          </div>
        </BlurFade>
        
        <motion.div variants={itemVariants}>
          <MagicCard className="w-full" gradientSize={250}>
            <Card className="w-full bg-gray-900/50 border-gray-800">
              <CardContent className="p-0">
                <div className="flex items-center justify-center py-2 bg-gray-800/50 border-b border-gray-700">
                  <Shield className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-sm text-gray-300">Secured by Clerk</span>
                </div>
                <SignUp 
                  afterSignUpUrl={redirect}
                  redirectUrl={redirect}
                  appearance={appearance}
                />
              </CardContent>
            </Card>
          </MagicCard>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-4 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href={`/sign-in?redirect=${redirect}`} className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}