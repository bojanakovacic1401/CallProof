import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "OPENAI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Audio file is required.",
        },
        { status: 400 }
      );
    }

    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          ok: false,
          error: "Audio file is too large. Please upload a smaller file.",
        },
        { status: 400 }
      );
    }

    const openaiFormData = new FormData();
    openaiFormData.append("file", audio);
    openaiFormData.append("model", model);
    openaiFormData.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          ok: false,
          error: "Audio transcription failed.",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = (await response.json()) as {
      text?: string;
    };

    return NextResponse.json({
      ok: true,
      transcript: data.text || "",
      model,
      fileName: audio.name,
      fileSize: audio.size,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to transcribe audio.",
      },
      { status: 500 }
    );
  }
}