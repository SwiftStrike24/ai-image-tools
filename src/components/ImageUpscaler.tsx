"use client";

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'

export default function ImageUpscaler() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [upscaleOption, setUpscaleOption] = useState('2x')
  const [isLoading, setIsLoading] = useState(false)
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleUpscale = () => {
    setIsLoading(true)
    // Simulating upscale process
    setTimeout(() => {
      setUpscaledImage(uploadedImage) // In a real scenario, this would be the upscaled image
      setIsLoading(false)
    }, 2000)
  }

  const upscaleOptions = ['2x', '4x', '6x', '8x', '10x']

  return (
    <div className="flex items-start justify-center bg-gray-900 min-h-[calc(100vh-80px)] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
      <div className="max-w-4xl w-full space-y-8 relative z-10 mt-8">
        <h1 className="text-3xl font-bold text-center text-purple-400 mb-8">Image Upscaler</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-purple-500 rounded-lg p-8 text-center cursor-pointer hover:bg-purple-900/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="mx-auto h-12 w-12 text-purple-400 mb-4" />
              <p className="text-white">Drag and drop an image here, or click to select</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
                aria-label="Upload image"
              />
            </div>
            {uploadedImage && (
              <div className="aspect-square rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center">
                <img src={uploadedImage} alt="Uploaded" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {upscaleOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setUpscaleOption(option)}
                  className={`py-2 px-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    upscaleOption === option
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={handleUpscale}
              disabled={!uploadedImage || isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 rounded-lg py-2 px-4 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-gray-900 text-white"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                'Upscale'
              )}
            </button>
            {upscaledImage && (
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-purple-900/30 flex items-center justify-center">
                  <img src={upscaledImage} alt="Upscaled" className="max-w-full max-h-full object-contain" />
                </div>
                <a
                  href={upscaledImage}
                  download="upscaled_image.jpg"
                  className="block w-full bg-purple-600 hover:bg-purple-700 rounded-lg py-2 px-4 font-semibold text-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 focus:ring-offset-gray-900 text-white"
                >
                  Download Upscaled Image
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}