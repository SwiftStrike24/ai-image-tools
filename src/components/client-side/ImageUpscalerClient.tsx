"use client";

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Loader2, Info, Trash2, ZoomIn, ZoomOut, Maximize, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { upscaleImage, getUpscaleStatus } from "@/actions/replicate/upscaleImage"
import { convertHeicToJpeg } from "@/utils/imageUtils"

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.1;
const RATE_LIMIT_INTERVAL = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_INTERVAL = 5;

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
  const imageRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()
  const [jobId, setJobId] = useState<string | null>(null)

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 10MB limit")
        return
      }
      try {
        const convertedFile = await convertHeicToJpeg(file);
        setOriginalFile(convertedFile);
        const objectUrl = URL.createObjectURL(convertedFile);
        setUploadedImage(objectUrl);
        setError(null);
        setZoom(1);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to process the image.");
      }
    }
  }, [])

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("File size exceeds 10MB limit")
        return
      }
      try {
        const convertedFile = await convertHeicToJpeg(file);
        setOriginalFile(convertedFile);
        const objectUrl = URL.createObjectURL(convertedFile);
        setUploadedImage(objectUrl);
        setError(null);
        setZoom(1);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to process the image.");
      }
    }
  }, [])

  const handleUpscale = useCallback(async () => {
    if (!originalFile || isLoading) return;

    const now = Date.now();
    if (now - lastRequestTime < RATE_LIMIT_INTERVAL) {
      if (requestCount >= MAX_REQUESTS_PER_INTERVAL) {
        toast({
          title: "Rate limit exceeded",
          description: "Please wait before making more requests.",
          variant: "destructive",
        });
        return;
      }
    } else {
      setRequestCount(0);
      setLastRequestTime(now);
    }

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

      const newJobId = await upscaleImage(base64Image, scale, faceEnhance);
      setJobId(newJobId);
      pollJobStatus(newJobId);
    } catch (error) {
      console.error('Upscaling error:', error);
      setError(error instanceof Error ? error.message : "Failed to start upscaling job. Please try again.");
      toast({
        title: "Upscaling Failed",
        description: "There was an error while starting the upscaling process.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [originalFile, upscaleOption, faceEnhance, toast, isLoading, requestCount, lastRequestTime]);

  const pollJobStatus = useCallback(async (currentJobId: string) => {
    try {
      const status = await getUpscaleStatus(currentJobId);
      if (status.status === 'completed') {
        setUpscaledImage(status.result!);
        setRequestCount(prevCount => prevCount + 1);
        toast({
          title: "Upscaling Complete",
          description: "Your image has been successfully upscaled.",
        });
        setIsLoading(false);
        setJobId(null); // Reset job ID after completion
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Upscaling failed');
      } else {
        // Still pending, poll again after a delay
        setTimeout(() => pollJobStatus(currentJobId), 2000);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      setError(error instanceof Error ? error.message : "Failed to upscale image. Please try again.");
      toast({
        title: "Upscaling Failed",
        description: "There was an error while upscaling your image.",
        variant: "destructive",
      });
      setIsLoading(false);
      setJobId(null); // Reset job ID after failure
    }
  }, [toast, setUpscaledImage, setRequestCount, setIsLoading, setError]);

  const handleClearImage = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
    setOriginalFile(null);
    setUpscaledImage(null);
    setZoom(1);
    setError(null);
    setJobId(null); // Reset job ID when clearing the image
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadedImage]);

  const handleZoom = useCallback((newZoom: number) => {
    if (imageContainerRef.current && imageRef.current) {
      const container = imageContainerRef.current
      const image = imageRef.current
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
  }, [])

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  useEffect(() => {
    if (uploadedImage) {
      setUpscaledImage(null)
    }
  }, [uploadedImage, upscaleOption, faceEnhance])

  const upscaleOptions = ['2x', '4x', '6x', '8x', '10x']

  return (
    <div className="flex items-start justify-center bg-gradient-to-br from-gray-900 to-purple-900 min-h-[calc(100vh-80px)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
      <div className="max-w-4xl w-full space-y-8 relative z-10 mt-8">
        <h1 className="text-4xl font-bold text-center text-purple-300 mb-8">AI Image Upscaler</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <AnimatePresence>
              {!uploadedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border-2 border-dashed border-purple-500 rounded-lg p-8 text-center cursor-pointer hover:bg-purple-900/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="mx-auto h-12 w-12 text-purple-400 mb-4" />
                  <p className="text-white">Drag and drop an image here, or click to select</p>
                  <p className="text-sm text-purple-300 mt-2">Max file size: 10MB</p>
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
                <img
                  ref={imageRef}
                  src={uploadedImage}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain transition-transform duration-300 ease-in-out"
                  style={{ transform: `scale(${zoom})` }}
                  onLoad={() => handleZoom(1)} // Reset zoom when image loads
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
          <div className="space-y-6">
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
              <Button
                onClick={handleUpscale}
                disabled={!uploadedImage || isLoading}
                className={cn(
                  "w-full",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Upscale'
                )}
              </Button>
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center items-center py-4"
                  >
                    <div className="flex items-center space-x-2">
                      <motion.div
                        className="w-3 h-3 bg-purple-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [1, 0.5, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="w-3 h-3 bg-purple-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [1, 0.5, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-3 h-3 bg-purple-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [1, 0.5, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <div className="aspect-square rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center">
                    <img src={upscaledImage} alt="Upscaled" className="max-w-full max-h-full object-contain" />
                  </div>
                  <Button
                    asChild
                    className="w-full"
                  >
                    <a
                      href={upscaledImage}
                      download="upscaled_image.jpg"
                    >
                      Download Upscaled Image
                    </a>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {isLoading && jobId && (
          <div className="text-center mt-4">
            <p className="text-white">Job ID: {jobId}</p>
            <p className="text-white">Processing your image...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(ImageUpscalerComponent), {
  ssr: false
});