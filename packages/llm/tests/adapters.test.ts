import { afterEach, describe, expect, it, vi } from "vitest";

import { LlmHttpError, setLlmFetchForTesting } from "../src/adapters/http";
import { AnthropicAdapter } from "../src/adapters/anthropic-adapter";
import { OpenAiCompatibleAdapter } from "../src/adapters/openai-compatible-adapter";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  setLlmFetchForTesting(null);
});

describe("OpenAiCompatibleAdapter", () => {
  it("calls chat/completions with auth, parses content, finish reason, and usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }],
        usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
      }),
    );
    setLlmFetchForTesting(fetchMock);

    const adapter = new OpenAiCompatibleAdapter({
      provider: "openai",
      baseUrl: "https://api.openai.com/v1/",
      apiKey: "sk-test",
      model: "gpt-test",
    });

    const result = await adapter.generate({ systemPrompt: "sys", userPrompt: "user" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.model).toBe("gpt-test");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(Array.isArray(body.messages)).toBe(true);

    expect(result.text).toBe('{"ok":true}');
    expect(result.finishReason).toBe("stop");
    expect(result.usage).toEqual({ promptTokens: 12, completionTokens: 4, totalTokens: 16 });
  });

  it("sends the structured-JSON generation profile by default (temp 0.2, top_p 0.9, max_tokens > 30k)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "{}" } }] }),
    );
    setLlmFetchForTesting(fetchMock);

    const adapter = new OpenAiCompatibleAdapter({ baseUrl: "http://x", model: "m" });
    await adapter.generate({ userPrompt: "hi" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.temperature).toBe(0.2);
    expect(body.top_p).toBe(0.9);
    expect(body.max_tokens).toBeGreaterThan(30000);
  });

  it("honors per-call generation overrides field-by-field", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "{}" } }] }),
    );
    setLlmFetchForTesting(fetchMock);

    // Construct with non-default defaults to prove per-call wins over them.
    const adapter = new OpenAiCompatibleAdapter({
      baseUrl: "http://x",
      model: "m",
      temperature: 0.7,
      topP: 0.5,
      maxTokens: 8000,
    });
    // Only override maxTokens (and temperature 0, which must not be ignored).
    await adapter.generate({ userPrompt: "hi", generation: { temperature: 0, maxTokens: 31000 } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.temperature).toBe(0); // explicit 0 overrides the 0.7 default
    expect(body.max_tokens).toBe(31000);
    expect(body.top_p).toBe(0.5); // unset per-call field keeps the configured default
  });

  it("omits response_format for custom providers and works without an API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "{}" } }] }),
    );
    setLlmFetchForTesting(fetchMock);

    const adapter = new OpenAiCompatibleAdapter({
      baseUrl: "http://localhost:11434/v1",
      model: "qwen",
    });
    await adapter.generate({ userPrompt: "hi" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.response_format).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("throws LlmHttpError with the status for non-2xx responses", async () => {
    setLlmFetchForTesting(vi.fn().mockResolvedValue(jsonResponse({}, 500)));

    const adapter = new OpenAiCompatibleAdapter({ baseUrl: "http://x", model: "m" });

    try {
      await adapter.generate({ userPrompt: "hi" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(LlmHttpError);
      expect((error as LlmHttpError).status).toBe(500);
    }
  });

  it("maps aborts to a timed-out LlmHttpError", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    setLlmFetchForTesting(vi.fn().mockRejectedValue(abortError));

    const adapter = new OpenAiCompatibleAdapter({ baseUrl: "http://x", model: "m", timeoutMs: 50 });

    try {
      await adapter.generate({ userPrompt: "hi" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(LlmHttpError);
      expect((error as LlmHttpError).timedOut).toBe(true);
    }
  });
});

describe("AnthropicAdapter", () => {
  it("calls messages with anthropic headers and maps usage tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        content: [{ text: '{"ok":true}' }],
        stop_reason: "end_turn",
        usage: { input_tokens: 20, output_tokens: 8 },
      }),
    );
    setLlmFetchForTesting(fetchMock);

    const adapter = new AnthropicAdapter({ apiKey: "ak-test", model: "claude-test" });
    const result = await adapter.generate({ systemPrompt: "sys", userPrompt: "user" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("ak-test");
    expect(headers["anthropic-version"]).toBeTruthy();

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.system).toBe("sys");

    expect(result.text).toBe('{"ok":true}');
    expect(result.finishReason).toBe("end_turn");
    expect(result.usage).toEqual({ promptTokens: 20, completionTokens: 8, totalTokens: 28 });
  });

  it("sends top_p with the structured-JSON defaults and honors per-call overrides", async () => {
    // Fresh Response per call — a Response body can only be read once.
    const fetchMock = vi.fn().mockImplementation(async () =>
      jsonResponse({ content: [{ text: "{}" }], stop_reason: "end_turn" }),
    );
    setLlmFetchForTesting(fetchMock);

    const adapter = new AnthropicAdapter({ apiKey: "k", model: "m" });
    await adapter.generate({ userPrompt: "hi" });
    const [, defaultInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const defaultBody = JSON.parse(String(defaultInit.body)) as Record<string, unknown>;
    expect(defaultBody.temperature).toBe(0.2);
    expect(defaultBody.top_p).toBe(0.9);
    expect(defaultBody.max_tokens).toBeGreaterThan(30000);

    await adapter.generate({ userPrompt: "hi", generation: { topP: 0.3, maxTokens: 4096 } });
    const [, overrideInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const overrideBody = JSON.parse(String(overrideInit.body)) as Record<string, unknown>;
    expect(overrideBody.top_p).toBe(0.3);
    expect(overrideBody.max_tokens).toBe(4096);
  });

  it("rejects when the response has no text content", async () => {
    setLlmFetchForTesting(vi.fn().mockResolvedValue(jsonResponse({ content: [] })));

    const adapter = new AnthropicAdapter({ apiKey: "k", model: "m" });
    await expect(adapter.generate({ userPrompt: "hi" })).rejects.toThrow(
      "did not include text content",
    );
  });
});

describe("undici transport (real fetch path, no mocks)", () => {
  it("survives delayed response headers and still honors the app-level timeout", async () => {
    const { createServer } = await import("node:http");
    const server = createServer((req, res) => {
      // /slow delays HEADERS — the failure mode Node's built-in fetch kills at
      // a hard 300s; scaled down here to keep the test fast. The margin between
      // the 300ms app timeout and this delay is deliberately huge so the abort
      // assertion can never lose a wall-clock race on a loaded machine.
      const delay = req.url?.includes("slow") ? 5000 : 50;
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ choices: [{ message: { content: "{}" }, finish_reason: "stop" }] }),
        );
      }, delay);
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as { port: number }).port;

    try {
      // Delayed-headers request completes through the undici agent.
      const adapter = new OpenAiCompatibleAdapter({
        baseUrl: `http://127.0.0.1:${port}/v1`,
        model: "m",
        timeoutMs: 10000,
      });
      const result = await adapter.generate({ userPrompt: "hi" });
      expect(result.text).toBe("{}");
      expect(result.finishReason).toBe("stop");

      // Our AbortController remains the single timeout authority.
      const impatient = new OpenAiCompatibleAdapter({
        baseUrl: `http://127.0.0.1:${port}/slow/v1`,
        model: "m",
        timeoutMs: 300,
      });
      await expect(impatient.generate({ userPrompt: "hi" })).rejects.toMatchObject({
        name: "LlmHttpError",
        timedOut: true,
      });
    } finally {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
