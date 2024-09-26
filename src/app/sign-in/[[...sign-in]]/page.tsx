"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import GridPattern from "@/components/magicui/animated-grid-pattern";
import AnimatedGradientText from "@/components/magicui/animated-gradient-text";
import BlurFade from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
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
                <SignIn afterSignInUrl={redirect} />
              </CardContent>
            </Card>
          </MagicCard>
        </motion.div>
      </div>
    </motion.div>
  );
}