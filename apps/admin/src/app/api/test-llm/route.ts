import { NextRequest, NextResponse } from "next/server";
import {
  resolveOnlineLlmAdapter,
} from "@/lib/llm/adapter";

export async function POST(request: NextRequest) {
  try {
    // Get LLM adapter
    const resolved = await resolveOnlineLlmAdapter();
    if (!resolved) {
      return NextResponse.json(
        { message: "No online LLM connection available" },
        { status: 503 }
      );
    }

    const { adapter } = resolved;

    // Test prompt - simple and quick
    const testPrompt = "Just reply OK";
    
    const result = await adapter.generate({
      userPrompt: testPrompt,
    });

    return NextResponse.json({
      message: "LLM connection successful",
      response: result.text,
    });
  } catch (error) {
    console.error("Test LLM endpoint error:", error);
    return NextResponse.json(
      { 
        message: "LLM test failed. Check logs for details.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
