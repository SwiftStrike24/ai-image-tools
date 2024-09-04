'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Download, RefreshCw, Sparkles } from "lucide-react"
import { generateFluxImage } from "@/actions/replicate-actions"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export default function FluxAIImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showGlow, setShowGlow] = useState(false)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [numOutputs, setNumOutputs] = useState(1)
  const [outputFormat, setOutputFormat] = useState("webp")
  const [outputQuality, setOutputQuality] = useState(80)
  const [enhancePrompt, setEnhancePrompt] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await generateFluxImage({
        prompt,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        output_format: outputFormat,
        output_quality: outputQuality,
        enhance_prompt: enhancePrompt,
        disable_safety_checker: true,
      })
      if (typeof result === 'string') {
        setImageUrl(result)
        setShowGlow(true)
        toast({
          title: "Image Generated",
          description: "Your image has been successfully generated.",
        })
      } else {
        throw new Error('Unexpected response from generate API')
      }
    } catch (error) {
      console.error('Image generation error:', error)
      setError(error instanceof Error ? error.message : "Failed to generate image. Please try again.")
      toast({
        title: "Generation Failed",
        description: "There was an error while generating your image.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewImage = useCallback(() => {
    setPrompt('')
    setImageUrl('')
    setError(null)
  }, [])

  const handleDownload = useCallback(() => {
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `generated-image.${outputFormat}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [imageUrl, outputFormat])

  return (
    <div className="flex items-start justify-center bg-gradient-to-br from-gray-900 to-purple-900 min-h-[calc(100vh-80px)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
      <div className="max-w-4xl w-full space-y-8 relative z-10 mt-8">
        <h1 className="text-4xl font-bold text-center text-purple-300 mb-8">FluxAI Image Generator</h1>
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
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Number of Outputs</Label>
                <RadioGroup value={numOutputs.toString()} onValueChange={(value) => setNumOutputs(parseInt(value))} className="flex space-x-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem value={num.toString()} id={`num-outputs-${num}`} />
                      <Label htmlFor={`num-outputs-${num}`} className="text-white">{num}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Output Format</Label>
                <RadioGroup value={outputFormat} onValueChange={setOutputFormat} className="flex space-x-2">
                  {['webp', 'jpeg', 'png'].map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <RadioGroupItem value={format} id={`output-format-${format}`} />
                      <Label htmlFor={`output-format-${format}`} className="text-white">{format.toUpperCase()}</Label>
                    </div>
                  ))}
                </RadioGroup>
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
                  checked={enhancePrompt}
                  onCheckedChange={setEnhancePrompt}
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
                {isLoading ? 'Generating...' : 'Generate Image'}
              </Button>
            </form>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {imageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center"
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
                  <img src={imageUrl} alt="Generated" className="max-w-full max-h-full object-contain" />
                </motion.div>
              )}
            </AnimatePresence>
            {imageUrl && (
              <div className="flex space-x-4">
                <Button
                  onClick={handleNewImage}
                  className="flex-1"
                  variant="secondary"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Image
                </Button>
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                  disabled={!imageUrl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}