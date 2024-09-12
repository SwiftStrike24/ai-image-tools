// This file contains both browser-specific and non-browser-specific utilities

// Type definition for ImageUtilsType
export type ImageUtilsType = {
  convertHeicToJpeg: (file: File) => Promise<File>;
  compressImage: (file: File, maxWidth: number, quality: number) => Promise<File>;
  createObjectURL: (file: File) => string;
  revokeObjectURL: (url: string) => void;
};

// Dummy implementation of ImageUtilsType for environments without browser APIs
export const dummyImageUtils: ImageUtilsType = {
  convertHeicToJpeg: async (file: File) => file,
  compressImage: async (file: File) => file,
  createObjectURL: () => '',
  revokeObjectURL: () => {},
};

// Resizes an image file to fit within a specified maximum dimension
export async function resizeImage(file: File, maxDimension: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(resizedFile);
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, 'image/jpeg', 0.95);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// New utility functions from refactoring instructions
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
  params: any, // Replace 'any' with the correct type for params
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