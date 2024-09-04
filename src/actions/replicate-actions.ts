"use server";

import replicate from "@/lib/replicate";

export async function generateFluxImage(prompt: string) {
  const input = {
    prompt: prompt,
    num_outputs: 1,
    aspect_ratio: "1:1",
    output_format: "webp",
    output_quality: 80
  };

  const output = await replicate.run("black-forest-labs/flux-schnell", { input });
  return output;
}

export async function upscaleImage(imageData: string, upscaleFactor: number, faceEnhance: boolean) {
  const input = {
    image: imageData,
    scale: upscaleFactor,
    face_enhance: faceEnhance
  };

  const output = await replicate.run("nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa", { input });
  return output;
}