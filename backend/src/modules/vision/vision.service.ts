import { Injectable } from '@nestjs/common';
import { GeminiService } from './services/gemini.service';
import { VisionRequestDto } from './dto/vision-request.dto';

@Injectable()
export class VisionService {
  constructor(private readonly geminiService: GeminiService) {}

  async identifyPlant(dto: VisionRequestDto) {
    const prompt = `
      Identify this plant species. 
      Be specific and provide results in a structured JSON format.
      Include: common_name, scientific_name, description, and care_summary (light, water, soil).
      Format: JSON only.
    `;

    const imagePart = {
      inlineData: {
        data: dto.image_base64.split(',')[1] || dto.image_base64,
        mimeType: 'image/jpeg',
      },
    };

    const response = await this.geminiService.analyzeImage(imagePart, prompt);
    return this.geminiService.parseJsonResponse(response);
  }

  async diagnosePlant(dto: VisionRequestDto) {
    const prompt = `
      Analyze this plant for pests, diseases, or nutrient deficiencies.
      Identify the issue and provide a zero-guesswork action plan.
      Focus on the Indian horticultural context (e.g., Mango Mealybugs, Citrus Canker).
      Return structured JSON only.
      Fields: identification, confidence (percentage), severity (Low/Medium/High), 
      action_plan: { immediate: string, long_term: string }.
    `;

    const imagePart = {
      inlineData: {
        data: dto.image_base64.split(',')[1] || dto.image_base64,
        mimeType: 'image/jpeg',
      },
    };

    const response = await this.geminiService.analyzeImage(imagePart, prompt);
    return this.geminiService.parseJsonResponse(response);
  }
}
