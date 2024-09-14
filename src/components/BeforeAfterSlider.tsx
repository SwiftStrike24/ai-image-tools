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

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeAlt = 'Before image',
  afterAlt = 'After image',
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const loadImage = (src: string) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
    }

    Promise.all([loadImage(beforeImage), loadImage(afterImage)]).then(([img1, img2]) => {
      const maxWidth = Math.max(img1.width, img2.width)
      const maxHeight = Math.max(img1.height, img2.height)
      setDimensions({ width: maxWidth, height: maxHeight })
    })
  }, [beforeImage, afterImage])

  const FIRST_IMAGE = {
    imageUrl: beforeImage,
    alt: beforeAlt,
  }
  const SECOND_IMAGE = {
    imageUrl: afterImage,
    alt: afterAlt,
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div style={{ width: '100%', aspectRatio: `${dimensions.width} / ${dimensions.height}` }}>
        <ReactBeforeSliderComponent
          firstImage={FIRST_IMAGE}
          secondImage={SECOND_IMAGE}
          delimiterColor="#8B5CF6"
          className="rounded-lg shadow-lg"
        />
      </div>
    </div>
  )
}

export default BeforeAfterSlider
