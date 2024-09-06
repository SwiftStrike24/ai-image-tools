'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Download, RefreshCw, Sparkles, X, Info, ZoomIn, ZoomOut } from "lucide-react"
import { generateFluxImage } from "@/actions/replicate/generateFluxImage"
import { enhancePrompt } from "@/actions/replicate/enhancePrompt"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { FluxImageParams } from "@/types/imageTypes"

export default function FluxAIImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showGlow, setShowGlow] = useState(false)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [generatedAspectRatio, setGeneratedAspectRatio] = useState("1:1")
  const [numOutputs, setNumOutputs] = useState(1)
  const [outputFormat, setOutputFormat] = useState("webp")
  const [outputQuality, setOutputQuality] = useState(80)
  const [isEnhancePromptEnabled, setIsEnhancePromptEnabled] = useState(false)
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [modalZoom, setModalZoom] = useState(1)
  const modalImageRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let finalPrompt = prompt;

      if (isEnhancePromptEnabled) {
        const enhancedPromptResult = await enhancePrompt(prompt);
        finalPrompt = enhancedPromptResult !== prompt ? enhancedPromptResult : prompt;
        toast({
          title: enhancedPromptResult !== prompt ? "Prompt Enhanced" : "Prompt Enhancement Skipped",
          description: enhancedPromptResult !== prompt 
            ? "Your prompt was enhanced for better results." 
            : "The original prompt was used as the enhanced version was too short.",
          duration: 5000,
        });
      }

      const params: FluxImageParams = {
        prompt: finalPrompt,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        output_format: outputFormat,
        output_quality: outputQuality,
        enhance_prompt: isEnhancePromptEnabled,
        disable_safety_checker: true,
      };

      const result = isSimulationMode 
        ? await simulateImageGeneration(params)
        : await generateFluxImage(params);

      if (Array.isArray(result)) {
        setImageUrls(result)
        setShowGlow(true)
        setGeneratedAspectRatio(aspectRatio)
        toast({
          title: isSimulationMode ? "Images Simulated" : "Images Generated",
          description: `Successfully ${isSimulationMode ? 'simulated' : 'generated'} ${result.length} image(s).`,
        })
      } else {
        throw new Error('Unexpected response from generate API')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      setError(error instanceof Error ? error.message : "Failed to generate image(s). Please try again.")
      toast({
        title: "Generation Failed",
        description: "There was an error while generating your image(s).",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewImage = useCallback(() => {
    setPrompt('')
    setImageUrls([])
    setError(null)
  }, [])

  const handleDownload = useCallback(async (url: string, index: number) => {
    setDownloadingIndex(index)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `generated-image-${index + 1}.${outputFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      
      toast({
        title: "Image Downloaded",
        description: `Your image has been successfully downloaded.`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "There was an error downloading your image. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setDownloadingIndex(null)
    }
  }, [outputFormat, toast])

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url)
    setModalZoom(1)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
    setModalZoom(1)
  }, [])

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square'
      case '4:3': return 'aspect-4/3'
      case '3:4': return 'aspect-3/4'
      case '16:9': return 'aspect-16/9'
      case '9:16': return 'aspect-9/16'
      case '4:5': return 'aspect-4/5'
      case '21:9': return 'aspect-[21/9]'
      case '2:3': return 'aspect-2/3'
      case '3:2': return 'aspect-3/2'
      case '5:4': return 'aspect-5/4'
      case '9:21': return 'aspect-[9/21]'
      default: return 'aspect-square'
    }
  }

  const getModalSizeClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'w-full max-w-xl h-auto aspect-square'
      case '16:9': return 'w-full max-w-4xl h-auto aspect-video'
      case '9:16': return 'w-full max-w-sm h-auto aspect-[9/16]'
      case '4:5': return 'w-full max-w-lg h-auto aspect-[4/5]'
      case '21:9': return 'w-full max-w-5xl h-auto aspect-[21/9]'
      case '2:3': return 'w-full max-w-md h-auto aspect-[2/3]'
      case '3:2': return 'w-full max-w-2xl h-auto aspect-[3/2]'
      case '5:4': return 'w-full max-w-xl h-auto aspect-[5/4]'
      case '9:21': return 'w-full max-w-sm h-auto aspect-[9/21]'
      default: return 'w-full max-w-xl h-auto aspect-square'
    }
  }

  const aspectRatioOptions = [
    { value: "1:1", label: "1:1 (Square)" },
    { value: "16:9", label: "16:9 (Widescreen)" },
    { value: "9:16", label: "9:16 (Vertical)" },
    { value: "4:5", label: "4:5" },
    { value: "21:9", label: "21:9 (Ultrawide)" },
    { value: "2:3", label: "2:3" },
    { value: "3:2", label: "3:2" },
    { value: "5:4", label: "5:4" },
    { value: "9:21", label: "9:21 (Vertical Ultrawide)" }
  ];

  const simulateImageGeneration = useCallback(async (params: FluxImageParams) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return Array(params.num_outputs).fill(null).map((_, index) => {
      const [width, height] = params.aspect_ratio.split(':').map(Number);
      return `https://via.placeholder.com/${width * 100}x${height * 100}/1a1a1a/ffffff.png?text=Generated+${index + 1}`;
    });
  }, []);

  const handleModalZoom = useCallback((zoomIn: boolean) => {
    setModalZoom(prev => {
      const newZoom = zoomIn ? prev * 1.2 : prev / 1.2
      return Math.max(1, Math.min(newZoom, 3))
    })
  }, [])

  return (
    <div className="flex items-start justify-center bg-gradient-to-br from-gray-900 to-purple-900 min-h-[calc(100vh-80px)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
      <div className="max-w-4xl w-full space-y-8 relative z-10 mt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-center text-purple-300">Image Generator</h1>
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
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-white">Image Prompt</Label>
                <Input
                  id="prompt"
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your image prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aspect-ratio" className="text-white">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspect-ratio" className="w-full bg-gray-800 text-white border-gray-700">
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatioOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Number of Outputs</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setNumOutputs(num);
                      }}
                      variant={numOutputs === num ? "default" : "secondary"}
                      className="w-full"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Output Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['webp', 'jpg', 'png'].map((format) => (
                    <Button
                      key={format}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setOutputFormat(format);
                      }}
                      variant={outputFormat === format ? "default" : "secondary"}
                      className="w-full"
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Output Quality: {outputQuality}</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[outputQuality]}
                  onValueChange={(value) => setOutputQuality(value[0])}
                  className="w-full"
                  disabled={outputFormat === 'png'}
                />
              </div>
              <div className="flex items-center space-x-2 text-white">
                <Switch
                  id="enhance-prompt"
                  checked={isEnhancePromptEnabled}
                  onCheckedChange={setIsEnhancePromptEnabled}
                />
                <Label htmlFor="enhance-prompt">Enhance Prompt</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="w-4 h-4 text-purple-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right"
                      className="bg-purple-900 text-white border-purple-500"
                    >
                      <p>Automatically enhance your prompt for better results</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                type="submit"
                className={cn(
                  "w-full",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  'Generate Image(s)'
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
            </form>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {imageUrls.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`grid gap-4 ${
                    imageUrls.length === 1 ? 'grid-cols-1' :
                    imageUrls.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}
                >
                  {imageUrls.map((url, index) => (
                    <div 
                      key={index} 
                      className={`relative ${getAspectRatioClass(generatedAspectRatio)} rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center cursor-pointer group`}
                      onClick={() => handleImageClick(url)}
                    >
                      {showGlow && (
                        <motion.div
                          className="absolute inset-0 bg-purple-500 opacity-20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.2 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1 }}
                        />
                      )}
                      <Image
                        src={url}
                        alt={`Generated ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="w-full h-full"
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(url, index);
                        }}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        size="sm"
                        variant="secondary"
                        disabled={downloadingIndex === index}
                      >
                        {downloadingIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {imageUrls.length > 0 && (
              <Button
                onClick={handleNewImage}
                className="w-full"
                variant="secondary"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                New Image(s)
              </Button>
            )}
          </div>
        </div>

        {isSimulationMode && (
          <Alert className="mt-4 bg-yellow-900/50 border-yellow-600">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-yellow-400">Simulation Mode Active</AlertTitle>
            <AlertDescription className="text-yellow-200">
              You are currently in simulation mode. No real API calls will be made.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 overflow-hidden bg-black/80 border-none flex items-center justify-center">
          <DialogTitle className="sr-only">Generated Image</DialogTitle>
          <DialogDescription className="sr-only">
            View the generated image in full size
          </DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {selectedImage && (
              <div 
                className={`relative ${getModalSizeClass(generatedAspectRatio)}`}
                style={{
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img 
                  ref={modalImageRef}
                  src={selectedImage}
                  alt="Generated image"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${modalZoom})`,
                    transition: 'transform 0.2s ease-in-out'
                  }}
                />
              </div>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleModalZoom(false)}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleModalZoom(true)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <DialogClose className="absolute top-2 right-2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200">
              <X className="h-6 w-6" />
              <VisuallyHidden>Close</VisuallyHidden>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}