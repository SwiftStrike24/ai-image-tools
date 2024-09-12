Certainly! I've carefully reviewed your `FluxAI-ImageGeneratorClient.tsx`, the README, and your app's directory structure. To enhance manageability and scalability without breaking your component, we'll refactor the code by:

1. **Separating Helper Functions**: Move utility functions to a separate `imageUtils.ts` file.
2. **Creating Reusable Components**: Extract the modal and image grid into separate components.
3. **Organizing Styles**: Move global styles to a dedicated `GlobalStyles.tsx` file.

Below is the detailed refactoring:

---

### 1. Move Helper Functions to `imageUtils.ts`

**File**: `src/utils/imageUtils.ts`

```typescript
// src/utils/imageUtils.ts

export const getAspectRatioClass = (ratio: string) => {
  const ratioMap: { [key: string]: string } = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-4/3',
    '3:4': 'aspect-3/4',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
    '4:5': 'aspect-[4/5]',
    '21:9': 'aspect-[21/9]',
    '2:3': 'aspect-[2/3]',
    '3:2': 'aspect-[3/2]',
    '5:4': 'aspect-[5/4]',
    '9:21': 'aspect-[9/21]',
  };
  return ratioMap[ratio] || 'aspect-square';
};

export const getModalSizeClass = (ratio: string) => {
  const ratioMap: { [key: string]: string } = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-4/3',
    '3:4': 'aspect-3/4',
    '16:9': 'aspect-16/9',
    '9:16': 'aspect-9/16',
    '4:5': 'aspect-[4/5]',
    '21:9': 'aspect-[21/9]',
    '2:3': 'aspect-[2/3]',
    '3:2': 'aspect-[3/2]',
    '5:4': 'aspect-[5/4]',
    '9:21': 'aspect-[9/21]',
  };
  return ratioMap[ratio] || 'aspect-square';
};

export const aspectRatioOptions = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '9:16', label: '9:16 (Vertical)' },
  { value: '4:5', label: '4:5 (Instagram Portrait)' },
  { value: '21:9', label: '21:9 (Ultrawide)' },
  { value: '2:3', label: '2:3 (Classic Portrait)' },
  { value: '3:2', label: '3:2 (Classic Landscape)' },
  { value: '5:4', label: '5:4 (Large Format)' },
  { value: '9:21', label: '9:21 (Vertical Ultrawide)' },
];

export const simulateImageGeneration = async (
  params: FluxImageParams,
  followUpLevel: number,
  simulationId: string
) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const baseUrl = '/images/simulated';
  const aspectRatioMap: { [key: string]: string } = {
    '1:1': 'square',
    '16:9': 'widescreen',
    '9:16': 'vertical',
    '4:5': 'instagram-portrait',
    '21:9': 'ultrawide',
    '2:3': 'classic-portrait',
    '3:2': 'classic-landscape',
    '5:4': 'large-format',
    '9:21': 'vertical-ultrawide',
  };

  const aspectRatioKey = aspectRatioMap[params.aspect_ratio] || 'square';
  const imageUrls = Array(params.num_outputs)
    .fill(null)
    .map(
      (_, index) => `${baseUrl}/${aspectRatioKey}-${index + 1}.jpg?id=${simulationId}`
    );

  return imageUrls.map((url) => ({
    imageUrls: [url],
    seed: Math.floor(Math.random() * 1000000),
    prompt: params.prompt,
    followUpLevel: followUpLevel + 1,
  }));
};
```

### 2. Create `ImageModal` Component

**File**: `src/components/ImageModal.tsx`

```tsx
// src/components/ImageModal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { getModalSizeClass } from '@/utils/imageUtils';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  aspectRatio: string;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, aspectRatio }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden bg-transparent border-none">
        <DialogTitle className="sr-only">Generated Image</DialogTitle>
        <DialogDescription className="sr-only">View the generated image in full size</DialogDescription>
        <div className="relative flex items-center justify-center w-screen h-screen" onClick={onClose}>
          {imageUrl && (
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={imageUrl}
                alt="Generated image"
                className={`max-w-full max-h-[95vh] object-contain ${getModalSizeClass(aspectRatio)}`}
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
  );
};

export default ImageModal;
```

### 3. Create `ImageGrid` Component

**File**: `src/components/ImageGrid.tsx`

