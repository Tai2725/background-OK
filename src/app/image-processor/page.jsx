import { ImageProcessor } from 'src/components/image-processor';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Image Processor - AI Image Processing',
  description: 'Process images with AI - Remove background, upscale, and generate images',
};

export default function ImageProcessorPage() {
  return <ImageProcessor />;
}
