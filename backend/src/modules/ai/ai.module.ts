import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider } from './ai-provider';
import { FakeAiProvider } from './fake-ai.provider';
import {
  GEMINI_CLIENT_FACTORY,
  GeminiClientFactory,
  GeminiProvider,
} from './gemini.provider';

const geminiClientFactory: GeminiClientFactory = (apiKey) =>
  new GoogleGenerativeAI(apiKey);

@Module({
  providers: [
    { provide: GEMINI_CLIENT_FACTORY, useValue: geminiClientFactory },
    GeminiProvider,
    FakeAiProvider,
    {
      // AI_PROVIDER=fake is for end-to-end runs only; env validation refuses it in production.
      provide: AiProvider,
      inject: [ConfigService, GeminiProvider, FakeAiProvider],
      useFactory: (
        config: ConfigService,
        gemini: GeminiProvider,
        fake: FakeAiProvider,
      ) => (config.get<string>('AI_PROVIDER') === 'fake' ? fake : gemini),
    },
  ],
  exports: [AiProvider],
})
export class AiModule {}