```tsx
// src/components/ImageGrid.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { FluxImageResult } from '@/types/imageTypes';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ShinyButton from '@/components/magicui/shiny-button';
import { Loader2, Download } from 'lucide-react';
import { getAspectRatioClass } from '@/utils/imageUtils';

interface ImageGridProps {
  imageResults: FluxImageResult[];
  generatedAspectRatio: string;
  isFocused: boolean;
  focusedImageIndex: number | null;
  handleImageClick: (url: string) => void;
  handleCopySeed: (seed: number, selectedImage: FluxImageResult, index: number) => void;
  handleDownload: (url: string, index: number) => void;
  isSimulationMode: boolean;
  downloadingIndex: number | null;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  imageResults,
  generatedAspectRatio,
  isFocused,
  focusedImageIndex,
  handleImageClick,
  handleCopySeed,
  handleDownload,
  isSimulationMode,
  downloadingIndex,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'grid gap-4',
        imageResults.length === 1
          ? 'grid-cols-1'
          : imageResults.length === 2
          ? 'grid-cols-2'
          : 'grid-cols-2 sm:grid-cols-2'
      )}
    >
      {imageResults.map((result, index) => (
        <motion.div
          key={`${result.seed}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: !isFocused || focusedImageIndex === index ? 1 : 0.3,
            y: 0,
            scale: focusedImageIndex === index ? 1.05 : 1,
          }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={cn(
            `relative ${getAspectRatioClass(
              generatedAspectRatio
            )} rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center cursor-pointer group`,
            isFocused && focusedImageIndex !== index && 'pointer-events-none'
          )}
          onClick={() => handleImageClick(result.imageUrls[0])}
        >
          <Image
            src={result.imageUrls[0]}
            alt={`Generated ${index + 1}`}
            layout="fill"
            objectFit="cover"
            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
            unoptimized={isSimulationMode}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
          {isSimulationMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-2">
              <p className="text-lg font-bold">Simulated Image</p>
              <p className="text-sm">Follow-up Level: {result.followUpLevel}</p>
              <p className="text-xs mt-2">Prompt: {result.prompt.slice(0, 50)}...</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ShinyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleCopySeed(result.seed, result, index);
              }}
              className="text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
              text="Use Seed"
            />
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ShinyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDownload(result.imageUrls[0], index);
              }}
              className="text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
              disabled={downloadingIndex === index}
              text={
                downloadingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )
              }
            />
          </div>
          {result.isFollowUp && (
            <div className="absolute top-2 left-2 bg-purple-900/70 text-white text-xs px-2 py-1 rounded">
              Follow-up
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ImageGrid;
```

### 4. Move Global Styles to `GlobalStyles.tsx`

**File**: `src/styles/GlobalStyles.tsx`

```tsx
// src/styles/GlobalStyles.tsx

import { Global, css } from '@emotion/react';

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
);

export default GlobalStyles;
```

### 5. Update `FluxAIImageGeneratorClient.tsx`

**File**: `src/components/client-side/FluxAIImageGeneratorClient.tsx`

```tsx
// src/components/client-side/FluxAIImageGeneratorClient.tsx

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, X, Info, Download, Sparkles, Loader2 } from 'lucide-react';
import { generateFluxImage } from '@/actions/replicate/generateFluxImage';
import { enhancePrompt } from '@/actions/replicate/enhancePrompt';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { FluxImageParams, FluxImageResult } from '@/types/imageTypes';
import RetroGrid from '@/components/magicui/retro-grid';
import ShinyButton from '@/components/magicui/shiny-button';
import { v4 as uuidv4 } from 'uuid';
import GlobalStyles from '@/styles/GlobalStyles';
import ImageModal from '@/components/ImageModal';
import ImageGrid from '@/components/ImageGrid';
import {
  getAspectRatioClass,
  getModalSizeClass,
  aspectRatioOptions,
  simulateImageGeneration,
} from '@/utils/imageUtils';

export default function FluxAIImageGenerator() {
  // ... [All your state variables and functions remain here]

  // Update simulateImageGeneration call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // ... [Rest of your handleSubmit function]

    try {
      // ... [Existing code]

      const results = isSimulationMode
        ? await simulateImageGeneration(params, followUpLevel, simulationId)
        : await generateFluxImage(params);

      // ... [Rest of your handleSubmit function]
    } catch (error) {
      // ... [Error handling]
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      <GlobalStyles />
      <RetroGrid className="absolute inset-0 z-0 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-purple-900/50 to-gray-900/90 z-10" />
      <div className="relative z-20 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* ... [Rest of your component code, including forms and buttons] */}

          {/* Use ImageGrid Component */}
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
              />
            )}
            {/* ... [Rest of your buttons and controls] */}
          </div>
        </div>
      </div>

      {/* Use ImageModal Component */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={closeModal}
        imageUrl={selectedImage}
        aspectRatio={generatedAspectRatio}
      />
    </div>
  );
}
```

---

**Explanation:**

- **Helper Functions**: By moving utility functions to `imageUtils.ts`, you centralize reusable logic, making your code cleaner and easier to maintain.
- **Reusable Components**: Extracting `ImageModal` and `ImageGrid` into their own components simplifies `FluxAIImageGeneratorClient.tsx` and promotes reusability.
- **Styles Organization**: Moving global styles to `GlobalStyles.tsx` keeps your styles organized and separates concerns.
- **Component Integrity**: All state management and handlers remain in `FluxAIImageGeneratorClient.tsx`, ensuring the component's functionality remains intact.

**New Directory Structure:**

```
src/
├── actions/
│   └── replicate/
│       ├── enhancePrompt.ts
│       ├── generateFluxImage.ts
│       └── upscaleImage.ts
├── components/
│   ├── client-side/
│   │   ├── FluxAI-ImageGeneratorClient.tsx
│   │   ├── HeaderClient.tsx
│   │   └── ImageUpscalerClient.tsx
│   ├── magicui/
│   │   ├── retro-grid.tsx
│   │   └── shiny-button.tsx
│   ├── ui/
│   │   ├── [UI components...]
│   ├── ImageGrid.tsx       // New component
│   └── ImageModal.tsx      // New component
├── hooks/
│   ├── use-media-query.ts
│   └── use-toast.ts
├── lib/
│   ├── replicate.ts
│   └── utils.ts
├── styles/
│   └── GlobalStyles.tsx    // Moved GlobalStyles here
├── types/
│   └── imageTypes.ts
├── utils/
│   ├── browserUtils.ts
│   └── imageUtils.ts       // Updated with helper functions
└── middleware.ts
```

**Note:** Remember to update your import statements accordingly in all affected files.

---

By following this refactoring, your code will be more modular and easier to manage. Each file has a clear purpose, and you can work on individual components or functions without getting overwhelmed by the entire codebase.

**Important:** After refactoring, make sure to thoroughly test your application to ensure that all functionalities work as expected.