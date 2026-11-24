import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { site } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

// One grotesk (drawn for a news publisher) for headlines and body, plus a
// terminal mono for anything that is literally machine output.
const bodySans = Schibsted_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const terminalMono = IBM_Plex_Mono({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  alternates: {
    canonical: "/",
  },
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "market brief", "NSE", "Indian stock market", "audio brief",
    "retail traders", "watchlist", "pre-market", "Telegram",
    "AI agent", "stock market AI", "financial AI agent", "AI market brief",
  ],
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${bodySans.variable} ${terminalMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-bright">
        <JsonLd />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
