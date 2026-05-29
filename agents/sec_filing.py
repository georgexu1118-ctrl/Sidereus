"""
Agent 2: SEC Filing Analysis
Reads 10-K and 10-Q filings. Extracts risk factors, MD&A, and financial statements.
"""

from __future__ import annotations
import json
import re
import requests
from datetime import datetime
from .base_agent import BaseAgent


EDGAR_BASE = "https://data.sec.gov"
HEADERS = {
    "User-Agent": "EquityResearchOS research@equity-os.com",
    "Accept-Encoding": "gzip, deflate",
}


def _get_cik(ticker: str) -> str | None:
    """Resolve ticker to CIK via EDGAR company search."""
    try:
        url = f"{EDGAR_BASE}/submissions/CIK{ticker.upper().zfill(10)}.json"
        # Try ticker lookup first
        tickers_url = "https://www.sec.gov/files/company_tickers.json"
        r = requests.get(tickers_url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            data = r.json()
            for entry in data.values():
                if entry.get("ticker", "").upper() == ticker.upper():
                    return str(entry["cik_str"]).zfill(10)
    except Exception:
        pass
    return None


def _get_recent_filings(cik: str, form_type: str = "10-K", count: int = 2) -> list[dict]:
    """Get recent filings of a given type from EDGAR."""
    try:
        url = f"{EDGAR_BASE}/submissions/CIK{cik}.json"
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code != 200:
            return []
        data = r.json()
        filings = data.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])
        docs = filings.get("primaryDocument", [])

        results = []
        for i, form in enumerate(forms):
            if form == form_type and len(results) < count:
                results.append({
                    "form": form,
                    "date": dates[i],
                    "accession": accessions[i].replace("-", ""),
                    "document": docs[i],
                    "cik": cik,
                })
        return results
    except Exception:
        return []


def _fetch_filing_text(cik: str, accession: str, document: str, max_chars: int = 8000) -> str:
    """Fetch the primary filing document text."""
    try:
        url = f"https://www.sec.gov/Archives/edgar/full-index/{cik}/{accession}/{document}"
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            # Try the index
            idx_url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=10-K&dateb=&owner=include&count=5"
            return f"[Filing text unavailable - status {r.status_code}]"
        text = r.text
        # Strip HTML tags
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:max_chars]
    except Exception as e:
        return f"[Error fetching filing: {e}]"


class SECFilingAgent(BaseAgent):
    ROLE = "SEC Filing Analyst"
    PERSONA = (
        "You are a specialist in SEC filing analysis at a top institutional research firm. "
        "You extract risk factors, MD&A commentary, segment-level revenue detail, "
        "off-balance-sheet items, and management forward guidance from 10-K and 10-Q filings. "
        "You flag material changes year-over-year and identify hidden risks in footnotes."
    )

    def run(self) -> dict:
        cik = _get_cik(self.ticker)
        if not cik:
            analysis = self._research_call(
                f"Analyze {self.company_name} ({self.ticker}) from memory. "
                "Describe key risk factors, business segments, and recent MD&A themes. "
                "Note: No live EDGAR data available for this run.",
                max_tokens=2048,
            )
            return {"cik": None, "analysis": analysis, "filings": []}

        # Fetch recent 10-K and 10-Q
        ten_k = _get_recent_filings(cik, "10-K", count=1)
        ten_q = _get_recent_filings(cik, "10-Q", count=1)
        all_filings = ten_k + ten_q

        filing_texts = []
        for f in all_filings[:2]:
            text = _fetch_filing_text(f["cik"], f["accession"], f["document"])
            filing_texts.append({
                "form": f["form"],
                "date": f["date"],
                "excerpt": text,
            })

        combined_text = "\n\n".join(
            f"=== {ft['form']} ({ft['date']}) ===\n{ft['excerpt']}"
            for ft in filing_texts
        ) or "No filing text retrieved."

        analysis = self._research_call(
            "Analyze these SEC filing excerpts. Produce:\n"
            "1. Top 5 risk factors with severity (High/Medium/Low)\n"
            "2. MD&A key themes and management commentary\n"
            "3. Segment-level revenue breakdown (if available)\n"
            "4. Year-over-year material changes\n"
            "5. Off-balance-sheet items or contingent liabilities\n"
            "6. Forward guidance signals\n"
            "7. Any language indicating deterioration or acceleration\n\n"
            "Format as structured analysis, not bullet soup.",
            context=combined_text,
            max_tokens=3000,
        )

        result = {
            "cik": cik,
            "filings_retrieved": [{"form": f["form"], "date": f["date"]} for f in all_filings],
            "analysis": analysis,
        }
        self.output = result
        return result
