import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/nextjs'
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AI Image Tools',
  description: 'Advanced AI-powered image upscaling and generation tools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add this meta tag to prevent zooming on mobile devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <ClerkProvider>
          <SignedIn>
            <Header />
            {children}
          </SignedIn>
          <SignedOut>
            <RedirectToSignIn />
          </SignedOut>
          <SpeedInsights />
          <Analytics />
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
