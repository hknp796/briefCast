import { site, plans } from "@/lib/site";

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
        operatingSystem: "All",
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price.replace(/[^\d]/g, "") || "0",
          priceCurrency: "INR",
          description: plan.pitch,
        })),
        featureList: [
          "Personalised 3-minute morning audio brief",
          "NSE & Indian stock market watchlist tracking",
          "Delivered over Telegram before 9:15 AM IST open",
          "AI-synthesised price moves and overnight news",
        ],
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
