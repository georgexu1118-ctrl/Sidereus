"""
Agent 1: Data Collection
Gathers market data, price history, fundamentals, and news via yfinance.
"""

from __future__ import annotations
import json
from datetime import datetime, timedelta
from .base_agent import BaseAgent


class DataCollectionAgent(BaseAgent):
    ROLE = "Data Collection Specialist"
    PERSONA = (
        "You are a quantitative data analyst specializing in equity market data. "
        "You collect, validate, and synthesize financial data from multiple sources. "
        "You flag data quality issues and highlight anomalies."
    )

    def run(self) -> dict:
        try:
            import yfinance as yf
            import pandas as pd
        except ImportError:
            return {"error": "yfinance not installed. Run: pip install yfinance pandas"}

        ticker_obj = yf.Ticker(self.ticker)

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
