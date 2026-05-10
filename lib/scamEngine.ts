import type {
  AttackType,
  EvidenceItem,
  InputMode,
  RiskLevel,
  ScamAnalysis,
  ScamTactic,
} from "./types";

type Signal = {
  label: string;
  score: number;
  tactic?: ScamTactic;
  attackType?: AttackType;
  patterns: RegExp[];
  evidenceReason: string;
};

const signals: Signal[] = [
  {
    label: "Asks for verification code",
    score: 32,
    tactic: "Verification code request",
    attackType: "OTP theft",
    patterns: [
      /\b(code|otp|verification code|six digit|6 digit|one time password)\b/i,
      /\b(read|confirm|tell|share|send).{0,40}\b(code|otp|verification)\b/i,
    ],
    evidenceReason:
      "Scammers often ask for verification codes to take over accounts.",
  },
  {
    label: "Creates urgency",
    score: 16,
    tactic: "Urgency",
    patterns: [
      /\burgent\b/i,
      /\bimmediately\b/i,
      /\bnow\b/i,
      /\btoday\b/i,
      /\bfinal notice\b/i,
      /\bdo not wait\b/i,
      /\blimited time\b/i,
    ],
    evidenceReason:
      "Urgency pressures the victim to act before thinking or verifying.",
  },
  {
    label: "Impersonates authority",
    score: 20,
    tactic: "Authority",
    attackType: "Bank impersonation",
    patterns: [
      /\bbank\b/i,
      /\bsecurity department\b/i,
      /\btax office\b/i,
      /\bpolice\b/i,
      /\bgovernment\b/i,
      /\blegal action\b/i,
      /\bofficial notice\b/i,
    ],
    evidenceReason:
      "Authority language is commonly used to make scams feel legitimate.",
  },
  {
    label: "Discourages independent verification",
    score: 20,
    tactic: "Isolation",
    patterns: [
      /\bdo not hang up\b/i,
      /\bdon't hang up\b/i,
      /\bdo not call\b/i,
      /\bdon't call\b/i,
      /\bdo not open\b/i,
      /\bdon't tell anyone\b/i,
      /\bkeep this private\b/i,
    ],
    evidenceReason:
      "Scammers often isolate the victim from checking with trusted sources.",
  },
  {
    label: "Suspicious link",
    score: 24,
    tactic: "Suspicious link",
    attackType: "Delivery phishing",
    patterns: [
      /https?:\/\/[^\s]+/i,
      /\bbit\.ly\b/i,
      /\btinyurl\b/i,
      /\bclick here\b/i,
    ],
    evidenceReason:
      "Unexpected links can lead to phishing pages or payment traps.",
  },
  {
    label: "Requests payment",
    score: 22,
    tactic: "Payment request",
    patterns: [
      /\bpay\b/i,
      /\bpayment\b/i,
      /\bsend money\b/i,
      /\btransfer\b/i,
      /\bdeposit\b/i,
      /\bfee\b/i,
      /\bdebt\b/i,
      /\bEUR\b/i,
      /\bUSD\b/i,
    ],
    evidenceReason:
      "Unexpected payment requests are a major scam indicator.",
  },
  {
    label: "Family emergency pressure",
    score: 28,
    tactic: "Fear",
    attackType: "Family emergency scam",
    patterns: [
      /\bmom\b/i,
      /\bdad\b/i,
      /\bnew number\b/i,
      /\bbroke my phone\b/i,
      /\bcan't talk\b/i,
      /\bneed help urgently\b/i,
    ],
    evidenceReason:
      "Family emergency scams use panic and personal trust to trigger fast action.",
  },
  {
    label: "Too-good-to-be-true offer",
    score: 26,
    tactic: "Too good to be true",
    attackType: "Investment scam",
    patterns: [
      /\bguaranteed returns\b/i,
      /\bprivate investment\b/i,
      /\bcrypto\b/i,
      /\bprofit\b/i,
      /\bselected\b/i,
      /\bwithin 7 days\b/i,
      /\blimited spots\b/i,
    ],
    evidenceReason:
      "Unrealistic profit promises are common in investment and crypto scams.",
  },
  {
    label: "Requests personal data",
    score: 18,
    tactic: "Personal data request",
    patterns: [
      /\bpassword\b/i,
      /\bpin\b/i,
      /\bcard number\b/i,
      /\bpassport\b/i,
      /\bid number\b/i,
      /\bpersonal information\b/i,
    ],
    evidenceReason:
      "Requests for private data should be treated as high risk.",
  },
];

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 85) return "Critical";
  if (score >= 65) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function getConfidence(score: number, evidenceCount: number): "Low" | "Medium" | "High" {
  if (score >= 75 && evidenceCount >= 3) return "High";
  if (score >= 40 && evidenceCount >= 2) return "Medium";
  return "Low";
}

