export type InputMode = "message" | "transcript" | "audio";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type AttackType =
  | "Bank impersonation"
  | "OTP theft"
  | "Delivery phishing"
  | "Family emergency scam"
  | "Government or tax scam"
  | "Investment scam"
  | "Crypto scam"
  | "Job offer scam"
  | "Romance scam"
  | "Account takeover"
  | "Generic phishing"
  | "Unknown";

export type ScamTactic =
  | "Urgency"
  | "Fear"
  | "Authority"
  | "Secrecy"
  | "Financial pressure"
  | "Too good to be true"
  | "Verification code request"
  | "Suspicious link"
  | "Personal data request"
  | "Payment request"
  | "Impersonation"
  | "Isolation";

export type DemoCase = {
  id: string;
  title: string;
  subtitle: string;
  mode: InputMode;
  content: string;
};

export type EvidenceItem = {
  text: string;
  reason: string;
};

export type ScamAnalysis = {
  scamProbability: number;
  riskLevel: RiskLevel;
  confidence: "Low" | "Medium" | "High";
  attackType: AttackType;
  summary: string;
  redFlags: string[];
  tactics: ScamTactic[];
  evidence: EvidenceItem[];
  safeReply: string;
  nextSteps: string[];
  familyModeAdvice: string;
};

export type ScanHistoryItem = {
  id: string;
  createdAt: string;
  mode: InputMode;
  title: string;
  score: number;
  riskLevel: RiskLevel;
  attackType: AttackType;
};