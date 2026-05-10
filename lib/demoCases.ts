import type { DemoCase } from "./types";

export const demoCases: DemoCase[] = [
  {
    id: "fake-bank-call",
    title: "Fake bank call",
    subtitle: "Caller asks for a verification code",
    mode: "transcript",
    content: `Hello, this is the security department from your bank. We detected suspicious activity on your account.

To prevent your account from being blocked, please stay on the line and confirm the six digit code we just sent to your phone.

Do not hang up and do not open your banking app while we verify your identity. This is urgent.`,
  },
  {
    id: "delivery-phishing",
    title: "Delivery phishing SMS",
    subtitle: "Small payment and suspicious link",
    mode: "message",
    content: `Your package is waiting at the warehouse. Pay 1.99 EUR now to avoid return.

Confirm delivery here: https://bit.ly/delivery-fee-now`,
  },
  {
    id: "family-emergency",
    title: "Family emergency message",
    subtitle: "Impersonates a family member",
    mode: "message",
    content: `Mom, I broke my phone and this is my new number. I need help urgently.

Please send 450 EUR now. Don't call me, I can't talk. I will explain later.`,
  },
  {
    id: "tax-scam",
    title: "Government tax scam",
    subtitle: "Fake authority and payment threat",
    mode: "message",
    content: `Final notice from the tax office. You have unpaid tax debt.

Pay immediately using this secure link or legal action will begin today: http://tax-office-payment-alert.com`,
  },
  {
    id: "investment-scam",
    title: "Investment opportunity scam",
    subtitle: "Too-good-to-be-true profit promise",
    mode: "message",
    content: `You have been selected for a private crypto investment group.

Deposit 250 EUR today and receive guaranteed returns of 5,000 EUR within 7 days. Limited spots available.`,
  },
  {
    id: "clean-message",
    title: "Safe appointment reminder",
    subtitle: "Normal non-scam message",
    mode: "message",
    content: `Hi, this is a reminder that your dentist appointment is tomorrow at 10:30. Please call the clinic if you need to reschedule.`,
  },
];

export const defaultDemoCase = demoCases[0];

export const simulatedAudioTranscript = demoCases[0].content;