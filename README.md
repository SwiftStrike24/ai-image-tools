# FluxScale AI: Advanced AI Image Tools 🎨🖼️

![FluxScale AI Banner](https://via.placeholder.com/1200x300?text=FluxScale+AI)

## 🚀 Features

- **🖼️ AI Image Generation**: Create stunning images from text prompts using FLUX.1 AI
- **🔍 Image Upscaling**: Enhance and upscale your images with Real-ESRGAN technology
- **🎭 Multiple Aspect Ratios**: Support for various image dimensions (1:1, 16:9, 9:16, 4:5, 21:9, etc.)
- **🌈 High-Quality Outputs**: Generate images in WebP, JPG, or PNG formats with adjustable quality
- **🧠 Smart Prompt Enhancement**: AI-powered prompt improvement for better results
- **👤 Face Enhancement**: Option to improve facial details during upscaling
- **🕹️ Simulation Mode**: Test the UI without making API calls
- **🖱️ Interactive Image Viewer**: Zoom and pan functionality for uploaded and generated images
- **💾 Easy Download**: One-click download for generated and upscaled images
- **🌓 Dark Mode Interface**: Sleek, modern dark theme with purple accents
- **🔄 Follow-up Prompts**: Generate variations based on previous outputs
- **🔢 Multi-Image Generation**: Create up to 4 images per prompt
- **🔍 Image Focus**: Zoom in on specific images for detailed viewing
- **⏪ History Navigation**: Go back to previous follow-up levels
- **🎨 Customizable Outputs**: Adjust number of outputs, format, and quality
- **📊 Usage Tracking**: Monitor daily usage within free plan limits
- **🔒 Authentication**: Secure user authentication and authorization
- **📱 Responsive Design**: Optimized for both desktop and mobile devices
- **⏱️ Rate Limiting**: Implemented daily usage limits for both upscaling and generation
- **👀 Admin View**: Scripts to view user upscales and generations with detailed statistics
- **🎠 Image Carousel**: Showcase before/after comparisons of upscaled images
- **🔍 SEO Optimization**: Improved metadata and structured data for better search engine visibility
- **🚀 Performance Enhancements**: Optimized code for faster load times and smoother interactions
- **📊 Usage Analytics**: Integration with Vercel Analytics for insights on user behavior
- **🔄 Improved State Management**: Enhanced React hooks for more efficient state updates
- **🖼️ HEIC Support**: Added capability to handle HEIC image format
- **🎨 Customizable UI**: User-friendly interface with adjustable settings
- **🔐 Enhanced Security**: Implemented additional security measures for user data protection

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Magic UI
- **Animation**: Framer Motion
- **API Integration**: Replicate API
- **Authentication**: Clerk
- **Deployment**: Vercel
- **Image Optimization**: Next.js Image component
- **Database**: Vercel KV (Redis)
- **Analytics**: Vercel Analytics, Vercel Speed Insights
- **State Management**: React Hooks, Context API
- **Testing**: (Add your testing framework here)

## 🧩 Key Components

- `FluxAI-ImageGeneratorClient`: Manages AI image generation from text prompts
- `ImageUpscalerClient`: Handles image uploading and upscaling functionality
- `ImageGrid`: Displays generated images with focus and download options
- `ImageModal`: Provides a detailed view of selected images
- `Header`: Navigation component with animated tab switching
- `RetroGrid`: Background component for visual appeal
- `ShinyButton`: Custom button component with animated effects
- `LandingPageClient`: Introduces users to the app's features
- `BeforeAfterSlider`: Showcases image transformations
- `Carousel`: Displays multiple images in a scrollable format

## 🔌 APIs and Server Actions

- `generateFluxImage`: Generates images from text prompts using FLUX.1 model
- `upscaleImage`: Upscales images using Real-ESRGAN model
- `enhancePrompt`: Improves user prompts for better image generation results
- `checkAndUpdateRateLimit`: Manages user rate limiting for API calls
- `getUserUsage`: Retrieves current user's daily usage statistics
- `checkAndUpdateGeneratorLimit`: Manages rate limiting for image generation

## 📊 Admin Scripts

- `view-user-upscales.ts`: Displays detailed statistics on user upscale usage
- `view-user-generators.ts`: Shows comprehensive data on user image generation activity

## 🏁 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-image-tools.git
   cd ai-image-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add:
   ```bash
   REPLICATE_API_TOKEN=your_replicate_api_token
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   KV_URL=your_vercel_kv_url
   KV_REST_API_URL=your_vercel_kv_rest_api_url
   KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_rest_api_read_only_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/400x300?text=Image+Generator" alt="Image Generator" width="45%">
  <img src="https://via.placeholder.com/400x300?text=Image+Upscaler" alt="Image Upscaler" width="45%">
</div>

## 🔮 Future Plans

- [ ] Implement user profiles and saved image galleries
- [ ] Add a subscription model using Stripe for premium features
- [ ] Expand AI model options for diverse image generation styles
- [ ] Introduce batch processing for multiple images
- [ ] Develop a mobile app version
- [ ] Implement image history and favorites functionality
- [ ] Add social sharing features for generated images
- [ ] Integrate more advanced editing tools (e.g., inpainting, outpainting)
- [ ] Implement a community showcase for user-generated images
- [ ] Add language support for internationalization

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/yourusername/fluxscale-ai/issues).

## 📄 License

This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

## 👨‍💻 Author

**SwiftStrike24**

- GitHub: [@SwiftStrike24](https://github.com/SwiftStrike24)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- [Replicate](https://replicate.com/) for their amazing AI models (Real-ESRGAN and FLUX.1)
- [Vercel](https://vercel.com/) for hosting, deployment, Vercel KV, and analytics
- [Shadcn UI](https://ui.shadcn.com/) for beautiful UI components
- [Magic UI](https://magicui.design/) for additional UI enhancements
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework
- [Clerk](https://clerk.com/) for authentication services
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [OpenAI](https://openai.com/) for AI-powered prompt enhancement

---

<div align="center">
  Made with ❤️ and ☕ by SwiftStrike24
</div>
