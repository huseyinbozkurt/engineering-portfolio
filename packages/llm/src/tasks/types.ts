import type { z } from "zod";

/** A prompt pair produced by a versioned builder. */
export interface BuiltPrompt {
  system: string;
  user: string;
}

/**
 * A registered LLM task definition: schemas + versioned prompt builder.
 * Execution lives in the dedicated runners (see `insights/runner.ts`), so a
 * task definition stays pure and serializable-adjacent.
 */
export interface RegisteredTask<TInput = unknown, TOutput = unknown> {
  type: string;
  promptVersion: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  buildPrompt(input: TInput): BuiltPrompt;
}
