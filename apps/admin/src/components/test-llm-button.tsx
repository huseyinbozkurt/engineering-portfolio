"use client";

import { Activity } from "lucide-react";
import { useState, useTransition } from "react";

interface TestLlmButtonProps {
  /** Initial disabled state if no LLM is available */
  disabled?: boolean;
}

export function TestLlmButton({ disabled = false }: TestLlmButtonProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function testLlmConnection() {
    if (disabled) return;
    
    setIsTesting(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/test-llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Just reply OK" }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setResult({
        success: true,
        message: data.response || "LLM is working correctly.",
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={testLlmConnection}
        disabled={disabled || isTesting}
        className={`ui-btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition ${
          result?.success ? "text-success-200 border-success-400/30" : ""
        }`}
      >
        <Activity className="size-4" aria-hidden />
        {isTesting ? "Testing..." : "Test LLM Connection"}
      </button>
      
      {result && (
        <span
          className={`text-xs font-medium ${
            result.success
              ? "text-success-200"
              : "text-danger-200"
          }`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
