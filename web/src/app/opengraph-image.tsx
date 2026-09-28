import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          backgroundColor: "#08090b",
          backgroundImage:
            "radial-gradient(circle at 50% 100%, rgba(247, 164, 60, 0.18) 0%, rgba(8, 9, 11, 0) 70%)",
          color: "#eef0f3",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Horizon glow beam */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #f7a43c, transparent)",
          }}
        />

        {/* Top bar: Brand + Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Sunrise Squircle Icon */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 512 512"
              fill="none"
            >
              <rect
                width="512"
                height="512"
                rx="112"
                fill="#14171d"
                stroke="#343d4f"
                strokeWidth="16"
              />
              <path
                d="M 106 336 A 150 150 0 0 1 406 336 Z"
                fill="#fca83e"
              />
              <rect
                x="76"
                y="325"
                width="360"
                height="22"
                rx="11"
                fill="#ffeed1"
              />
            </svg>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#eef0f3",
              }}
            >
              {site.name}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 18px",
              borderRadius: "9999px",
              backgroundColor: "rgba(20, 23, 29, 0.8)",
              border: "1px solid #1f242c",
              fontSize: "16px",
              color: "#939aa6",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#f7a43c",
              }}
            />
            <span>Pre-market brief · 9:15 AM IST</span>
          </div>
        </div>

        {/* Main headline & subhead */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "16px",
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#eef0f3",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Your watchlist,</span>
            <span>
              <span style={{ color: "#f7a43c" }}>read to you</span> before the market opens.
            </span>
          </div>
          <p
            style={{
              fontSize: "24px",
              lineHeight: 1.45,
              color: "#939aa6",
              maxWidth: "920px",
              margin: 0,
            }}
          >
            Personalised 3-minute audio briefs for Indian retail traders. Overnight moves on stocks you own, delivered on Telegram before the bell.
          </p>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "24px",
            borderTop: "1px solid #1f242c",
            color: "#626a77",
            fontSize: "18px",
          }}
        >
          <span>briefcast.in</span>
          <span>NSE Watchlist · Telegram Audio · AI-Powered</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
