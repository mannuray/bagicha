import { useImageCompressor } from './compressor-context';
import { useUploadImage, type MediaKind } from './media-api';

/** Compress a picked photo on the device, upload it, and return its media key. */
export function usePhotoUpload(kind: MediaKind) {
  const compressor = useImageCompressor();
  const upload = useUploadImage(kind);
  return {
    upload: async (file: File): Promise<string> => {
      const compressed = await compressor.compress(file);
      return (await upload.mutateAsync(compressed.blob)).key;
    },
    isPending: upload.isPending,
  };
}
