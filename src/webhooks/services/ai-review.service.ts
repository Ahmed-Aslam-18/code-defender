import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AIReviewComment } from '../ai-review-comment';
import { REVIEW_PROMPT_TEMPLATE } from '../constants/review-prompt.constant';

@Injectable()
export class AIReviewService {
  private readonly logger = new Logger(AIReviewService.name);
  private ai: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.logger.log('AI Review Service initialized successfully');
  }

  async reviewCodePatch(
    filename: string,
    patch: string,
  ): Promise<AIReviewComment[]> {
    try {
      this.logger.debug(`Reviewing file: ${filename}`);

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: this.buildPrompt(patch),
      });

      const reviewComments = this.parseAIResponse(response.text);
      this.logger.debug(
        `Found ${reviewComments.length} issues in ${filename}`,
      );

      return reviewComments;
    } catch (error) {
      this.logger.error(`Error reviewing ${filename}:`, error);
      throw error;
    }
  }

  private buildPrompt(patch: string): string {
    return REVIEW_PROMPT_TEMPLATE.replace('{{PATCH}}', patch);
  }

  private parseAIResponse(responseText?: string): AIReviewComment[] {
    if (!responseText) {
      return [];
    }

    try {
      const jsonString = responseText
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.warn('Failed to parse AI response as JSON', error);
      return [];
    }
  }
}
