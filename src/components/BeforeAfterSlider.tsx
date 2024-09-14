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
    <ReactBeforeSliderComponent
      firstImage={FIRST_IMAGE}
      secondImage={SECOND_IMAGE}
      delimiterColor="#8B5CF6"
      className="w-full max-w-2xl mx-auto"
    />
  )
}

export default BeforeAfterSlider
