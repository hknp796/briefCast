"use client";

import { site, plans, faqs } from "@/lib/site";

export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${site.url}/#app`,
        name: site.name,
        url: site.url,
        description: site.description,
        applicationCategory: "FinanceApplication",
        applicationSubCategory: "AI Market Agent / Audio Brief",
        operatingSystem: "All",
        isAccessibleForFree: true,
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price.replace(/[^\d]/g, "") || "0",
          priceCurrency: "INR",
          description: plan.pitch,
        })),
        featureList: [
          "Personalised 3-minute morning audio brief",
          "Autonomous AI market briefing agent",
          "NSE & Indian stock market watchlist tracking",
          "Delivered over Telegram before 9:15 AM IST open",
          "AI-synthesised price moves and overnight news",
          "English and Hinglish spoken market briefs",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon-512.png`,
        sameAs: ["https://t.me/briefcast_market_bot"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
