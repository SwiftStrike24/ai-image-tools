'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, X, Info } from "lucide-react"
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
import RetroGrid from "@/components/magicui/retro-grid"
import ShinyButton from "@/components/magicui/shiny-button"
import { Global, css } from '@emotion/react'

const GlobalStyles = () => (
  <Global
    styles={css`
      /* Webkit (Chrome, Safari, newer versions of Opera) */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background-color: rgba(155, 155, 155, 0.5);
        border-radius: 20px;
        border: transparent;
      }

      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
      }
    `}
  />
)

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
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt before generating images.");
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt before generating images.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

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

      if (Array.isArray(result) && result.length > 0) {
        setImageUrls(result);
        setShowGlow(true);
        setGeneratedAspectRatio(aspectRatio);
        toast({
          title: isSimulationMode ? "Images Simulated" : "Images Generated",
          description: `Successfully ${isSimulationMode ? 'simulated' : 'generated'} ${result.length} image(s).`,
        });
      } else {
        throw new Error('No images were generated. Please try again.');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setError(error instanceof Error ? error.message : "Failed to generate image(s). Please try again.");
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error while generating your image(s).",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
  }, [])

  const closeModal = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square'
      case '4:3': return 'aspect-4/3'
      case '3:4': return 'aspect-3/4'
      case '16:9': return 'aspect-16/9'
      case '9:16': return 'aspect-9/16'
      case '4:5': return 'aspect-[4/5]'
      case '21:9': return 'aspect-[21/9]'
      case '2:3': return 'aspect-[2/3]'
      case '3:2': return 'aspect-[3/2]'
      case '5:4': return 'aspect-[5/4]'
      case '9:21': return 'aspect-[9/21]'
      default: return 'aspect-square'
    }
  }

  const aspectRatioOptions = [
    { value: "1:1", label: "1:1 (Square)" },
    { value: "16:9", label: "16:9 (Widescreen)" },
    { value: "9:16", label: "9:16 (Vertical)" },
    { value: "4:5", label: "4:5 (Instagram Portrait)" },
    { value: "21:9", label: "21:9 (Ultrawide)" },
    { value: "2:3", label: "2:3 (Classic Portrait)" },
    { value: "3:2", label: "3:2 (Classic Landscape)" },
    { value: "5:4", label: "5:4 (Large Format)" },
    { value: "9:21", label: "9:21 (Vertical Ultrawide)" }
  ];

  const simulateImageGeneration = useCallback(async (params: FluxImageParams) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Use a default stock image URL (replace this with an actual image URL from your project)
    const defaultImageUrl = '/images/simulated-image.jpg'; // Assuming you have this image in your public folder
    return Array(params.num_outputs).fill(defaultImageUrl);
  }, []);

  const getModalSizeClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square'
      case '4:3': return 'aspect-4/3'
      case '3:4': return 'aspect-3/4'
      case '16:9': return 'aspect-16/9'
      case '9:16': return 'aspect-9/16'
      case '4:5': return 'aspect-[4/5]'
      case '21:9': return 'aspect-[21/9]'
      case '2:3': return 'aspect-[2/3]'
      case '3:2': return 'aspect-[3/2]'
      case '5:4': return 'aspect-[5/4]'
      case '9:21': return 'aspect-[9/21]'
      default: return 'aspect-square'
    }
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 1000) {
      setPrompt(newValue);
      if (error) setError(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      <GlobalStyles />
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
              Powered by FLUX.1
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
            {/* Image Generation Form */}
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">Prompt</Label>
                  <Input
                    id="prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Enter your image prompt here..."
                    className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 transition-colors duration-200"
                    maxLength={1000}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {prompt.length}/1000
                  </div>
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
                        onClick={() => setNumOutputs(num)}
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
                        onClick={() => setOutputFormat(format)}
                        variant={outputFormat === format ? "default" : "secondary"}
                        className="w-full"
                      >
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="output-quality" className="text-white">Output Quality</Label>
                  <div className="flex items-center space-x-2">
                    <Slider
                      id="output-quality"
                      min={1}
                      max={100}
                      step={1}
                      value={[outputQuality]}
                      onValueChange={(value) => setOutputQuality(value[0])}
                      className="flex-grow"
                    />
                    <span className="text-white">{outputQuality}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enhance-prompt"
                    checked={isEnhancePromptEnabled}
                    onCheckedChange={setIsEnhancePromptEnabled}
                  />
                  <Label htmlFor="enhance-prompt" className="text-white">Enhance Prompt</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-purple-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-purple-900 text-white border-purple-500">
                        <p>Use AI to enhance your prompt for better results</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <ShinyButton
                  onClick={handleSubmit}
                  disabled={isLoading || !prompt.trim()}
                  className={cn(
                    "w-full py-2 md:py-3 text-base md:text-lg font-semibold",
                    (isLoading || !prompt.trim()) && "opacity-50 cursor-not-allowed"
                  )}
                  text={isLoading ? "Generating..." : 'Generate Image(s)'}
                />
              </form>
            </div>

            {/* Generated Images Display */}
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
                          unoptimized={isSimulationMode}
                        />
                        <ShinyButton
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDownload(url, index);
                          }}
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
                          disabled={downloadingIndex === index}
                          text={downloadingIndex === index ? "..." : "Download"}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {imageUrls.length > 0 && (
                <ShinyButton
                  onClick={handleNewImage}
                  className="w-full py-2 md:py-3 text-base md:text-lg font-semibold"
                  text="New Image(s)"
                />
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
      </div>

      <Dialog open={!!selectedImage} onOpenChange={closeModal}>
        <DialogContent className="p-0 overflow-hidden bg-transparent border-none">
          <DialogTitle className="sr-only">Generated Image</DialogTitle>
          <DialogDescription className="sr-only">
            View the generated image in full size
          </DialogDescription>
          <div className="relative flex items-center justify-center w-screen h-screen" onClick={closeModal}>
            {selectedImage && (
              <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <img 
                  src={selectedImage}
                  alt="Generated image"
                  className={`max-w-full max-h-[95vh] object-contain ${getModalSizeClass(generatedAspectRatio)}`}
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