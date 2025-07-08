import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export interface LLMParams {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-haiku' | 'claude-3-sonnet';
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface StreamingCallbacks {
  onStart: () => void;
  onContent: (content: string) => void;
  onComplete: (finalContent: string, tokenCount?: number) => void;
  onError: (error: string) => void;
}

// Map our model names to provider-specific models
const getProviderModel = (model: string) => {
  switch (model) {
    case 'gpt-4':
      return openai('gpt-4');
    case 'gpt-3.5-turbo':
      return openai('gpt-3.5-turbo');
    case 'claude-3-haiku':
      // Note: Would need @ai-sdk/anthropic for Claude
      // For now, fallback to OpenAI
      return openai('gpt-3.5-turbo');
    case 'claude-3-sonnet':
      // Note: Would need @ai-sdk/anthropic for Claude
      // For now, fallback to OpenAI
      return openai('gpt-4');
    default:
      return openai('gpt-3.5-turbo');
  }
};

export class LLMService {
  static async streamCompletion(
    prompt: string,
    params: LLMParams,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    try {
      callbacks.onStart();

      const model = getProviderModel(params.model);

      const result = await streamText({
        model,
        prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        ...(params.systemPrompt && { system: params.systemPrompt }),
      });

      let fullContent = '';

      for await (const delta of result.textStream) {
        fullContent += delta;
        callbacks.onContent(fullContent);
      }

      // Get final usage stats if available
      const usage = await result.usage;
      callbacks.onComplete(fullContent, usage?.totalTokens);

    } catch (error) {
      console.error('LLM Service Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      callbacks.onError(errorMessage);
    }
  }

  static async simpleCompletion(
    prompt: string,
    params: LLMParams
  ): Promise<{ content: string; tokenCount?: number }> {
    try {
      const model = getProviderModel(params.model);

      const result = await streamText({
        model,
        prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        ...(params.systemPrompt && { system: params.systemPrompt }),
      });

      let fullContent = '';
      for await (const delta of result.textStream) {
        fullContent += delta;
      }

      const usage = await result.usage;
      return {
        content: fullContent,
        tokenCount: usage?.totalTokens,
      };

    } catch (error) {
      console.error('LLM Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
} 