function pickAttackType(types: AttackType[], text: string): AttackType {
  const lowered = text.toLowerCase();

  if (types.includes("OTP theft")) return "OTP theft";
  if (lowered.includes("bank")) return "Bank impersonation";
  if (types.includes("Family emergency scam")) return "Family emergency scam";
  if (types.includes("Delivery phishing")) return "Delivery phishing";
  if (lowered.includes("tax") || lowered.includes("government")) {
    return "Government or tax scam";
  }
  if (types.includes("Investment scam")) return "Investment scam";
  if (lowered.includes("crypto")) return "Crypto scam";
  if (lowered.includes("password") || lowered.includes("account")) {
    return "Account takeover";
  }
  if (lowered.includes("link") || lowered.includes("http")) return "Generic phishing";

  return "Unknown";
}

function extractEvidence(text: string, pattern: RegExp, reason: string): EvidenceItem | null {
  const match = text.match(pattern);
  if (!match?.[0]) return null;

  const snippet = match[0].length > 120 ? `${match[0].slice(0, 120)}...` : match[0];

  return {
    text: snippet,
    reason,
  };
}

function buildSummary(score: number, attackType: AttackType, redFlags: string[]) {
  if (score >= 85) {
    return `This looks highly likely to be a scam. The strongest pattern is ${attackType.toLowerCase()}, with signals such as ${redFlags
      .slice(0, 3)
      .join(", ")}.`;
  }

  if (score >= 65) {
    return `This message or call contains multiple scam indicators. It should be treated as high risk before taking any action.`;
  }

  if (score >= 35) {
    return `This content has some suspicious signals. It may not be definitely malicious, but it should be verified through official channels.`;
  }

  return `This content does not show strong scam indicators, but it is still best to avoid sharing private codes, payment details, or personal information.`;
}

function buildSafeReply(score: number, attackType: AttackType) {
  if (score >= 65) {
    if (attackType === "OTP theft" || attackType === "Bank impersonation") {
      return "I will not share verification codes or banking details. I will contact my bank directly using the official number.";
    }

    if (attackType === "Delivery phishing") {
      return "I will not click this link. I will check the delivery status directly on the official courier website.";
    }

    if (attackType === "Family emergency scam") {
      return "I will not send money before confirming your identity through a call or another trusted contact.";
    }

    return "I will not share personal information, click links, or send money. I will verify this through official channels.";
  }

  if (score >= 35) {
    return "I need to verify this first through official channels before taking any action.";
  }

  return "Thanks for the message. I will follow up through the usual official channel if needed.";
}

function buildNextSteps(score: number, attackType: AttackType): string[] {
  if (score >= 65) {
    const steps = [
      "Do not click any links.",
      "Do not send money.",
      "Do not share verification codes, PINs, or passwords.",
      "Stop the conversation and verify through an official channel.",
      "Save a screenshot or recording as evidence.",
      "Block and report the sender or caller.",
    ];

    if (attackType === "Bank impersonation" || attackType === "OTP theft") {
      steps.splice(3, 0, "Call the official bank number printed on your card.");
    }

    return steps;
  }

  if (score >= 35) {
    return [
      "Do not share sensitive information yet.",
      "Check the sender or caller through an official source.",
      "Avoid clicking links until verified.",
      "Ask someone you trust if you are unsure.",
    ];
  }

  return [
    "No strong scam pattern detected.",
    "Still avoid sharing passwords, PINs, or verification codes.",
    "Use official channels for payments or account updates.",
  ];
}

