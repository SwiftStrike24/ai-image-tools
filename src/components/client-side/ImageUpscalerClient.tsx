"use client";

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Loader2, Info, Trash2, ZoomIn, ZoomOut, Maximize, AlertCircle, X, Download, Lock, Sparkles, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { upscaleImage } from "@/actions/replicate/upscaleImage"
import { ImageUtilsType, dummyImageUtils } from '@/utils/imageUtils'
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import RetroGrid from "@/components/magicui/retro-grid"
import ShinyButton from "@/components/magicui/shiny-button"
import { resizeImage } from '@/utils/imageUtils'
import { Progress } from "@/components/ui/progress"
import { BorderBeam } from "@/components/magicui/border-beam"
import { 
  UPSCALER_DAILY_LIMIT, 
  PRO_UPSCALER_MONTHLY_LIMIT, 
  PREMIUM_UPSCALER_MONTHLY_LIMIT, 
  ULTIMATE_UPSCALER_MONTHLY_LIMIT 
} from "@/constants/rateLimits"
import { useSubscription } from '@/hooks/useSubscription'
import { getTimeUntilReset } from '@/utils/dateUtils'
import UsageCounter from '@/components/UsageCounter'
import { checkAndUpdateUpscalerLimit } from "@/actions/rateLimit"
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { LoadingBeam } from "@/components/loading-beam"
import { useUsageSync } from '@/utils/usageSync'
import Link from 'next/link'

// Constants
const MAX_FILE_SIZE_MB = 50; // 50MB
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;
const RATE_LIMIT_INTERVAL = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_INTERVAL = 5;
const MAX_IMAGE_DIMENSION = 1024;

