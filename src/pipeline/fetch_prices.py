#!/usr/bin/env python3
# Called by fetchMarketData.js via child_process
# Usage: python3 fetch_prices.py RELIANCE INFY HDFCBANK TCS
# Output: JSON array of ticker data

import sys
import json
import yfinance as yf
from datetime import datetime, timedelta

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

        prev_close  = round(float(prev["Close"]), 2)
        open_price  = round(float(today["Open"]), 2)
        high        = round(float(today["High"]), 2)
        low         = round(float(today["Low"]), 2)
        close       = round(float(today["Close"]), 2)
        volume      = int(today["Volume"])
        gap_pct     = round((open_price - prev_close) / prev_close * 100, 2)

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
    print(json.dumps(results))
