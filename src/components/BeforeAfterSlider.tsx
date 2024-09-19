'use client'

import React from 'react'
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
  const FIRST_IMAGE = {
    imageUrl: beforeImage,
    alt: beforeAlt,
  }
  const SECOND_IMAGE = {
    imageUrl: afterImage,
    alt: afterAlt,
  }

  return (
    <div className="w-full mx-auto relative">
      <div className="w-full aspect-video">
        <ReactBeforeSliderComponent
          firstImage={FIRST_IMAGE}
          secondImage={SECOND_IMAGE}
          delimiterColor="#8B5CF6"
          className="rounded-lg shadow-lg"
          onSliderPositionChange={() => {}} // Prevent default behavior
        />
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
