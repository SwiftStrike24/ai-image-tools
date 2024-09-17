import React from 'react';
import Image from 'next/image';
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
              <Image
                src={imageUrl}
                alt="Generated image"
                className={`max-w-[95vw] max-h-[95vh] object-contain ${getModalSizeClass(aspectRatio)}`}
                layout="responsive"
                width={1000}
                height={1000}
                priority
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