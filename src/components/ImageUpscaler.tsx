'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpCircle, Image as ImageIcon, Upload } from 'lucide-react'

export default function ImageUpscaler() {
  const [image, setImage] = useState<string | null>(null)
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null)
  const [scale, setScale] = useState<string>('2x')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("File is too large. Please upload an image smaller than 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } })

  const handleUpscale = () => {
    // Simulating upscale process
    setTimeout(() => {
      setUpscaledImage(image)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Image Upscaler</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-lg p-8 mb-6 transition-all ${
                isDragActive
                  ? 'border-purple-300 bg-purple-900/20'
                  : 'border-purple-500 hover:border-purple-300 hover:bg-purple-900/10'
              }`}
            >
              <input {...getInputProps()} className="sr-only" />
              <div className="flex flex-col items-center">
                <ImageIcon className="h-12 w-12 text-purple-500 mb-4" />
                <p className="text-lg mb-2">Drag & drop an image here</p>
                <p className="text-sm text-gray-400 mb-4">Supports: JPG, PNG, WebP (max 5MB)</p>
                <button
                  type="button"
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center self-start ml-auto mr-auto mr-[20px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Image
                </button>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Upscaling Options</h2>
              <div className="flex space-x-4">
                {['2x', '4x', '6x', '8x', '10x',].map((option) => (
                  <button
                    key={option}
                    onClick={() => setScale(option)}
                    className={`flex-1 py-3 rounded-md transition-all duration-300 ${
                      scale === option
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleUpscale}
              disabled={!image}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
            >
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Upscale ({scale})
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
              {image ? (
                <img
                  src={image}
                  alt="Original"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-gray-500">No image uploaded</p>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-4">Upscaled Result</h2>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              {upscaledImage ? (
                <img
                  src={upscaledImage}
                  alt="Upscaled"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-gray-500">No upscaled image yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}