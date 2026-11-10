import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useApi } from '../../lib/api';
import { queryKeys } from '../../lib/query-keys';

export const uploadSchema = z.object({
  key: z.string(),
  url: z.string(),
  width: z.number(),
  height: z.number(),
  is_public: z.boolean(),
});
export type UploadedImage = z.infer<typeof uploadSchema>;

const signedUrlSchema = z.object({ url: z.string(), expires_in_seconds: z.number() });

export type MediaKind = 'journal' | 'vision' | 'post';

/** The multipart body `POST media/images` expects. */
export function toUploadForm(kind: MediaKind, blob: Blob): FormData {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
  return form;
}

export function useUploadImage(kind: MediaKind) {
  const api = useApi();
  return useMutation({
    mutationFn: (blob: Blob) => api.upload('/media/images', toUploadForm(kind, blob), uploadSchema),
  });
}

/** Signed URLs last an hour on the backend; refresh before that. */
const SIGNED_URL_STALE_MS = 50 * 60_000;

export function useMediaUrl(key: string | null | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.media.url(key ?? ''),
    queryFn: async () => (await api.get(`/media/download-url/${key}`, signedUrlSchema)).url,
    enabled: Boolean(key),
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_STALE_MS,
  });
}
