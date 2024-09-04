
# Real-ESRGAN Image Upscaling with Replicate API

## Overview

This guide provides detailed instructions on how to create a web application that uses the Real-ESRGAN model from Replicate to upscale images. The application will feature a modern dark mode interface with purple lighting effects, white text, and allow users to upload an image, select upscaling options, and obtain a high-quality upscaled version of the image.

## Project Setup

### 1. Frontend Setup

- **Framework:** Use React.js for building the frontend. It allows for easy component-based development.
- **Styling:** Implement dark mode with CSS or styled-components.
  - Set the background color to a deep black or dark gray.
  - Apply white text (`#FFFFFF`) for all textual content.
  - Use shades of purple for animations, button effects, and hover states.

### 2. Backend Setup

- **Backend Framework:** Use Node.js with Express.js.
- **API Integration:** Integrate with Replicate's API to send images and retrieve upscaled results.

## Frontend Implementation

### 1. Dark Mode and Styling

```css
body {
    background-color: #121212;
    color: #FFFFFF;
}

.button-purple {
    background-color: #6A0DAD;
    color: #FFFFFF;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.button-purple:hover {
    background-color: #8A2BE2;
}
```

### 2. Image Upload Component

```jsx
import React, { useState } from 'react';

function ImageUpload() {
    const [image, setImage] = useState(null);

    const handleImageUpload = (event) => {
        setImage(URL.createObjectURL(event.target.files[0]));
    };

    return (
        <div className="image-upload">
            <input type="file" onChange={handleImageUpload} />
            {image && <img src={image} alt="Uploaded Preview" />}
        </div>
    );
}

export default ImageUpload;
```

## Backend Implementation

### 1. Installing Dependencies

```bash
npm install express replicate dotenv
```

### 2. Server Setup and API Integration

```javascript
const express = require('express');
const replicate = require('replicate');
const app = express();

app.use(express.json());

app.post('/upscale', async (req, res) => {
    const { imagePath, upscaleFactor } = req.body;

    const output = await replicate.run(
        "nightmareai/real-esrgan",
        {
            input: {
                image: imagePath,
                scale: upscaleFactor
            }
        }
    );

    res.json({ upscaledImage: output });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Deployment

### 1. Frontend

- Deploy the frontend on Vercel or Netlify for ease of use.

### 2. Backend

- Deploy the backend on Heroku or AWS for reliable hosting.

## Conclusion

This guide provides all the necessary steps to create a modern web application that allows users to upscale images using the Real-ESRGAN model on Replicate. The application is designed with a sleek dark mode interface and offers various upscaling options to enhance image quality without altering the aspect ratio.

For more information on the models used, refer to the [Replicate API documentation](https://replicate.com).

