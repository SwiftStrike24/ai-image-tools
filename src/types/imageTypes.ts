export interface FluxImageParams {
  prompt: string;
  aspect_ratio: string;
  num_outputs: number;
  output_format: string;
  output_quality: number;
  disable_safety_checker: boolean;
  enhance_prompt: boolean;
  seed?: number;
}

export interface FluxImageResult {
  imageUrls: string[];
  seed: number;
  prompt: string;
  followUpLevel: number;
}

export interface PromptHistoryEntry {
  prompt: string;
  images: FluxImageResult[];
  followUpLevel: number;
  seed: number;
}