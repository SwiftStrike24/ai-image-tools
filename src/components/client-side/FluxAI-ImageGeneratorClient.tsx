'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, X, Info, Loader2 } from "lucide-react"
import { generateFluxImage } from "@/actions/replicate/generateFluxImage"
import { enhancePrompt } from "@/actions/replicate/enhancePrompt"
import { enhancePromptGPT4oMini } from "@/actions/openai/enhancePrompt-gpt-4o-mini"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FluxImageParams, FluxImageResult, PromptHistoryEntry } from "@/types/imageTypes"
import RetroGrid from "@/components/magicui/retro-grid"
import ShinyButton from "@/components/magicui/shiny-button"
import { v4 as uuidv4 } from 'uuid'
import GlobalStyles from '@/styles/GlobalStyles'
import ImageModal from '@/components/ImageModal'
import ImageGrid from '@/components/ImageGrid'
import {
  getAspectRatioClass,
  aspectRatioOptions,
  simulateImageGeneration
} from '@/utils/imageUtils'
import { canGenerateImages, getGeneratorUsage, incrementGeneratorUsage } from "@/actions/rateLimit"
import { Progress } from "@/components/ui/progress"
import { GENERATOR_DAILY_LIMIT } from "@/constants/rateLimits"
import { SiMeta, SiOpenai } from "react-icons/si" // Import Meta and OpenAI icons from react-icons

