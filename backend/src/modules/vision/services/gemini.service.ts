import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey || 'MOCK_KEY');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeImage(imagePart: { inlineData: { data: string; mimeType: string } }, prompt: string): Promise<string> {
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
      console.error('[GEMINI] Error analyzing image/text:', error);
      throw error;
    }
  }

  // Helper to clean JSON response from Gemini
  parseJsonResponse(text: string): any {
    try {
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('[GEMINI] Failed to parse JSON:', text);
      return { raw_text: text, error: 'Failed to parse structured JSON' };
    }
  }
}
