import heic2any from 'heic2any';

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      return new File([jpegBlob as Blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Failed to convert HEIC image. Please try a different image format.');
    }
  }
  return file;
}

export function createObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}