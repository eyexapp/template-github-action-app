import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderError } from '../../core/errors.js';
import type { AIProvider } from '../../core/types.js';

/**
 * Google Gemini AI provider implementation.
 *
 * Uses the Gemini Pro model for text generation.
 * Wrap or replace this class to switch AI providers.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private readonly model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new AIProviderError(
        `Gemini API call failed: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error,
      );
    }
  }
}
