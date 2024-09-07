// This file now contains only type definitions and non-browser-specific utilities

export type ImageUtilsType = {
  convertHeicToJpeg: (file: File) => Promise<File>;
  compressImage: (file: File, maxWidth: number, quality: number) => Promise<File>;
  createObjectURL: (file: File) => string;
  revokeObjectURL: (url: string) => void;
};

export const dummyImageUtils: ImageUtilsType = {
  convertHeicToJpeg: async (file: File) => file,
  compressImage: async (file: File) => file,
  createObjectURL: () => '',
  revokeObjectURL: () => {},
};