export default function FluxAIImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
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
  const [isProcessingSeed, setIsProcessingSeed] = useState(false)
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([])
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1)
  const [focusedImageIndex, setFocusedImageIndex] = useState<number | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [followUpLevel, setFollowUpLevel] = useState(0)
  const [simulationId, setSimulationId] = useState(uuidv4())
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>([])
  const [currentSeed, setCurrentSeed] = useState<number | null>(null)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [resetsIn, setResetsIn] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [enhancementModel, setEnhancementModel] = useState<'meta-llama-3-8b-instruct' | 'gpt-4o-mini'>('meta-llama-3-8b-instruct')
  const [enhancedPromptHistory, setEnhancedPromptHistory] = useState<string[]>([])
  const [enhancementFallback, setEnhancementFallback] = useState<string | null>(null)

  useEffect(() => {
    if (!isSimulationMode) {
      getGeneratorUsage().then(({ usageCount, resetsIn }) => {
        setDailyUsage(usageCount);
        setResetsIn(resetsIn);
      }).catch((error) => {
        console.error(error);
        if (error.message === "User not authenticated") {
          setIsAuthenticated(false);
        }
      });
    }
  }, [isSimulationMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    let currentPrompt = showSeedInput ? followUpPrompt : prompt;
    const isFollowUp = showSeedInput && followUpPrompt?.trim();

    if (!currentPrompt?.trim()) {
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
      let enhancedPrompt = currentPrompt;
      let enhancementSuccessful = false;
      let usedEnhancementModel: 'meta-llama-3-8b-instruct' | 'gpt-4o-mini' | null = null;

      if (isEnhancePromptEnabled) {
        console.log(`Enhancing prompt using ${enhancementModel}...`);
        try {
          let enhancementResult;
          if (enhancementModel === 'meta-llama-3-8b-instruct') {
            enhancementResult = await enhancePrompt(currentPrompt);
          } else if (enhancementModel === 'gpt-4o-mini') {
            enhancementResult = { enhancedPrompt: await enhancePromptGPT4oMini(currentPrompt), usedModel: 'gpt-4o-mini' as const };
          }

          if (enhancementResult && enhancementResult.enhancedPrompt !== currentPrompt) {
            enhancedPrompt = enhancementResult.enhancedPrompt;
            enhancementSuccessful = true;
            usedEnhancementModel = enhancementResult.usedModel;
            setEnhancedPromptHistory(prev => [...prev, enhancedPrompt]);
            console.log("Prompt enhancement successful:", enhancedPrompt);

            if (enhancementSuccessful) {
              if (enhancementResult.usedModel === 'gpt-4o-mini' && enhancementModel === 'meta-llama-3-8b-instruct') {
                setEnhancementFallback("Meta-Llama 3 enhancement failed. GPT-4o-mini was used as a fallback.");
              } else {
                setEnhancementFallback(null);
                toast({
                  title: "Prompt Enhanced",
                  description: `Enhanced using ${enhancementResult.usedModel === 'meta-llama-3-8b-instruct' ? 'Meta-Llama 3' : 'GPT-4o-mini'}.`,
                  variant: "default",
                });
              }
            }
          } else {
            console.warn("Prompt enhancement didn't produce a different result. Using original prompt.");
            setEnhancementFallback(null);
            if (isEnhancePromptEnabled) {
              toast({
                title: "Prompt Not Enhanced",
                description: "The AI didn't significantly change your prompt. Using the original.",
                variant: "default",
              });
            }
          }
        } catch (enhanceError) {
          console.error("Error enhancing prompt:", enhanceError);
          setEnhancementFallback("Prompt enhancement failed. Using original prompt.");
        }
      } else {
        setEnhancementFallback(null);
      }

      // Check rate limits after enhancing prompt
      if (!isSimulationMode) {
        const { canProceed, usageCount, resetsIn } = await canGenerateImages(numOutputs);
        if (!canProceed) {
          const remainingGenerations = GENERATOR_DAILY_LIMIT - usageCount;
          setError(`You've reached your daily limit. You can generate ${remainingGenerations} more image${remainingGenerations !== 1 ? 's' : ''} today.`);
          toast({
            title: "Daily Limit Reached",
            description: `You can generate ${remainingGenerations} more image${remainingGenerations !== 1 ? 's' : ''} today. Please try again tomorrow or upgrade your plan.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      let finalPrompt = enhancementSuccessful ? enhancedPrompt : currentPrompt;
      console.log(`Final prompt ${enhancementSuccessful ? 'after enhancement' : 'without enhancement'}: ${finalPrompt}`);

      // Update originalPrompt and followUpPrompts
      if (isFollowUp) {
        setFollowUpPrompts(prev => [...prev, currentPrompt]);
        // **Remove seed from the prompt**
        finalPrompt = `${originalPrompt} ${enhancedPrompt}`;
      } else {
        setOriginalPrompt(currentPrompt);
        setFollowUpPrompts([]);
      }

      const params: FluxImageParams = {
        prompt: finalPrompt,
        aspect_ratio: aspectRatio,
        num_outputs: numOutputs,
        output_format: outputFormat,
        output_quality: outputQuality,
        enhance_prompt: enhancementSuccessful, // Only set to true if enhancement was successful
        disable_safety_checker: true,
        seed: currentSeed !== null ? currentSeed : undefined,
        followUpLevel: isFollowUp ? followUpLevel : 1,
      };

      console.log("Params sent to generateFluxImage:", params);

      const results: FluxImageResult[] = isSimulationMode 
        ? await simulateImageGeneration(params, followUpLevel, simulationId)
        : await generateFluxImage(params);

      console.log("Results received from generateFluxImage:", results);

      if (results.length > 0) {
        // Increment usage after successful image generation
        if (!isSimulationMode) {
          await incrementGeneratorUsage(numOutputs);
          setDailyUsage(prev => prev + numOutputs);
        }

        const newImageResults = results.map((result, index) => ({
          ...result,
          followUpLevel: isFollowUp ? followUpLevel : 1,
          index,
        }));

        const newSeed = newImageResults[0].seed;
        setCurrentSeed(newSeed);

        const newHistoryEntry: PromptHistoryEntry = { 
          prompt: currentPrompt, // Store only the user-added follow-up prompt
          images: newImageResults,
          followUpLevel: isFollowUp ? followUpLevel : 1,
          seed: newSeed,
        };
        
        setPromptHistory(prevHistory => {
          const newHistory = [...prevHistory.slice(0, followUpLevel - 1), newHistoryEntry];
          setCurrentPromptIndex(newHistory.length - 1);
          return newHistory;
        });

        setImageResults(newImageResults);
        setImageUrls(newImageResults.map(result => result.imageUrls[0]));
        setGeneratedAspectRatio(aspectRatio);
        setFocusedImageIndex(null);
        setIsFocused(false);
        setFollowUpLevel(prev => isFollowUp ? prev + 1 : 1);
        
        // Reset followUpPrompt but keep showSeedInput true for follow-ups
        setFollowUpPrompt('');
        setShowSeedInput(isFollowUp ? true : false);

        toast({
          title: isSimulationMode ? "Images Simulated" : "Images Generated",
          description: `Successfully ${isSimulationMode ? 'simulated' : 'generated'} ${newImageResults.length} image(s).`,
        });
      } else {
        throw new Error('No images were generated. Please try again.');
      }

      if (isSimulationMode) {
        setSimulationId(uuidv4());
      }
    } catch (error) {
      console.error('Image generation error:', error);
      // If rate limit was checked and usageCount was incremented, consider rolling back
      if (!isSimulationMode && typeof error !== 'string') {
        // Optionally implement rollback logic here if necessary
      }
      setError(error instanceof Error ? error.message : "Failed to generate image(s). Please try again.");
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error while generating your image(s).",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySeed = useCallback((seed: number, selectedImage: FluxImageResult, index: number) => {
    if (isProcessingSeed) return;
    setIsProcessingSeed(true);

    try {
      if (focusedImageIndex === index) {
        // This is the unfocus action
        setFocusedImageIndex(null);
        setIsFocused(false);
        
        if (followUpLevel === 1) {
          // Clear the seed and form only at level 1
          setCurrentSeed(null);
          setShowSeedInput(false);
          setFollowUpPrompt('');
          toast({
            title: "Seed Cleared",
            description: "The seed has been cleared. You can now generate new images or refocus.",
          });
        } else {
          // For level 2 and beyond, just update UI
          toast({
            title: "Focus Cleared",
            description: "Image unfocused. The seed and follow-up prompt remain unchanged.",
          });
        }
      } else {
        // Focus action
        setFocusedImageIndex(index);
        setIsFocused(true);
        
        if (followUpLevel === 1) {
          setCurrentSeed(seed);
          setShowSeedInput(true);
        }
        
        toast({
          title: "Image Focused",
          description: followUpLevel === 1 
            ? "You can now enter a follow-up prompt based on this image."
            : "Image focused. The seed and follow-up prompt remain unchanged.",
        });
      }
    } catch (error) {
      console.error("Error in handleCopySeed:", error);
      toast({
        title: "Error",
        description: "An error occurred while managing image focus. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsProcessingSeed(false), 500);
    }
  }, [isProcessingSeed, toast, focusedImageIndex, followUpLevel]);

  const clearFocusedImage = useCallback(() => {
    setFocusedImageIndex(null);
    setIsFocused(false);
    
    if (followUpLevel === 1) {
      setCurrentSeed(null);
      setShowSeedInput(false);
      setFollowUpPrompt('');
      toast({
        title: "Seed Cleared",
        description: "The seed has been cleared. You can now generate new images or refocus.",
      });
    } else {
      toast({
        title: "Focus Cleared",
        description: "Image unfocused. The seed and follow-up prompt remain unchanged.",
      });
    }
  }, [toast, followUpLevel]);

  const handleNewImage = useCallback(() => {
    setFollowUpPrompt(null);
    setCurrentSeed(null);
    setShowSeedInput(false);
    setImageUrls([]);
    setError(null);
    setResetKey(prev => prev + 1);
    setImageResults([]);
    setPrompt('');
    setPromptHistory([]);
    setCurrentPromptIndex(-1);
    setFocusedImageIndex(null);
    setIsFocused(false);
    setFollowUpLevel(0);
    setOriginalPrompt('');
    setFollowUpPrompts([]);
    toast({
      title: "Reset Complete",
      description: "Ready for a new image generation.",
    });
  }, [toast]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [error, toast]);

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

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= 1000) {
      if (showSeedInput) {
        setFollowUpPrompt(newValue);
      } else {
        setPrompt(newValue);
      }
      if (error) setError(null);
    } else {
      toast({
        title: "Prompt Too Long",
        description: "The prompt cannot exceed 1000 characters.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid line break
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const goToPreviousFollowUp = useCallback(() => {
    if (followUpLevel <= 1) return; // Don't go back if we're at the initial level

    const newLevel = followUpLevel - 1;
    const previousEntry = promptHistory[newLevel - 1]; // Get the previous entry

    if (!previousEntry) {
      console.error("Entry not found in prompt history");
      return;
    }

    setFollowUpLevel(newLevel);
    setImageResults(previousEntry.images);
    setImageUrls(previousEntry.images.map(result => result.imageUrls[0]));
    setCurrentSeed(previousEntry.seed);

    // Keep the original prompt unchanged
    // Update follow-up prompts
    setFollowUpPrompts(prevFollowUps => prevFollowUps.slice(0, newLevel - 1));

    // Set only the user-added follow-up prompt
    setFollowUpPrompt(previousEntry.prompt);

    setShowSeedInput(true);
    
    // Trim the prompt history to the current level
    setPromptHistory(prevHistory => prevHistory.slice(0, newLevel));
    setCurrentPromptIndex(newLevel - 1);
    setFocusedImageIndex(null);
    setIsFocused(false);

    toast({
      title: "Previous Follow-up Loaded",
      description: `Returned to Follow-up Level: ${newLevel}`,
    });
  }, [followUpLevel, promptHistory, toast]);

  const handleEnhancePromptToggle = (checked: boolean) => {
    setIsEnhancePromptEnabled(checked);
    if (checked) {
      setEnhancementModel('meta-llama-3-8b-instruct'); // Set default to meta-llama when enabling
    }
  };

  const handleModelSelection = (model: 'meta-llama-3-8b-instruct' | 'gpt-4o-mini') => {
    setEnhancementModel(model);
    setIsEnhancePromptEnabled(true);
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      <GlobalStyles />
      <RetroGrid className="absolute inset-0 z-0 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-purple-900/50 to-gray-900/90 z-10" />
      <div className="relative z-20 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Daily Usage Display - Moved to the top */}
          <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Daily Usage (Free Plan)</span>
              {isSimulationMode ? (
                <span className="text-sm font-medium">Simulation Mode</span>
              ) : (
                <span className="text-sm font-medium">{dailyUsage} / {GENERATOR_DAILY_LIMIT}</span>
              )}
            </div>
            {!isSimulationMode && (
              <>
                <Progress value={(dailyUsage / GENERATOR_DAILY_LIMIT) * 100} className="h-2" />
                <p className="text-xs text-purple-300">
                  {GENERATOR_DAILY_LIMIT - dailyUsage} generations remaining today. Resets in {resetsIn}.
                </p>
              </>
            )}
            {isSimulationMode && (
              <p className="text-xs text-purple-300">
                Simulation mode active. No API calls are being made.
              </p>
            )}
          </div>

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
                      Follow-up Level: {followUpLevel}
                      <br />
                      Original prompt: {originalPrompt}
                      {followUpPrompts.length > 0 && (
                        <>
                          <br />
                          Follow-up prompts: {followUpPrompts.join(', ')}
                        </>
                      )}
                      {followUpLevel >= 1 && (
                        <>
                          <br />
                          Seed: {currentSeed}
                        </>
                      )}
                    </div>
                  )}
                  <Input
                    id="prompt"
                    value={showSeedInput ? followUpPrompt || '' : prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
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

                {/* Enhance Prompt Section with Model Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enhance-prompt"
                      checked={isEnhancePromptEnabled}
                      onCheckedChange={handleEnhancePromptToggle}
                    />
                    <Label htmlFor="enhance-prompt" className="text-white">Enhance Prompt</Label>

                    {/* Model Selection Buttons */}
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleModelSelection('meta-llama-3-8b-instruct')}
                              className={`p-2 rounded ${enhancementModel === 'meta-llama-3-8b-instruct' && isEnhancePromptEnabled ? 'bg-purple-600' : 'bg-gray-700'}`}
                              aria-label="Meta-Llama Model"
                            >
                              <SiMeta className="w-4 h-4 text-white" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-purple-900 text-white border-purple-500">
                            <p>Use Meta-Llama 3 (8B) for prompt enhancement</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleModelSelection('gpt-4o-mini')}
                              className={`p-2 rounded ${enhancementModel === 'gpt-4o-mini' && isEnhancePromptEnabled ? 'bg-purple-600' : 'bg-gray-700'}`}
                              aria-label="GPT-4o-mini Model"
                            >
                              <SiOpenai className="w-4 h-4 text-white" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-purple-900 text-white border-purple-500">
                            <p>Use GPT-4o-mini (OpenAI) for prompt enhancement</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-purple-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-purple-900 text-white border-purple-500">
                          <p>Use AI to enhance your prompt for better results. Meta-Llama is the default.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {enhancementFallback && (
                    <p className="text-red-500 text-sm mt-1">{enhancementFallback}</p>
                  )}
                </div>

                <ShinyButton
                  onClick={handleSubmit}
                  disabled={isLoading || (!showSeedInput && !prompt.trim()) || (showSeedInput && !followUpPrompt?.trim()) || dailyUsage >= GENERATOR_DAILY_LIMIT}
                  className={cn(
                    "w-full py-2 md:py-3 text-base md:text-lg font-semibold",
                    (isLoading || (!showSeedInput && !prompt.trim()) || (showSeedInput && !followUpPrompt?.trim()) || dailyUsage >= GENERATOR_DAILY_LIMIT) && "opacity-50 cursor-not-allowed"
                  )}
                  text={
                    isLoading 
                      ? "Generating..." 
                      : dailyUsage >= GENERATOR_DAILY_LIMIT 
                        ? "Daily Limit Reached" 
                        : 'Generate Image(s)'
                  }
                />
                {dailyUsage >= GENERATOR_DAILY_LIMIT && (
                  <p className="text-xs text-red-400 mt-2">
                    You&apos;ve reached your daily limit. Please try again tomorrow or upgrade your plan.
                  </p>
                )}
              </form>
            </div>

            {/* Generated Images Display */}
            <div className="space-y-4">
              {promptHistory.length > 0 && (
                <ImageGrid
                  imageResults={imageResults}
                  generatedAspectRatio={generatedAspectRatio}
                  isFocused={isFocused}
                  focusedImageIndex={focusedImageIndex}
                  handleImageClick={handleImageClick}
                  handleCopySeed={handleCopySeed}
                  handleDownload={handleDownload}
                  isSimulationMode={isSimulationMode}
                  downloadingIndex={downloadingIndex}
                  showSeedInput={showSeedInput}
                />
              )}
              {isFocused && (
                <ShinyButton
                  onClick={clearFocusedImage}
                  className="w-full py-2 md:py-3 text-base md:text-lg font-semibold"
                  text="Clear Focus"
                />
              )}
              {followUpLevel > 1 && (
                <ShinyButton
                  onClick={goToPreviousFollowUp}
                  className="w-full py-2 md:py-3 text-base md:text-lg font-semibold mt-2"
                  text={`Go to Previous Follow-up (Level ${followUpLevel - 1})`}
                />
              )}
              {promptHistory.length > 0 && (
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

      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeModal}
        imageUrl={selectedImage}
        aspectRatio={generatedAspectRatio}
      />
    </div>
  )
}
