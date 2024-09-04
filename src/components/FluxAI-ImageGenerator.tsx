'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Download, RefreshCw, Sparkles, X } from "lucide-react"
import { generateFluxImage, enhancePrompt } from "@/actions/replicate-actions"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function FluxAIImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('') // New state for enhanced prompt
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
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let finalPrompt = prompt;

      if (isEnhancePromptEnabled) {
        const enhancedPromptResult = await enhancePrompt(prompt);
        setEnhancedPrompt(enhancedPromptResult); // Store the enhanced prompt
        finalPrompt = enhancedPromptResult;
        // Note: We're not updating the 'prompt' state here
      }

      const result = await generateFluxImage({
        prompt: finalPrompt,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        output_format: outputFormat,
        output_quality: outputQuality,
        enhance_prompt: isEnhancePromptEnabled,
        disable_safety_checker: true,
      })
      if (Array.isArray(result)) {
        setImageUrls(result)
        setShowGlow(true)
        setGeneratedAspectRatio(aspectRatio)
        toast({
          title: "Images Generated",
          description: `Successfully generated ${result.length} image(s).`,
        })
        if (isEnhancePromptEnabled) {
          toast({
            title: "Prompt Enhanced",
            description: "Your prompt was enhanced for better results.",
            duration: 5000,
          })
        }
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
    setEnhancedPrompt('') // Reset enhanced prompt
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

  const handleImageClick = (url: string) => {
    setSelectedImage(url)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

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

  const getModalSizeClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'w-full max-w-xl h-full max-h-xl'
      case '4:3': return 'w-full max-w-2xl h-full max-h-[75vh]'
      case '3:4': return 'w-full max-w-lg h-full max-h-[133vh]'
      case '16:9': return 'w-full max-w-4xl h-full max-h-[56.25vh]'
      case '9:16': return 'w-full max-w-sm h-full max-h-[177.78vh]'
      default: return 'w-full max-w-xl h-full max-h-xl'
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

  return (
    <div className="flex items-start justify-center bg-gradient-to-br from-gray-900 to-purple-900 min-h-[calc(100vh-80px)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
      <div className="max-w-4xl w-full space-y-8 relative z-10 mt-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-300 mb-2">Image Generator</h1>
          <p className="text-sm text-purple-200 opacity-80">Powered by FLUX.1</p>
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
                  isLoading && "animate-pulse"
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Generating...' : 'Generate Image(s)'}
              </Button>
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
                      <img src={url} alt={`Generated ${index + 1}`} className="w-full h-full object-cover" />
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
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`relative ${getModalSizeClass(generatedAspectRatio)} m-4 flex items-center justify-center`}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Selected" className={`w-full h-full object-contain rounded-lg ${getAspectRatioClass(generatedAspectRatio)}`} />
              <Button
                className="absolute top-2 right-2"
                size="sm"
                variant="secondary"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}