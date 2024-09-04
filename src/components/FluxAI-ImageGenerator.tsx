'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export default function Component() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate image generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setImageUrl('/placeholder.svg?height=512&width=512')
    setIsLoading(false)
  }

  const handleNewImage = () => {
    setPrompt('')
    setImageUrl('')
  }

  const handleDownload = () => {
    // In a real application, this would trigger the image download
    console.log('Downloading image...')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">AI Image Generator</h2>
          <p className="mt-2 text-sm text-purple-300">Enter a prompt to generate your image</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              type="text"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm bg-gray-800"
              placeholder="Enter your image prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-3" />
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </form>
        {imageUrl && (
          <div className="mt-8 space-y-4">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-purple-500 opacity-20 animate-pulse"></div>
              <img src={imageUrl} alt="Generated" className="w-full h-auto" />
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleNewImage}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                New Image
              </Button>
              <Button
                onClick={handleDownload}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}