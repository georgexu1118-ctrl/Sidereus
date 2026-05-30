"""
Agent 1: Data Collection
Gathers market data, price history, fundamentals, and news via multiple APIs.
"""

from __future__ import annotations
import json
import os
from datetime import datetime
from typing import Any

import requests
from .base_agent import BaseAgent


class DataCollectionAgent(BaseAgent):
    ROLE = "Data Collection Specialist"
    PERSONA = (
        "You are a quantitative data analyst specializing in equity market data. "
        "You collect, validate, and synthesize financial data from multiple sources. "
        "You flag data quality issues and highlight anomalies."
    )
    _HTTP_TIMEOUT = 10
    _USER_AGENT = "Sidereus/1.0 (+market-data)"

    def _candidate_symbols(self, symbol: str) -> list[str]:
        """
        Build likely exchange-qualified variants for global symbols.
        """
        s = symbol.upper().strip()
        candidates = [s]

        # Japan numeric tickers are frequently represented as 4 digits + .T
        if s.isdigit() and len(s) == 4:
            candidates.append(f"{s}.T")

        # China A-share common patterns.
        if s.isdigit() and len(s) == 6:
            if s.startswith(("6", "9")):
                candidates.append(f"{s}.SS")
            if s.startswith(("0", "3")):
                candidates.append(f"{s}.SZ")

        return list(dict.fromkeys(candidates))

    def _fetch_finnhub_quote(self, symbol: str) -> dict[str, Any] | None:
        api_key = os.getenv("FINNHUB_API_KEY", "").strip()
        if not api_key:
            return None

        for candidate in self._candidate_symbols(symbol):
            try:
                r = requests.get(
                    "https://finnhub.io/api/v1/quote",
                    params={"symbol": candidate, "token": api_key},
                    headers={"User-Agent": self._USER_AGENT},
                    timeout=self._HTTP_TIMEOUT,
                )
                if r.status_code != 200:
                    continue
                data = r.json()
                last = float(data.get("c", 0) or 0)
                if last <= 0:
                    continue
                ts = int(data.get("t", 0) or 0)
                return {
                    "provider": "finnhub",
                    "symbol_used": candidate,
                    "currency": None,
                    "price": round(last, 6),
                    "open": data.get("o"),
                    "high": data.get("h"),
                    "low": data.get("l"),
                    "previous_close": data.get("pc"),
                    "change": data.get("d"),
                    "change_percent": data.get("dp"),
                    "as_of": datetime.fromtimestamp(ts).isoformat() if ts > 0 else datetime.now().isoformat(),
                    "is_realtime": True,
                }
            except Exception:
                continue
        return None

    def _fetch_twelvedata_quote(self, symbol: str) -> dict[str, Any] | None:
        api_key = os.getenv("TWELVEDATA_API_KEY", "").strip()
        if not api_key:
            return None

        for candidate in self._candidate_symbols(symbol):
            try:
                r = requests.get(
                    "https://api.twelvedata.com/quote",
                    params={"symbol": candidate, "apikey": api_key},
                    headers={"User-Agent": self._USER_AGENT},
                    timeout=self._HTTP_TIMEOUT,
                )
                if r.status_code != 200:
                    continue
                data = r.json()
                if data.get("status") == "error":
                    continue
                close = data.get("close")
                if close is None:
                    continue
                return {
                    "provider": "twelvedata",
                    "symbol_used": candidate,
                    "currency": data.get("currency"),
                    "price": float(close),
                    "open": data.get("open"),
                    "high": data.get("high"),
                    "low": data.get("low"),
                    "previous_close": data.get("previous_close"),
                    "change": data.get("change"),
                    "change_percent": data.get("percent_change"),
                    "as_of": data.get("datetime") or datetime.now().isoformat(),
                    "is_realtime": True,
                }
            except Exception:
                continue
        return None

    def _fetch_yahoo_quote(self, ticker_obj) -> dict[str, Any] | None:
        try:
            # fast_info is usually cheaper/faster than full .info fetch.
            fi = ticker_obj.fast_info or {}
            if fi:
                last = fi.get("lastPrice")
                if last is not None:
                    return {
                        "provider": "yahoo",
                        "symbol_used": self.ticker,
                        "currency": fi.get("currency"),
                        "price": float(last),
                        "open": fi.get("open"),
                        "high": fi.get("dayHigh"),
                        "low": fi.get("dayLow"),
                        "previous_close": fi.get("previousClose"),
                        "change": None,
                        "change_percent": None,
                        "as_of": datetime.now().isoformat(),
                        "is_realtime": False,  # may be delayed on many exchanges
                    }
        except Exception:
            pass
        return None

    def _fetch_live_quote(self, ticker_obj) -> dict[str, Any]:
        order = os.getenv("MARKET_DATA_PROVIDER_ORDER", "finnhub,twelvedata,yahoo")
        providers = [p.strip().lower() for p in order.split(",") if p.strip()]
        for provider in providers:
            if provider == "finnhub":
                q = self._fetch_finnhub_quote(self.ticker)
                if q:
                    return q
            elif provider == "twelvedata":
                q = self._fetch_twelvedata_quote(self.ticker)
                if q:
                    return q
            elif provider == "yahoo":
                q = self._fetch_yahoo_quote(ticker_obj)
                if q:
                    return q
        return {
            "provider": "none",
            "symbol_used": self.ticker,
            "price": None,
            "as_of": datetime.now().isoformat(),
            "is_realtime": False,
            "warning": "No live quote provider returned data. Configure FINNHUB_API_KEY or TWELVEDATA_API_KEY.",
        }

    def run(self) -> dict:
        try:
            import yfinance as yf
        except ImportError:
            return {"error": "yfinance not installed. Run: pip install yfinance"}

        ticker_obj = yf.Ticker(self.ticker)
        live_quote = self._fetch_live_quote(ticker_obj)

        # --- Market data ---
        info = {}
        try:
            info = ticker_obj.info or {}
        except Exception:
            pass

        # --- Price history (1Y) ---
        hist = {}
        try:
            df = ticker_obj.history(period="1y")
            if not df.empty:
                hist = {
                    "start_date": str(df.index[0].date()),
                    "end_date": str(df.index[-1].date()),
                    "start_price": round(float(df["Close"].iloc[0]), 2),
                    "end_price": round(float(df["Close"].iloc[-1]), 2),
                    "52w_high": round(float(df["High"].max()), 2),
                    "52w_low": round(float(df["Low"].min()), 2),
                    "avg_volume": int(df["Volume"].mean()),
                    "price_change_pct": round(
                        (float(df["Close"].iloc[-1]) / float(df["Close"].iloc[0]) - 1) * 100, 2
                    ),
                }
        except Exception:
            pass

        # --- Key financials from info ---
        key_fields = [
            "marketCap", "enterpriseValue", "trailingPE", "forwardPE",
            "priceToBook", "priceToSalesTrailing12Months", "enterpriseToRevenue",
            "enterpriseToEbitda", "profitMargins", "operatingMargins",
            "revenueGrowth", "earningsGrowth", "returnOnEquity", "returnOnAssets",
            "totalDebt", "totalCash", "freeCashflow", "operatingCashflow",
            "totalRevenue", "grossProfits", "ebitda", "netIncomeToCommon",
            "sharesOutstanding", "beta", "dividendYield",
            "sector", "industry", "fullTimeEmployees", "country",
            "shortPercentOfFloat", "shortRatio",
        ]

        fundamentals = {k: info.get(k) for k in key_fields if info.get(k) is not None}

        # --- Analyst recommendations summary ---
        rec_summary = {}
        try:
            rec = ticker_obj.recommendations_summary
            if rec is not None and not rec.empty:
                row = rec.iloc[0]
                rec_summary = {
                    "strongBuy": int(row.get("strongBuy", 0)),
                    "buy": int(row.get("buy", 0)),
                    "hold": int(row.get("hold", 0)),
                    "sell": int(row.get("sell", 0)),
                    "strongSell": int(row.get("strongSell", 0)),
                }
        except Exception:
            pass

        # --- News headlines ---
        news = []
        try:
            raw_news = ticker_obj.news or []
            for item in raw_news[:10]:
                ct = item.get("content", {})
                news.append({
                    "title": ct.get("title", item.get("title", "")),
                    "publisher": ct.get("provider", {}).get("displayName", item.get("publisher", "")),
                    "date": ct.get("pubDate", item.get("providerPublishTime", "")),
                })
        except Exception:
            pass

        result = {
            "ticker": self.ticker,
            "company_name": self.company_name,
            "collected_at": datetime.now().isoformat(),
            "live_quote": live_quote,
            "price_history": hist,
            "fundamentals": fundamentals,
            "analyst_recommendations": rec_summary,
            "recent_news_headlines": news,
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "description": (info.get("longBusinessSummary", ""))[:1000],
        }

        self.add_evidence("yfinance", json.dumps(result, default=str)[:3000])
        self.output = result
        return result
