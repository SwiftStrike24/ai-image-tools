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

// Extend the Props type to include onSliderPositionChange
interface ExtendedProps extends React.ComponentProps<typeof ReactBeforeSliderComponent> {
  onSliderPositionChange?: () => void;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeAlt = 'Before image',
  afterAlt = 'After image',
}) => {
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
        <ReactBeforeSliderComponent {...sliderProps} />
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
