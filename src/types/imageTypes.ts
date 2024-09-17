export interface FluxImageParams {
  prompt: string;
  aspect_ratio: string;
  num_outputs: number;
  output_format: string;
  output_quality: number;
  enhance_prompt: boolean;
  disable_safety_checker: boolean;
  seed?: number;
  followUpLevel: number;
}

export interface FluxImageResult {
  imageUrls: string[];
  seed: number;
  prompt: string;
  followUpLevel: number;
  index: number;
}

export interface PromptHistoryEntry {
  prompt: string;
  images: FluxImageResult[];
  followUpLevel: number;
  seed: number;
}