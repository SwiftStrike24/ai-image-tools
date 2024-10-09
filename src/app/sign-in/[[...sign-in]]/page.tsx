"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GridPattern from "@/components/magicui/animated-grid-pattern";
import AnimatedGradientText from "@/components/magicui/animated-gradient-text";
import BlurFade from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Shield, Home } from 'lucide-react';
import { Theme } from "@clerk/types";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Suspense } from 'react';

function SignInPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const dockItems = [
    { icon: Home, label: "Home", onClick: () => router.push('/') },
  ];

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
                <span className="text-white">Welcome Back</span>
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
                <SignIn 
                  afterSignInUrl={redirect} 
                  redirectUrl={redirect}
                  appearance={appearance}
                  path="/sign-in"
                  routing="path"
                  signUpUrl="/sign-up"
                />
              </CardContent>
            </Card>
          </MagicCard>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-4 text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href={`/sign-up?redirect=${redirect}`} className="text-purple-400 hover:text-purple-300">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
      
      <Dock className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        {dockItems.map((item, index) => (
          <DockIcon key={index} onClick={item.onClick} label={item.label}>
            <item.icon className="w-8 h-8 text-white" />
          </DockIcon>
        ))}
      </Dock>
    </motion.div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  );
}