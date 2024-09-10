// This file now contains only type definitions and non-browser-specific utilities

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