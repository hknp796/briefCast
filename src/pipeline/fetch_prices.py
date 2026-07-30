#!/usr/bin/env python3
# Called by fetchMarketData.js via child_process
# Usage: python3 fetch_prices.py RELIANCE INFY HDFCBANK TCS
# Output: JSON array of ticker data

import sys
import json
import math
import yfinance as yf
from datetime import datetime, timedelta

# yfinance returns NaN for an incomplete daily bar (thinly traded or newly
# listed tickers, or a bar the exchange hasn't filled in yet). json.dumps would
# emit a bare NaN, which is invalid JSON — JSON.parse on the Node side then
# throws and takes the whole batch down with it. Treat NaN as missing instead.
def clean(value, ndigits=2):
    f = float(value)
    if not math.isfinite(f):
        return None
    return round(f, ndigits)


def fetch_ticker(symbol):
    # NSE symbols need .NS suffix for Yahoo Finance
    yf_symbol = f"{symbol}.NS"

    try:
        ticker = yf.Ticker(yf_symbol)

        # Fetch last 5 days to ensure we get prev_close even on Mondays
        hist = ticker.history(period="5d", interval="1d")

        if hist.empty or len(hist) < 2:
            return { "ticker": symbol, "error": "No data returned" }

        today   = hist.iloc[-1]
        prev    = hist.iloc[-2]

        prev_close  = clean(prev["Close"])
        open_price  = clean(today["Open"])
        high        = clean(today["High"])
        low         = clean(today["Low"])
        close       = clean(today["Close"])
        raw_volume  = clean(today["Volume"], 0)
        volume      = int(raw_volume) if raw_volume is not None else None

        # No prev_close or open means there is no gap to report — the whole
        # point of the brief. Fail this ticker rather than emit a null gap.
        if not prev_close or open_price is None:
            return { "ticker": symbol, "error": "Incomplete price data" }

        gap_pct = round((open_price - prev_close) / prev_close * 100, 2)

        return {
            "ticker":     symbol,
            "prev_close": prev_close,
            "open":       open_price,
            "high":       high,
            "low":        low,
            "close":      close,
            "volume":     volume,
            "gap_pct":    gap_pct,
            "error":      None
        }

    except Exception as e:
        return { "ticker": symbol, "error": str(e) }


if __name__ == "__main__":
    symbols = sys.argv[1:]

    if not symbols:
        print(json.dumps([]))
        sys.exit(0)

    results = [fetch_ticker(s) for s in symbols]

    # allow_nan=False so anything still non-finite raises here instead of
    # printing invalid JSON. Degrade to per-ticker errors — a bad value in one
    # ticker should not corrupt the batch.
    try:
        print(json.dumps(results, allow_nan=False))
    except ValueError:
        print(json.dumps([
            { "ticker": s, "error": "Non-finite value in price data" }
            for s in symbols
        ]))
