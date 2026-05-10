import type {
  AttackType,
  Confidence,
  InputMode,
  RiskLevel,
  ScamAnalysis,
  ScamTactic,
} from "./types";

type AiScamAnalysis = {
  scamProbability: number;
  riskLevel: RiskLevel;
  confidence: Confidence;
  attackType: AttackType;
  summary: string;
  redFlags: string[];
  tactics: ScamTactic[];
  evidence: {
    text: string;
    reason: string;
  }[];
  safeReply: string;
  nextSteps: string[];
  familyModeAdvice: string;
};

const attackTypes: AttackType[] = [
  "Bank impersonation",
  "OTP theft",
  "Delivery phishing",
  "Family emergency scam",
  "Government or tax scam",
  "Investment scam",
  "Crypto scam",
  "Job offer scam",
  "Romance scam",
  "Account takeover",
  "Generic phishing",
  "Unknown",
];

const tactics: ScamTactic[] = [
  "Urgency",
  "Fear",
  "Authority",
  "Secrecy",
  "Financial pressure",
  "Too good to be true",
  "Verification code request",
  "Suspicious link",
  "Personal data request",
  "Payment request",
  "Impersonation",
  "Isolation",
];

function extractOutputText(data: unknown): string {
  const response = data as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text || "")
      .join("") || ""
  );
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeAiAnalysis(
  parsed: AiScamAnalysis,
  fallback: ScamAnalysis
): ScamAnalysis {
  const scamProbability = Math.max(
    0,
    Math.min(99, Math.round(parsed.scamProbability))
  );

  const riskLevel = parsed.riskLevel || fallback.riskLevel;
  const confidence = parsed.confidence || fallback.confidence;

  const attackType = attackTypes.includes(parsed.attackType)
    ? parsed.attackType
    : fallback.attackType;

  const normalizedTactics = parsed.tactics.filter((tactic) =>
    tactics.includes(tactic)
  );

  return {
    scamProbability,
    riskLevel,
    confidence,
    attackType,
    summary: parsed.summary || fallback.summary,
    redFlags: parsed.redFlags.slice(0, 8),
    tactics: normalizedTactics.slice(0, 8),
    evidence: parsed.evidence
      .filter((item) => item.text && item.reason)
      .slice(0, 6),
    safeReply: parsed.safeReply || fallback.safeReply,
    nextSteps: parsed.nextSteps.slice(0, 8),
    familyModeAdvice: parsed.familyModeAdvice || fallback.familyModeAdvice,
  };
}

export async function analyzeWithOpenAI({
  content,
  mode,
  familyMode,
  fallback,
}: {
  content: string;
  mode: InputMode;
  familyMode: boolean;
  fallback: ScamAnalysis;
}): Promise<ScamAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: "system",
          content:
            "You are a fraud and social-engineering analyst. Analyze suspicious messages and call transcripts. Detect scam probability, attack type, manipulation tactics, red flags, evidence, and safe next steps. Return only JSON that matches the schema.",
        },
        {
          role: "user",
          content: JSON.stringify({
            inputMode: mode,
            familyMode,
            content,
            fallbackRuleBasedAnalysis: fallback,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "callproof_scam_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "scamProbability",
              "riskLevel",
              "confidence",
              "attackType",
              "summary",
              "redFlags",
              "tactics",
              "evidence",
              "safeReply",
              "nextSteps",
              "familyModeAdvice",
            ],
            properties: {
              scamProbability: {
                type: "number",
                minimum: 0,
                maximum: 99,
              },
              riskLevel: {
                type: "string",
                enum: ["Low", "Medium", "High", "Critical"],
              },
              confidence: {
                type: "string",
                enum: ["Low", "Medium", "High"],
              },
              attackType: {
                type: "string",
                enum: attackTypes,
              },
              summary: {
                type: "string",
              },
              redFlags: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              tactics: {
                type: "array",
                items: {
                  type: "string",
                  enum: tactics,
                },
              },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["text", "reason"],
                  properties: {
                    text: {
                      type: "string",
                    },
                    reason: {
                      type: "string",
                    },
                  },
                },
              },
              safeReply: {
                type: "string",
              },
              nextSteps: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              familyModeAdvice: {
                type: "string",
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI scam analysis failed");
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  const parsed = safeJsonParse<AiScamAnalysis>(outputText);

  if (!parsed) return null;

  return normalizeAiAnalysis(parsed, fallback);
}