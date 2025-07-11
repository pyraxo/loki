import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { settingsService } from "./settings-service";
import { PROVIDER_METADATA } from "@/types/settings";

export interface LLMParams {
  model: "gpt-4" | "gpt-3.5-turbo" | "claude-3-haiku" | "claude-3-sonnet";
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

// Get provider client with configurable API keys
const getProviderClient = async (model: string) => {
  const provider = settingsService.getProviderFromModel(model);
  const apiKey = await settingsService.getApiKey(provider);

  if (!apiKey && PROVIDER_METADATA[provider].requiresApiKey) {
    throw new Error(
      `API key not configured for ${PROVIDER_METADATA[provider].name}`
    );
  }

  switch (provider) {
    case "openai":
      const openaiClient = createOpenAI({ apiKey: apiKey || undefined });
      return openaiClient(model);
    case "anthropic":
      // TODO: Add @ai-sdk/anthropic for Claude support
      // For now, fallback to OpenAI
      console.warn(
        `Provider ${provider} not yet supported, falling back to OpenAI`
      );
      const openaiKey = await settingsService.getApiKey("openai");
      if (!openaiKey) {
        throw new Error("OpenAI API key not configured for fallback");
      }
      const fallbackClient = createOpenAI({ apiKey: openaiKey });
      return fallbackClient("gpt-3.5-turbo");
    case "google":
    case "cohere":
    case "ollama":
      // TODO: Add support for other providers
      console.warn(
        `Provider ${provider} not yet supported, falling back to OpenAI`
      );
      const fallbackKey = await settingsService.getApiKey("openai");
      if (!fallbackKey) {
        throw new Error("OpenAI API key not configured for fallback");
      }
      const fallbackClientOther = createOpenAI({ apiKey: fallbackKey });
      return fallbackClientOther("gpt-3.5-turbo");
    default:
      throw new Error(`Unknown provider: ${provider}`);
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

      const model = await getProviderClient(params.model);

      const result = await streamText({
        model,
        prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        ...(params.systemPrompt && { system: params.systemPrompt }),
      });

      let fullContent = "";

      for await (const delta of result.textStream) {
        fullContent += delta;
        callbacks.onContent(fullContent);
      }

      // Get final usage stats if available
      const usage = await result.usage;
      const tokenCount = usage?.totalTokens;
      callbacks.onComplete(
        fullContent,
        typeof tokenCount === "number" && !isNaN(tokenCount)
          ? tokenCount
          : undefined
      );
    } catch (error) {
      console.error("LLM Service Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      callbacks.onError(errorMessage);
    }
  }

  static async simpleCompletion(
    prompt: string,
    params: LLMParams
  ): Promise<{ content: string; tokenCount?: number }> {
    try {
      const model = await getProviderClient(params.model);

      const result = await streamText({
        model,
        prompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
        ...(params.systemPrompt && { system: params.systemPrompt }),
      });

      let fullContent = "";
      for await (const delta of result.textStream) {
        fullContent += delta;
      }

      const usage = await result.usage;
      const tokenCount = usage?.totalTokens;
      return {
        content: fullContent,
        tokenCount:
          typeof tokenCount === "number" && !isNaN(tokenCount)
            ? tokenCount
            : undefined,
      };
    } catch (error) {
      console.error("LLM Service Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
}
