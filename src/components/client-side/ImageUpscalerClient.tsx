"use client";

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Loader2, Info, Trash2, ZoomIn, ZoomOut, Maximize, AlertCircle, X, Download } from 'lucide-react'
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
import { checkAndUpdateRateLimit, getUserUsage } from "@/actions/rateLimit"

// Constants
const MAX_FILE_SIZE_MB = 50; // 50MB
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert MB to bytes
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;
const RATE_LIMIT_INTERVAL = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_INTERVAL = 5;
const MAX_IMAGE_DIMENSION = 1024;
const DAILY_LIMIT = 20;
const STORAGE_KEY = 'upscaler_daily_usage';

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
  const [dailyUsage, setDailyUsage] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

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

  useEffect(() => {
    getUserUsage().then(setDailyUsage).catch((error) => {
      console.error(error);
      if (error.message === "User not authenticated") {
        setIsAuthenticated(false);
      }
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

    const { canProceed, usageCount } = await checkAndUpdateRateLimit();

    if (!canProceed) {
      toast({
        title: "Daily limit reached",
        description: "You've reached your daily limit of 20 upscaled images. Please try again tomorrow or upgrade your plan.",
        variant: "destructive",
      });
      setDailyUsage(usageCount);
      return;
    }

    setDailyUsage(usageCount);

    setIsLoading(true);
    setError(null);

    try {
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

      setUpscaledImage(upscaledImageUrl);
      setRequestCount(prevCount => prevCount + 1);
      setLastRequestTime(Date.now());

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
  }, [originalFile, upscaleOption, faceEnhance, isLoading, isSimulationMode, simulateUpscale, toast]);

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

  const upscaleOptions = ['2x', '4x', '6x', '8x', '10x']

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

          {/* Daily Usage Display */}
          <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Daily Usage (Free Plan)</span>
              <span className="text-sm font-medium">{dailyUsage} / {DAILY_LIMIT}</span>
            </div>
            <Progress value={(dailyUsage / DAILY_LIMIT) * 100} className="h-2" />
            <p className="text-xs text-purple-300">
              {DAILY_LIMIT - dailyUsage} upscales remaining today. Resets at midnight.
            </p>
          </div>

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
                  className="relative aspect-square rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center"
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
                  {upscaleOptions.map((option) => (
                    <Button
                      key={option}
                      onClick={() => setUpscaleOption(option)}
                      variant={upscaleOption === option ? "default" : "secondary"}
                    >
                      {option}
                    </Button>
                  ))}
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
                <ShinyButton
                  onClick={handleUpscale}
                  disabled={!uploadedImage || isLoading || dailyUsage >= DAILY_LIMIT}
                  className={cn(
                    "w-full py-2 md:py-3 text-base md:text-lg font-semibold",
                    (!uploadedImage || isLoading || dailyUsage >= DAILY_LIMIT) && "opacity-50 cursor-not-allowed"
                  )}
                  text={isLoading ? "Processing..." : dailyUsage >= DAILY_LIMIT ? "Daily Limit Reached" : 'Upscale'}
                >
                  {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                </ShinyButton>
                {dailyUsage >= DAILY_LIMIT && (
                  <p className="text-xs text-red-400 mt-2">
                    You've reached your daily limit. Please try again tomorrow or upgrade your plan.
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
                      className={`relative ${getAspectRatioClass(upscaleOption)} rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center cursor-pointer group`}
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
                <img 
                  src={selectedImage}
                  alt="Upscaled image"
                  className="max-w-full max-h-[95vh] object-contain"
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