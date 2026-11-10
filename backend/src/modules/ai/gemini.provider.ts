import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppError, UpstreamError } from '../../common/errors';
import { Metrics, withSpan } from '../../common/observability';
import { AiJsonRequest, AiProvider } from './ai-provider';
import { extractJsonObject } from './json-response';

export type GeminiClientFactory = (
  apiKey: string,
) => Pick<GoogleGenerativeAI, 'getGenerativeModel'>;
export const GEMINI_CLIENT_FACTORY = Symbol('GEMINI_CLIENT_FACTORY');

@Injectable()
export class GeminiProvider extends AiProvider {
  constructor(
    private readonly config: ConfigService,
    private readonly metrics: Metrics,
    @Inject(GEMINI_CLIENT_FACTORY)
    private readonly createClient: GeminiClientFactory,
    @InjectPinoLogger(GeminiProvider.name) private readonly logger: PinoLogger,
  ) {
    super();
  }

  async generateJson(request: AiJsonRequest): Promise<Record<string, unknown>> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    const model = this.config.get<string>('GEMINI_MODEL');
    if (!apiKey || !model) {
      this.metrics.aiCall(request.feature, 'not_configured');
      throw new UpstreamError(
        'AI_NOT_CONFIGURED',
        'AI features are not configured on this server',
      );
    }

    return withSpan(
      'ai.generate',
      { feature: request.feature, model },
      async () => {
        let text: string;
        try {
          const parts: Array<
            string | { inlineData: { data: string; mimeType: string } }
          > = [request.prompt];
          if (request.image?.data) parts.push({ inlineData: request.image });
          const result = await this.createClient(apiKey)
            .getGenerativeModel({ model })
            .generateContent(parts);
          text = result.response.text();
        } catch (err: unknown) {
          this.metrics.aiCall(request.feature, 'error');
          this.logger.error(
            { err, feature: request.feature },
            'AI provider call failed',
          );
          throw new UpstreamError(
            'AI_PROVIDER_ERROR',
            'The AI provider failed',
          );
        }

        try {
          const json = extractJsonObject(text);
          this.metrics.aiCall(request.feature, 'ok');
          return json;
        } catch (err: unknown) {
          if (err instanceof AppError) {
            this.metrics.aiCall(request.feature, 'invalid_response');
            this.logger.warn(
              { feature: request.feature, responseLength: text.length },
              'AI returned an unusable response',
            );
          }
          throw err;
        }
      },
    );
  }
}
