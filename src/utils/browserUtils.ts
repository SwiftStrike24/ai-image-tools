import heic2any from 'heic2any';

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8,
      }) as Blob;
      return new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      return file;
    }
  }
  return file;
};

export const compressImage = async (file: File, maxWidth: number, quality: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = (error) => reject(error);
    img.src = URL.createObjectURL(file);
  });
};

export const createObjectURL = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};