import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CallProof",
  description: "AI-powered scam call and message risk analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}