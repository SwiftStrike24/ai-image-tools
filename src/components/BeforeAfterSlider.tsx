'use client'

import React, { useState, useEffect } from 'react'
import ReactBeforeSliderComponent from 'react-before-after-slider-component'
import 'react-before-after-slider-component/dist/build.css'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
}

interface ExtendedProps extends React.ComponentProps<typeof ReactBeforeSliderComponent> {
  onSliderPositionChange?: () => void;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeAlt = 'Before image',
  afterAlt = 'After image',
}) => {
  const [imagesLoaded, setImagesLoaded] = useState(false)

  useEffect(() => {
    const loadImages = async () => {
      const loadImage = (src: string) => new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = src
      })

      try {
        await Promise.all([loadImage(beforeImage), loadImage(afterImage)])
        setImagesLoaded(true)
      } catch (error) {
        console.error('Failed to load images:', error)
      }
    }

    loadImages()
  }, [beforeImage, afterImage])

  const sliderProps: ExtendedProps = {
    firstImage: {
      imageUrl: beforeImage,
      alt: beforeAlt,
    },
    secondImage: {
      imageUrl: afterImage,
      alt: afterAlt,
    },
    delimiterColor: "#8B5CF6",
    className: "rounded-lg shadow-lg",
    onSliderPositionChange: () => {},
  }

  return (
    <div className="w-full mx-auto relative">
      <div className="w-full aspect-video">
        {imagesLoaded ? (
          <ReactBeforeSliderComponent {...sliderProps} />
        ) : (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-500">Loading...</span>
          </div>
        )}
      </div>
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        Before
      </div>
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        After
      </div>
    </div>
  )
}

export default BeforeAfterSlider
