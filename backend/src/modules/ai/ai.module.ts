import { Module } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider } from './ai-provider';
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
    { provide: AiProvider, useClass: GeminiProvider },
  ],
  exports: [AiProvider],
})
export class AiModule {}
