import type { AIProvider } from '../../core/types.js';
import { InputValidationError } from '../../core/errors.js';
import { GeminiProvider } from './gemini.js';

/**
 * Factory function to create an AI provider by name.
 *
 * To add a new provider:
 * 1. Create a class implementing AIProvider in src/services/ai/
 * 2. Add a case to this factory
 */
export function createAIProvider(name: string, apiKey: string): AIProvider {
  switch (name) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    default:
      throw new InputValidationError(`Unknown AI provider: "${name}". Supported: gemini`);
  }
}
