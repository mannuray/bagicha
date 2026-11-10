import { createContext, useContext } from 'react';
import { canvasImageCompressor, type ImageCompressor } from './image-compressor';

const ImageCompressorContext = createContext<ImageCompressor>(canvasImageCompressor);
export const ImageCompressorProvider = ImageCompressorContext.Provider;
export const useImageCompressor = () => useContext(ImageCompressorContext);
