'use client'

import { useState, useCallback, useRef } from 'react'
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
import { FluxImageParams, FluxImageResult } from "@/types/imageTypes"
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
  const [resetKey, setResetKey] = useState(0)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const [imageResults, setImageResults] = useState<FluxImageResult[]>([])
  const [copiedSeed, setCopiedSeed] = useState<number | null>(null)
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null)
  const [showSeedInput, setShowSeedInput] = useState(false)
  const [originalPrompt, setOriginalPrompt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentPrompt = showSeedInput ? `${originalPrompt}, ${followUpPrompt}` : prompt;
    if (!currentPrompt.trim()) {
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
      let finalPrompt = currentPrompt;

      if (isEnhancePromptEnabled) {
        const enhancedPromptResult = await enhancePrompt(currentPrompt);
        finalPrompt = enhancedPromptResult !== currentPrompt ? enhancedPromptResult : currentPrompt;
        toast({
          title: enhancedPromptResult !== currentPrompt ? "Prompt Enhanced" : "Prompt Enhancement Skipped",
          description: enhancedPromptResult !== currentPrompt 
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
        seed: copiedSeed !== null ? copiedSeed : undefined,
      };

      console.log("Params sent to generateFluxImage:", params);

      const results = isSimulationMode 
        ? await simulateImageGeneration(params)
        : await generateFluxImage(params);

      console.log("Results received from generateFluxImage:", results);

      if (Array.isArray(results) && results.length > 0) {
        const newImageResults = results.flatMap((result: FluxImageResult) => 
          result.imageUrls.map(url => ({
            imageUrl: url,
            seed: result.seed,
            prompt: result.prompt,
          }))
        );

        setImageResults(prevResults => [
          ...prevResults,
          ...newImageResults.map(result => ({
            imageUrls: [result.imageUrl],
            seed: result.seed,
            prompt: result.prompt,
          }))
        ]);
        setImageUrls(prevUrls => [...prevUrls, ...newImageResults.map(result => result.imageUrl)]);
        setShowGlow(true);
        setGeneratedAspectRatio(aspectRatio);

        toast({
          title: isSimulationMode ? "Images Simulated" : "Images Generated",
          description: `Successfully ${isSimulationMode ? 'simulated' : 'generated'} ${newImageResults.length} image(s).`,
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

  const handleCopySeed = useCallback((seed: number) => {
    setCopiedSeed(seed);
    setShowSeedInput(true);
    if (!showSeedInput) {
      setOriginalPrompt(prompt);
    } else {
      setOriginalPrompt(prevOriginal => `${prevOriginal}, ${followUpPrompt}`);
    }
    setFollowUpPrompt('');
    
    toast({
      title: "Seed Set",
      description: `Seed ${seed} has been set for the next generation. You can now enter a follow-up prompt.`,
    });
  }, [prompt, followUpPrompt, showSeedInput, toast]);

  const clearSeed = useCallback(() => {
    setCopiedSeed(null);
    setShowSeedInput(false);
    setFollowUpPrompt(null);
    setPrompt(originalPrompt);
    setOriginalPrompt('');
    toast({
      title: "Seed Cleared",
      description: "The seed has been cleared, and you're back to the original prompt.",
    });
  }, [originalPrompt, toast]);

  const handleNewImage = useCallback(() => {
    setFollowUpPrompt(null);
    setCopiedSeed(null);
    setShowSeedInput(false);
    setImageUrls([]);
    setError(null);
    setResetKey(prev => prev + 1);
    setImageResults([]);
    // Keep the prompt
    toast({
      title: "Reset Complete",
      description: "Ready for a new image generation while keeping your current prompt.",
    });
  }, [toast]);

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
    return {
      imageUrls: Array(params.num_outputs).fill(defaultImageUrl),
      seed: Math.floor(Math.random() * 1000000)
    };
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
    } else {
      toast({
        title: "Prompt Too Long",
        description: "The prompt cannot exceed 1000 characters.",
        variant: "destructive",
      });
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
                  <Label htmlFor="prompt" className="text-white">
                    {showSeedInput ? "Follow-up Prompt" : "Prompt"}
                  </Label>
                  {showSeedInput && (
                    <div className="text-sm text-gray-400 mb-2">
                      Original prompt: {originalPrompt}
                    </div>
                  )}
                  <Input
                    id="prompt"
                    value={showSeedInput ? followUpPrompt || '' : prompt}
                    onChange={showSeedInput ? 
                      (e) => setFollowUpPrompt(e.target.value) : 
                      handlePromptChange
                    }
                    placeholder={showSeedInput ? 
                      "Enter additional details for your follow-up prompt..." : 
                      "Enter your image prompt here..."
                    }
                    className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 transition-colors duration-200"
                    maxLength={1000}
                    resetKey={resetKey}
                    ref={promptInputRef}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {(showSeedInput ? followUpPrompt?.length || 0 : prompt.length)}/1000
                  </div>
                </div>
                {showSeedInput && (
                  <div className="space-y-2">
                    <Label htmlFor="seed-input" className="text-white">
                      Seed
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="seed-input"
                        value={copiedSeed?.toString() || ''}
                        onChange={(e) => setCopiedSeed(parseInt(e.target.value))}
                        className="bg-gray-800 text-white border-gray-700 focus:border-purple-500 transition-colors duration-200"
                        readOnly
                      />
                      <Button
                        type="button"
                        onClick={clearSeed}
                        variant="secondary"
                        className="px-2 py-1"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear seed</span>
                      </Button>
                    </div>
                  </div>
                )}
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
                {imageResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(imageResults.length, 2)}, 1fr)`,
                    }}
                  >
                    {imageResults.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`relative ${getAspectRatioClass(generatedAspectRatio)} rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center cursor-pointer group`}
                        onClick={() => handleImageClick(result.imageUrls[0])}
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
                          src={result.imageUrls[0]}
                          alt={`Generated ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                          unoptimized={isSimulationMode}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
                        <ShinyButton
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDownload(result.imageUrls[0], index);
                          }}
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
                          disabled={downloadingIndex === index}
                          text={downloadingIndex === index ? "..." : "Download"}
                        />
                        <ShinyButton
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleCopySeed(result.seed);
                          }}
                          className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
                          text="Use Seed"
                        />
                      </motion.div>
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