function buildFamilyAdvice(score: number, attackType: AttackType) {
  if (score >= 65) {
    if (attackType === "Bank impersonation" || attackType === "OTP theft") {
      return "This looks dangerous. Do not share any code. Hang up and call the bank using the number on your card. Ask someone you trust before doing anything.";
    }

    if (attackType === "Family emergency scam") {
      return "This may be someone pretending to be a family member. Do not send money. Call the person on their old number or ask another family member to check.";
    }

    return "This looks risky. Do not click, pay, or reply. Ask someone you trust to help you check it.";
  }

  if (score >= 35) {
    return "This may be suspicious. Do not rush. Check with someone you trust before responding.";
  }

  return "This does not look very dangerous, but never share passwords, bank codes, or card details.";
}

export function analyzeScamContent({
  content,
  mode,
  familyMode,
}: {
  content: string;
  mode: InputMode;
  familyMode: boolean;
}): ScamAnalysis {
  const text = content.trim();

  if (!text) {
    return {
      scamProbability: 0,
      riskLevel: "Low",
      confidence: "Low",
      attackType: "Unknown",
      summary: "Add a message, transcript, or audio transcript to analyze.",
      redFlags: [],
      tactics: [],
      evidence: [],
      safeReply: "No content analyzed yet.",
      nextSteps: ["Add content to start the scan."],
      familyModeAdvice: "Add content to get simple safety advice.",
    };
  }

  let score = 0;
  const redFlags: string[] = [];
  const tactics: ScamTactic[] = [];
  const attackTypes: AttackType[] = [];
  const evidence: EvidenceItem[] = [];

  for (const signal of signals) {
    const matchedPattern = signal.patterns.find((pattern) => pattern.test(text));

    if (matchedPattern) {
      score += signal.score;
      redFlags.push(signal.label);

      if (signal.tactic) tactics.push(signal.tactic);
      if (signal.attackType) attackTypes.push(signal.attackType);

      const evidenceItem = extractEvidence(
        text,
        matchedPattern,
        signal.evidenceReason
      );

      if (evidenceItem) evidence.push(evidenceItem);
    }
  }

  if (mode === "audio" || mode === "transcript") {
    score += 4;
  }

  const lowered = text.toLowerCase();

  if (lowered.includes("bank") && lowered.includes("code")) {
    score += 16;
    attackTypes.push("Bank impersonation", "OTP theft");
  }

  if (lowered.includes("package") && lowered.includes("pay")) {
    score += 14;
    attackTypes.push("Delivery phishing");
  }

  if (lowered.includes("urgent") && lowered.includes("money")) {
    score += 12;
  }

  const normalizedScore = clamp(score, 0, 99);
  const attackType = pickAttackType(unique(attackTypes), text);
  const riskLevel = getRiskLevel(normalizedScore);
  const confidence = getConfidence(normalizedScore, evidence.length);

  const uniqueRedFlags = unique(redFlags);
  const uniqueTactics = unique(tactics);

  return {
    scamProbability: normalizedScore,
    riskLevel,
    confidence,
    attackType,
    summary: buildSummary(normalizedScore, attackType, uniqueRedFlags),
    redFlags: uniqueRedFlags,
    tactics: uniqueTactics,
    evidence: evidence.slice(0, 6),
    safeReply: buildSafeReply(normalizedScore, attackType),
    nextSteps: buildNextSteps(normalizedScore, attackType),
    familyModeAdvice: familyMode
      ? buildFamilyAdvice(normalizedScore, attackType)
      : "Turn on Family Mode to generate simpler safety guidance.",
  };
}