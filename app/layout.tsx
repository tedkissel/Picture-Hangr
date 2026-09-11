import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wall Hangr — Precision Picture Layouts",
  description: "Design a gallery wall and calculate every nail from one exact reference point.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
