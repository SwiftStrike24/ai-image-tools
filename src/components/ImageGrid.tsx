import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import ShinyButton from '@/components/magicui/shiny-button';
import { getAspectRatioClass } from '@/utils/imageUtils';
import { FluxImageResult } from '@/types/imageTypes';

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
  showSeedInput: boolean;
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
  showSeedInput,
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
      {imageResults.map((result, arrayIndex) => (
        <motion.div
          key={`${result.seed}-${result.index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: !isFocused || focusedImageIndex === result.index ? 1 : 0.3,
            y: 0,
            scale: focusedImageIndex === result.index ? 1.05 : 1,
          }}
          transition={{ duration: 0.5, delay: arrayIndex * 0.1 }}
          className={cn(
            `relative ${getAspectRatioClass(
              generatedAspectRatio
            )} rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center cursor-pointer group`,
            isFocused && focusedImageIndex !== result.index && 'pointer-events-none'
          )}
          onClick={() => handleImageClick(result.imageUrls[0])}
        >
          <Image
            src={result.imageUrls[0]}
            alt={`Generated ${arrayIndex + 1}`}
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
                handleCopySeed(result.seed, result, result.index);
              }}
              className="text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
              text={focusedImageIndex === result.index ? "Focused" : "Focus"}
            />
          </div>
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ShinyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDownload(result.imageUrls[0], result.index);
              }}
              className="text-xs md:text-sm py-1 px-2 md:py-2 md:px-3"
              disabled={downloadingIndex === result.index}
            >
              {downloadingIndex === result.index ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </ShinyButton>
          </div>
          {result.followUpLevel > 1 && (
            <div className="absolute top-2 left-2 bg-purple-900/70 text-white text-xs px-2 py-1 rounded">
              Follow-up (Level: {result.followUpLevel})
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ImageGrid;