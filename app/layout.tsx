import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import { PWARegister } from "@/src/shared";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoinPulse | High-Performance Crypto Dashboard",
  description:
    "Interactive cryptocurrency dashboard built with Next.js (FSD Architecture) and native HTML5 Canvas. Zero dependencies chart.",
  keywords: [
    "Next.js 15",
    "HTML5 Canvas chart",
    "Crypto dashboard",
    "FSD architecture",
    "TypeScript portfolio",
  ],
  openGraph: {
    title: "CoinPulse App",
    description:
      "High-performance crypto analytics with native Canvas graphics.",
    url: "https://coin-pulse-rouge-beta.vercel.app/",
    siteName: "CoinPulse",
    images: [{ url: "/preview.png", width: 512, height: 512 }],
    locale: "en_US",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoinPulse",
  },
  verification: {
    google: "DmfI5cnpp6-USdOxFW3p9P59zjgHLiGPjsUs0bymuBs",
    yandex: "07c378ad82608c09",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />
        {children}
      </body>
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
