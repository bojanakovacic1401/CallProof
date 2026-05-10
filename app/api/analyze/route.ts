import { NextResponse } from "next/server";
import { analyzeWithOpenAI } from "@/lib/aiAnalyzer";
import { analyzeScamContent } from "@/lib/scamEngine";
import type { InputMode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const body = await request.json();

    const content = String(body.content || "");
    const mode = String(body.mode || "message") as InputMode;
    const familyMode = Boolean(body.familyMode);

    if (!content.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Content is required.",
        },
        { status: 400 }
      );
    }

    const fallbackAnalysis = analyzeScamContent({
      content,
      mode,
      familyMode,
    });

    let analysis = fallbackAnalysis;
    let aiEnabled = false;

    try {
      const aiAnalysis = await analyzeWithOpenAI({
        content,
        mode,
        familyMode,
        fallback: fallbackAnalysis,
      });

      if (aiAnalysis) {
        analysis = aiAnalysis;
        aiEnabled = true;
      }
    } catch {
      analysis = fallbackAnalysis;
      aiEnabled = false;
    }

    return NextResponse.json({
      ok: true,
      analysis,
      aiEnabled,
      fallbackAnalysis,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to analyze scam content.",
      },
      { status: 500 }
    );
  }
}