// Function to handle image upload
function ImageUpscalerComponent() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [upscaleOption, setUpscaleOption] = useState('2x')
  const [isLoading, setIsLoading] = useState(false)
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null)
  const [faceEnhance, setFaceEnhance] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUtils, setImageUtils] = useState<ImageUtilsType>(dummyImageUtils)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [upscalerUpdateTrigger, setUpscalerUpdateTrigger] = useState(0)
  const { incrementUsage, syncUsageData, incrementMultipleUsage } = useSubscriptionStore()
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { 
    subscriptionType: upscalerSubscriptionType,
    usage: upscalerUsage,
    isLoading: isUpscalerSubscriptionLoading,
    checkAndUpdateLimit: checkAndUpdateUpscalerLimit,
  } = useSubscription('upscaler');

  const { incrementUsageAndSync } = useUsageSync();

  const handleUpscalerUsageUpdate = useCallback((newUsage: number) => {
    console.log("New upscaler usage:", newUsage);
  }, []);

  useEffect(() => {
    import('@/utils/browserUtils').then((module) => {
      setImageUtils({
        convertHeicToJpeg: module.convertHeicToJpeg,
        compressImage: module.compressImage,
        createObjectURL: module.createObjectURL,
        revokeObjectURL: module.revokeObjectURL,
      });
    });
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
        return
      }
      try {
        const convertedFile = await imageUtils.convertHeicToJpeg(file);
        const compressedFile = await imageUtils.compressImage(convertedFile, 1920, 0.8);
        const resizedImage = await resizeImage(compressedFile, MAX_IMAGE_DIMENSION);
        setOriginalFile(resizedImage);
        const objectUrl = imageUtils.createObjectURL(resizedImage);
        setUploadedImage(objectUrl);
        setError(null);
        setZoom(1);
        
        if (resizedImage.size !== compressedFile.size) {
          toast({
            title: "Image Resized",
            description: `Your image was larger than ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} and has been resized for optimal processing. The upscaled result will still be of higher quality.`,
            duration: 5000,
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to process the image.");
      }
    }
  }, [imageUtils, toast])

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`)
        return
      }
      try {
        const convertedFile = await imageUtils.convertHeicToJpeg(file);
        const compressedFile = await imageUtils.compressImage(convertedFile, 1920, 0.8);
        const resizedImage = await resizeImage(compressedFile, MAX_IMAGE_DIMENSION);
        setOriginalFile(resizedImage);
        const objectUrl = imageUtils.createObjectURL(resizedImage);
        setUploadedImage(objectUrl);
        setError(null);
        setZoom(1);
        
        if (resizedImage.size !== compressedFile.size) {
          toast({
            title: "Image Resized",
            description: `Your image was larger than ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} and has been resized for optimal processing. The upscaled result will still be of higher quality.`,
            duration: 5000,
          });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to process the image.");
      }
    }
  }, [imageUtils, toast])

  // Function to simulate upscaling for UI testing
  const simulateUpscale = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      // Create a simulated upscaled image by duplicating the original
      const img = new window.Image(); // Use window.Image instead of Image
      img.onload = () => {
        const scale = parseInt(upscaleOption.replace('x', ''));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        const simulatedUpscaledImage = canvas.toDataURL('image/jpeg');
        setUpscaledImage(simulatedUpscaledImage);
        setRequestCount(prevCount => prevCount + 1);
        toast({
          title: "Upscaling Complete (Simulated)",
          description: "Your image has been successfully upscaled in simulation mode.",
        });
        setIsLoading(false);
      };
      img.src = uploadedImage as string;
    }, 3000); // Simulate a 3-second upscaling process
  }, [uploadedImage, upscaleOption, toast]);

  const handleUpscale = useCallback(async () => {
    if (!originalFile || isLoading) return;

    if (isSimulationMode) {
      simulateUpscale();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if upscaling is allowed, but don't increment usage yet
      const { canProceed } = await checkAndUpdateUpscalerLimit(1, false);
      if (!canProceed) {
        setError("You've reached your upscale limit. Please try again later or upgrade your plan.");
        return;
      }

      const scale = parseInt(upscaleOption.replace('x', ''));
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read the image file."));
        reader.readAsDataURL(originalFile);
      });

      console.log("Calling upscaleImage API...");
      toast({
        title: "Upscaling Started",
        description: "Your image is being processed. This may take a few minutes.",
      });

      const upscaledImageUrl = await upscaleImage({
        image: base64Image,
        scale,
        faceEnhance,
      });

      console.log("Received upscaled image URL:", upscaledImageUrl);

      // Increment usage and sync immediately after successful upscale
      await incrementUsageAndSync('upscaler', 1);

      // Sync the usage data to ensure the UI is up-to-date
      await syncUsageData();

      setUpscaledImage(upscaledImageUrl);

      toast({
        title: "Upscaling Complete",
        description: "Your image has been successfully upscaled.",
      });
    } catch (error) {
      console.error('Upscaling error:', error);
      let errorMessage = "Failed to upscale image. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast({
        title: "Upscaling Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [originalFile, upscaleOption, faceEnhance, isLoading, isSimulationMode, simulateUpscale, toast, checkAndUpdateUpscalerLimit, syncUsageData, incrementUsageAndSync]);

  // Function to clear the uploaded image
  const handleClearImage = useCallback(() => {
    if (uploadedImage) {
      imageUtils.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
    setOriginalFile(null);
    setUpscaledImage(null);
    setZoom(1);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedImage, imageUtils]);

  // Function to handle zooming in and out of the image
  const handleZoom = useCallback((newZoom: number) => {
    if (imageContainerRef.current) {
      const container = imageContainerRef.current
      const image = container.querySelector('img') // Find the image within the container

      if (image) {
        const containerAspectRatio = container.clientWidth / container.clientHeight
        const imageAspectRatio = image.naturalWidth / image.naturalHeight

        let minZoom = 1
        if (imageAspectRatio > containerAspectRatio) {
          minZoom = container.clientWidth / image.naturalWidth
        } else {
          minZoom = container.clientHeight / image.naturalHeight
        }

        setZoom(Math.max(minZoom, Math.min(newZoom, MAX_ZOOM)))
      }
    }
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
    setIsModalOpen(false);
  }, []);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
    setIsImageModalOpen(true);
    setIsModalOpen(true);
  }, []);

  // Function to get the aspect ratio class for the upscaled image
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square'
      case '4:3': return 'aspect-4/3'
      case '3:4': return 'aspect-3/4'
      case '16:9': return 'aspect-16/9'
      case '9:16': return 'aspect-9/16'
      default: return 'aspect-square'
    }
  }

  // Function to handle downloading the upscaled image
  const handleDownload = useCallback(async () => {
    if (!upscaledImage) return;

    try {
      const response = await fetch(upscaledImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const now = new Date();
      const dateString = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      const fileName = `Upscaled_Image_${upscaleOption}_${dateString}.jpg`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Image Downloaded",
        description: `Your ${upscaleOption} upscaled image has been successfully downloaded.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your image. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [upscaledImage, upscaleOption, toast]);

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        imageUtils.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage, imageUtils]);

  useEffect(() => {
    if (uploadedImage) {
      setUpscaledImage(null)
    }
  }, [uploadedImage, upscaleOption, faceEnhance])

  const getAvailableUpscaleOptions = (subscriptionType: string) => {
    switch (subscriptionType) {
      case 'ultimate':
      case 'premium':
        return ['2x', '4x', '6x', '8x', '10x'];
      case 'pro':
        return ['2x', '4x', '6x', '8x'];
      default: // basic plan
        return ['2x', '4x'];
    }
  };

  const getUpgradeMessage = (option: string, currentPlan: string) => {
    switch (option) {
      case '10x':
        return 'Upgrade to Premium or Ultimate to unlock 10x upscaling';
      case '8x':
      case '6x':
        return 'Upgrade to Pro or higher to unlock advanced upscaling options';
      default:
        return `Upgrade your plan to unlock ${option} upscaling`;
    }
  };

  useEffect(() => {
    if (!isSimulationMode) {
      syncUsageData();
    }
  }, [isSimulationMode, syncUsageData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Please log in to use the image upscaler.</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen bg-gray-900 text-white overflow-hidden ${isModalOpen ? 'blur-sm' : ''}`}>
      <RetroGrid className="absolute inset-0 z-0 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-purple-900/50 to-gray-900/90 z-10" />
      <div className="relative z-20 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Usage Counter */}
          <UsageCounter 
            type="upscaler" 
            isSimulationMode={isSimulationMode} 
          />

          <div className="flex justify-between items-center">
            <motion.p 
              className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Powered by Real-ESRGAN
            </motion.p>
            <div className="flex items-center space-x-2">
              <Label htmlFor="simulation-mode" className="text-white">Simulation Mode</Label>
              <Switch
                id="simulation-mode"
                checked={isSimulationMode}
                onCheckedChange={setIsSimulationMode}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-purple-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-purple-900 text-white border-purple-500">
                    <p>Toggle simulation mode to test UI without making API requests</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Image Upload Area */}
            <div className="space-y-4">
              <AnimatePresence>
                {!uploadedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border-2 border-dashed border-purple-500 rounded-lg p-4 md:p-8 text-center cursor-pointer hover:bg-purple-900/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="mx-auto h-8 w-8 md:h-12 md:w-12 text-purple-400 mb-2 md:mb-4" />
                    <p className="text-sm md:text-base text-white">Tap to upload an image</p>
                    <p className="text-xs md:text-sm text-purple-300 mt-1 md:mt-2">Max file size: {MAX_FILE_SIZE_MB}MB</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                      aria-label="Upload image"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              {uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                  ref={imageContainerRef}
                >
                  <Image
                    src={uploadedImage}
                    alt="Uploaded"
                    layout="fill"
                    objectFit="contain"
                    className="transition-transform duration-300 ease-in-out"
                    style={{ transform: `scale(${zoom})` }}
                    onLoadingComplete={() => handleZoom(1)}
                  />
                  <BorderBeam 
                    className="pointer-events-none"
                    size={300}
                    duration={10}
                    colorFrom="#ff00ff"
                    colorTo="#00ffff"
                  />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleZoom(zoom - ZOOM_STEP)}
                        disabled={zoom <= MIN_ZOOM}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleZoom(1)}
                        disabled={zoom === 1}
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleZoom(zoom + ZOOM_STEP)}
                        disabled={zoom >= MAX_ZOOM}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={handleClearImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Upscale Options and Controls */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <Label className="text-white mb-2 block">Upscale Factor</Label>
                <div className="grid grid-cols-5 gap-2">
                  {['2x', '4x', '6x', '8x', '10x'].map((option) => {
                    const isAvailable = getAvailableUpscaleOptions(upscalerSubscriptionType).includes(option);
                    
                    return (
                      <TooltipProvider key={option}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Button
                                onClick={() => isAvailable && setUpscaleOption(option)}
                                variant={upscaleOption === option ? "default" : "secondary"}
                                className={cn(
                                  !isAvailable && "opacity-50 cursor-not-allowed bg-gray-700 hover:bg-gray-700",
                                  "relative w-full"
                                )}
                                disabled={!isAvailable}
                              >
                                {option}
                                {!isAvailable && (
                                  <Lock className="w-3 h-3 absolute top-1 right-1 text-yellow-500" />
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!isAvailable && (
                            <TooltipContent 
                              side="top" 
                              className="bg-purple-900/90 border-purple-500 p-3" // Added padding
                              sideOffset={5} // Added offset for better positioning
                            >
                              <div className="space-y-2"> {/* Added container with spacing */}
                                <p className="text-sm">
                                  {getUpgradeMessage(option, upscalerSubscriptionType)}
                                </p>
                                <p className="text-xs text-purple-300">
                                  Unlock more powerful upscaling options! 🚀
                                </p>
                                <Link 
                                  href="/pricing" 
                                  className={cn(
                                    "group inline-flex items-center justify-center px-4 py-1.5 mt-2",
                                    "text-sm font-medium text-white",
                                    "bg-gradient-to-r from-purple-500 to-pink-500",
                                    "rounded-md shadow-sm",
                                    "transition-all duration-300",
                                    "hover:from-purple-600 hover:to-pink-600",
                                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1",
                                    "active:from-purple-700 active:to-pink-700",
                                    "relative overflow-hidden",
                                    isUpgrading && "cursor-not-allowed opacity-80"
                                  )}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (isUpgrading) return;
                                    
                                    setIsUpgrading(true);
                                    const button = e.currentTarget;
                                    button.classList.add('upgrading');
                                    
                                    // Add sparkle effect
                                    const sparkle = document.createElement('div');
                                    sparkle.className = 'absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse';
                                    button.appendChild(sparkle);
                                    
                                    setTimeout(() => {
                                      window.location.href = '/pricing';
                                    }, 600);
                                  }}
                                >
                                  <span className="relative z-10 flex items-center">
                                    {isUpgrading ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                                        <span>Redirecting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>Upgrade Now</span>
                                        <Zap className="ml-1.5 w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                                        <svg 
                                          className="ml-1.5 -mr-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M13 7l5 5m0 0l-5 5m5-5H6" 
                                          />
                                        </svg>
                                      </>
                                    )}
                                  </span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-500/10 to-purple-600/0 group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-purple-400/10 animate-shimmer" />
                                  </div>
                                </Link>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Switch
                  id="face-enhance"
                  checked={faceEnhance}
                  onCheckedChange={setFaceEnhance}
                />
                <Label htmlFor="face-enhance">Face Enhance</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-purple-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right"
                      className="bg-purple-900 text-white border-purple-500"
                    >
                      <p>Run GFPGAN face enhancement along with upscaling to improve facial details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <LoadingBeam
                  onClick={handleUpscale}
                  isLoading={isLoading}
                  disabled={!uploadedImage || isLoading || upscalerUsage >= (upscalerSubscriptionType === 'ultimate' ? ULTIMATE_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'premium' ? PREMIUM_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'pro' ? PRO_UPSCALER_MONTHLY_LIMIT : UPSCALER_DAILY_LIMIT)}
                  className={cn(
                    "w-full py-2 md:py-3 text-base md:text-lg font-semibold",
                    (!uploadedImage || isLoading || upscalerUsage >= (upscalerSubscriptionType === 'ultimate' ? ULTIMATE_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'premium' ? PREMIUM_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'pro' ? PRO_UPSCALER_MONTHLY_LIMIT : UPSCALER_DAILY_LIMIT)) && "opacity-50 cursor-not-allowed"
                  )}
                  loadingText="Processing..."
                  waveColor="rgba(255, 255, 255, 0.5)" // White wave color with 50% opacity
                  waveSpeed={1.2}
                  waveWidth={120}
                >
                  {upscalerUsage >= (upscalerSubscriptionType === 'ultimate' ? ULTIMATE_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'premium' ? PREMIUM_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'pro' ? PRO_UPSCALER_MONTHLY_LIMIT : UPSCALER_DAILY_LIMIT) ? `${upscalerSubscriptionType === 'basic' ? 'Daily' : 'Monthly'} Limit Reached` : 'Upscale'}
                </LoadingBeam>
                {upscalerUsage >= (upscalerSubscriptionType === 'ultimate' ? ULTIMATE_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'premium' ? PREMIUM_UPSCALER_MONTHLY_LIMIT : upscalerSubscriptionType === 'pro' ? PRO_UPSCALER_MONTHLY_LIMIT : UPSCALER_DAILY_LIMIT) && (
                  <p className="text-xs text-red-400 mt-2">
                    You&apos;ve reached your {upscalerSubscriptionType === 'basic' ? 'daily' : 'monthly'} limit. Please try again {upscalerSubscriptionType === 'basic' ? 'tomorrow' : 'next month'} or upgrade your plan.
                  </p>
                )}
              </div>
              <AnimatePresence>
                {upscaledImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div 
                      className={`relative ${getAspectRatioClass(upscaleOption)} rounded-lg overflow-hidden flex items-center justify-center cursor-pointer group`}
                      onClick={() => handleImageClick(upscaledImage)}
                    >
                      <Image
                        src={upscaledImage}
                        alt="Upscaled"
                        layout="fill"
                        objectFit="contain"
                        unoptimized
                        onError={(e) => {
                          console.error('Error loading upscaled image:', e);
                          setError("Failed to load upscaled image. Please try again.");
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
                      <ZoomIn className="absolute text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <BorderBeam 
                        className="pointer-events-none"
                        size={300}
                        duration={10}
                        colorFrom="#ff00ff"
                        colorTo="#00ffff"
                      />
                    </div>
                    <ShinyButton
                      onClick={handleDownload}
                      disabled={!upscaledImage}
                      className="w-full py-3 text-lg font-semibold"
                      text={`Download ${upscaleOption} Upscaled Image`}
                    >
                      <Download className="mr-2 h-5 w-5" />
                    </ShinyButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {isSimulationMode && (
            <Alert className="mt-4 bg-yellow-900/50 border-yellow-600">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertTitle className="text-yellow-400">Simulation Mode Active</AlertTitle>
              <AlertDescription className="text-yellow-200">
                You are currently in simulation mode. No real API calls will be made, and a placeholder image will be used.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      
      <Dialog open={isImageModalOpen} onOpenChange={(open) => {
        if (!open) closeModal();
      }}>
        <DialogContent className="p-0 overflow-hidden bg-transparent border-none">
          <DialogTitle className="sr-only">Upscaled Image</DialogTitle>
          <DialogDescription className="sr-only">
            View the upscaled image in full size
          </DialogDescription>
          <div className="relative flex items-center justify-center w-screen h-screen" onClick={closeModal}>
            {selectedImage && (
              <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <Image 
                  src={selectedImage}
                  alt="Upscaled image"
                  layout="responsive"
                  width={1920}
                  height={1080}
                  objectFit="contain"
                  className="max-w-[95vw] max-h-[95vh]"
                />
                <DialogClose className="absolute top-6 right-6 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200">
                  <X className="h-6 w-6" />
                  <VisuallyHidden>Close</VisuallyHidden>
                </DialogClose>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ImageUpscalerComponent), {
  ssr: false
});
