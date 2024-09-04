
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


## Node.js Setup for nightmareai/real-esrgan Model

### 1. Environment Setup

Node.js supports two module formats: ESM and CommonJS. Below are the setup instructions for each environment. After setup, the code is identical regardless of the module format.

#### ESM Setup

1. Ensure you have a Node.js project initialized:

   ```bash
   npm create esm -y
   ```

2. Install the Replicate JavaScript library using npm:

   ```bash
   npm install replicate
   ```

3. Import and create an instance of the Replicate client:

   ```javascript
   import Replicate from "replicate";

   const replicate = new Replicate();
   ```

   This will use the `REPLICATE_API_TOKEN` environment variable for authorization.

#### CommonJS Setup

1. Ensure you have a Node.js project initialized:

   ```bash
   npm create -y
   ```

2. Install the Replicate JavaScript library using npm:

   ```bash
   npm install replicate
   ```

3. Import and create an instance of the Replicate client:

   ```javascript
   const Replicate = require("replicate");

   const replicate = new Replicate();
   ```

   This will use the `REPLICATE_API_TOKEN` environment variable for authorization.

### 2. Running the Model

To run the `nightmareai/real-esrgan` model, use the `replicate.run()` method as shown below:

```javascript
const input = {
    image: "https://replicate.delivery/pbxt/Ing7Fa4YMk6YtcoG1YZnaK3UwbgDB5guRc5M2dEjV6ODNLMl/cat.jpg",
    scale: 2
};

const output = await replicate.run("nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa", { input });
console.log(output);
//=> "https://replicate.delivery/pbxt/iVcx6825RF5EMppOandycFV8..."
```

You can provide a file as input using a URL, a local file on your computer, or a base64 encoded object. Here are the options:

#### Option 1: Hosted File

Use a URL as in the earlier example:

```javascript
const image = "https://replicate.delivery/pbxt/Ing7Fa4YMk6YtcoG1YZnaK3UwbgDB5guRc5M2dEjV6ODNLMl/cat.jpg";
```

#### Option 2: Local File

Provide Replicate with a Blob, File, or Buffer object:

```javascript
import { readFile } from "node:fs/promises";
const image = await readFile("./path/to/my/image.jpg");
```

#### Option 3: Data URI

Create a data URI consisting of the base64 encoded data for your file:

```javascript
import { readFile } from "node:fs/promises";
const data = (await readFile("./image.jpg")).toString("base64");
const image = `data:application/octet-stream;base64,\${data}`;
```

Then, pass `image` as part of the input:

```javascript
const input = {
    image: image,
    scale: 2
};

const output = await replicate.run("nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa", { input });
console.log(output);
//=> "https://replicate.delivery/pbxt/iVcx6825RF5EMppOandycFV8..."
```

### 3. Prediction Lifecycle

When you run a model on Replicate, the prediction goes through several states such as "starting", "processing", and eventually "successful", "failed", or "canceled". You can track the prediction status using the `replicate.predictions.create()` method for the full prediction object, including id, status, logs, etc.

### 4. Model Information for Node.js

To use the `nightmareai/real-esrgan` model, first install Replicate’s Node.js client library:

```bash
npm install replicate
```

Then, import and set up the client:

```javascript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
```

Run the model using the following code:

```javascript
const output = await replicate.run(
  "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
  {
    input: {
      image: "https://replicate.delivery/pbxt/Ing7Fa4YMk6YtcoG1YZnaK3UwbgDB5guRc5M2dEjV6ODNLMl/cat.jpg",
      scale: 2,
      face_enhance: false
    }
  }
);
console.log(output);
```

To learn more, take a look at the guide on getting started with Node.js.

## Frontend Development with .tsx Files

In this project, we will use `.tsx` files for all pages and components, following the guidelines below:

### Project Structure

1. **Components**: 
   - All new components should be placed in the `/components` directory.
   - Components should be named using the following convention: `example-component.tsx`.
   - Group related components into folders where appropriate.

2. **Pages**:
   - All new pages should be placed in the `/app` directory.
   - Pages should also be written as `.tsx` files.

### Best Practices

1. **Next.js App Router**:
   - We are using the Next.js 14 app router for this project. Ensure that all routing is consistent with this version.
   
2. **Server Components**:
   - All data fetching should be performed in a server component. Data should then be passed down to client components as props.

3. **Client Components**:
   - If you are using client-side features like `useState` or hooks, make sure to include `use client` at the top of the `.tsx` file.
   - `useRouter` should be imported from `next/navigation`.

### Styling and Animations

- **Tailwind CSS**: 
  - Use Tailwind CSS for styling. Ensure that all styles are modular and maintainable.
  
- **Framer Motion**: 
  - Use Framer Motion for animations, ensuring smooth transitions and interactive elements.

By following these guidelines, the frontend of the project will be well-structured, maintainable, and aligned with best practices in modern web development.
