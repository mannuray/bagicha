import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    @InjectPinoLogger(GeminiService.name)
    private readonly logger: PinoLogger,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || 'MOCK_KEY');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeImage(
    imagePart: { inlineData: { data: string; mimeType: string } },
    prompt: string,
  ): Promise<string> {
    try {
      const parts: any[] = [prompt];
      if (imagePart.inlineData.data) {
        parts.push(imagePart);
      }

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      return text;
    } catch (error) {
      this.logger.error({ err: error }, 'Gemini image analysis failed');
      throw error;
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent([prompt]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      this.logger.error({ err: error }, 'Gemini text generation failed');
      throw error;
    }
  }

  // Helper to clean JSON response from Gemini
  parseJsonResponse(text: string): any {
    try {
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.warn(
        { responseLength: text.length },
        'Gemini returned unparseable JSON',
      );
      return { raw_text: text, error: 'Failed to parse structured JSON' };
    }
  }
}
