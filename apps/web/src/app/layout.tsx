import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

import "./globals.css";

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Pantry OS",
  description: "Shared pantry inventory with Auth.js passkeys and invite links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${monoFont.variable} font-[family-name:var(--font-body)] text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
