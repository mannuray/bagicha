import { AiFeature } from '../../common/observability';

export interface AiImage {
  data: string;
  mimeType: string;
}

export interface AiJsonRequest {
  feature: AiFeature;
  prompt: string;
  image?: AiImage;
}

/** The AI model behind plant identification, diagnosis and ask-AI. */
export abstract class AiProvider {
  /**
   * Returns the JSON object the model answered with. Throws UpstreamError with
   * AI_NOT_CONFIGURED, AI_PROVIDER_ERROR or AI_RESPONSE_INVALID.
   */
  abstract generateJson(
    request: AiJsonRequest,
  ): Promise<Record<string, unknown>>;
}
