import type {
  LLMAdapter,
  LLMGenerateParams,
  LLMGenerateResult,
  LLMProvider,
  LLMUsage,
} from "./types";

export interface MockAdapterConfig {
  model?: string;
  /**
   * Produces the response text for a given prompt. Tests inject this to return
   * a valid (or deliberately invalid) report. The default returns a small JSON
   * object that does NOT satisfy the insight output schema — useful for
   * exercising the validation-failure path, never for real runs.
   */
  respond?: (params: LLMGenerateParams) => string;
  usage?: LLMUsage;
  /** When set, generate() rejects with this error (failure-path tests). */
  failWith?: Error;
}

/**
 * Deterministic mock adapter for tests and local development. No network.
 */
export class MockAdapter implements LLMAdapter {
  private readonly provider: LLMProvider = "mock";
  private readonly model: string | undefined;
  private readonly respond: (params: LLMGenerateParams) => string;
  private readonly usage: LLMUsage | undefined;
  private readonly failWith: Error | undefined;

  constructor(config: MockAdapterConfig = {}) {
    this.model = config.model;
    this.respond =
      config.respond ??
      ((params) =>
        JSON.stringify({
          mock: true,
          promptChars: params.userPrompt.length + (params.systemPrompt?.length ?? 0),
        }));
    this.usage = config.usage;
    this.failWith = config.failWith;
  }

  async generate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
    if (this.failWith) {
      throw this.failWith;
    }

    const text = this.respond(params);

    const result: LLMGenerateResult = {
      text,
      finishReason: "stop",
      raw: { mock: true },
    };
    if (this.usage) {
      result.usage = this.usage;
    }
    return result;
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  getModel(): string | undefined {
    return this.model;
  }
}
