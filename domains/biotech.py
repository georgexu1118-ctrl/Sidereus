"""
Biotech domain: historical probability of clinical success, FDA pathway intelligence,
indication-specific market sizing.
"""

from __future__ import annotations


# Historical PoS by phase (Biomedtracker/IQVIA data, ~2023 vintage)
PROBABILITY_OF_SUCCESS = {
    "Phase_1_to_approval": {
        "oncology": 0.05,
        "neurology": 0.07,
        "rare_disease": 0.17,
        "infectious_disease": 0.14,
        "immunology": 0.10,
        "cardiology": 0.12,
        "all": 0.10,
    },
    "Phase_1_to_Phase_2": {
        "oncology": 0.55,
        "rare_disease": 0.68,
        "all": 0.63,
    },
    "Phase_2_to_Phase_3": {
        "oncology": 0.28,
        "rare_disease": 0.46,
        "immunology": 0.45,
        "all": 0.37,
    },
    "Phase_3_to_approval": {
        "oncology": 0.50,
        "rare_disease": 0.72,
        "all": 0.58,
    },
}

# FDA expedited pathways
FDA_PATHWAYS = {
    "Breakthrough Therapy": {
        "criteria": "Preliminary clinical evidence shows substantial improvement over available therapy",
        "benefit": "Intensive FDA guidance, rolling review, priority review",
        "avg_approval_time_months": 8,
        "historical_approval_rate": 0.89,
    },
    "Accelerated Approval": {
        "criteria": "Surrogate or intermediate endpoint reasonably likely to predict clinical benefit",
        "benefit": "Earlier approval, confirmatory trial required post-approval",
        "risk": "Risk of withdrawal if confirmatory trial fails",
    },
    "Fast Track": {
        "criteria": "Treat serious condition AND unmet medical need",
        "benefit": "More frequent FDA meetings, rolling review eligible",
        "avg_approval_time_months": 12,
    },
    "Priority Review": {
        "criteria": "Significant improvement over available therapy",
        "benefit": "6-month review vs standard 10-12 months",
    },
    "RMAT": {
        "criteria": "Regenerative medicine (cell/gene therapy) with preliminary evidence",
        "benefit": "Similar to Breakthrough Therapy designation",
    },
}

# Commercial market benchmarks by indication
COMMERCIAL_BENCHMARKS = {
    "NSCLC_first_line": {
        "tam_usd_bn": 12.0,
        "peak_sales_blockbuster_usd_bn": 5.0,
        "key_competitors": ["Keytruda", "Opdivo", "Tecentriq"],
        "pricing_benchmark_usd_annual": 180000,
    },
    "DLBCL_relapsed": {
        "tam_usd_bn": 2.5,
        "peak_sales_blockbuster_usd_bn": 1.5,
        "key_competitors": ["Kymriah", "Yescarta", "Breyanzi"],
        "pricing_benchmark_usd_annual": 450000,
    },
    "Alzheimers_early": {
        "tam_usd_bn": 20.0,
        "peak_sales_blockbuster_usd_bn": 8.0,
        "key_competitors": ["Leqembi", "Kisunla"],
        "pricing_benchmark_usd_annual": 26500,
    },
    "GLP1_obesity": {
        "tam_usd_bn": 100.0,
        "peak_sales_blockbuster_usd_bn": 20.0,
        "key_competitors": ["Ozempic", "Wegovy", "Mounjaro", "Zepbound"],
        "pricing_benchmark_usd_annual": 16000,
    },
    "Rare_genetic": {
        "tam_usd_bn": 1.5,
        "peak_sales_blockbuster_usd_bn": 1.0,
        "pricing_benchmark_usd_annual": 500000,
        "note": "Orphan pricing power; high PoS vs. other indications",
    },
}


class BiotechDomain:
    """Domain controller for biotech analysis."""

    def get_pos(self, phase: str, indication: str = "all") -> float:
        """Get probability of success from phase to approval or next phase."""
        phase_data = PROBABILITY_OF_SUCCESS.get(phase, {})
        return phase_data.get(indication, phase_data.get("all", 0.0))

    def get_fda_pathway(self, pathway: str) -> dict:
        return FDA_PATHWAYS.get(pathway, {})

    def get_market_benchmark(self, indication: str) -> dict:
        return COMMERCIAL_BENCHMARKS.get(indication, {})

    def get_all_pathways(self) -> dict:
        return FDA_PATHWAYS

    def expected_value_analysis(self, peak_sales_usd_bn: float, phase: str,
                                indication: str = "all",
                                royalty_rate: float = 0.0,
                                years_to_peak: int = 5,
                                discount_rate: float = 0.12) -> dict:
        """
        Simple rNPV calculation for a drug asset.
        """
        pos = self.get_pos(f"{phase}_to_approval", indication)
        if pos == 0:
            pos = self.get_pos("Phase_1_to_approval", indication)

        # Rough NPV: peak_sales * margin * years / discount
        gross_margin = 0.75  # typical biotech
        operating_margin = 0.50
        revenue_stream = peak_sales_usd_bn * operating_margin
        discount_factor = (1 + discount_rate) ** years_to_peak
        npv_unadjusted = (revenue_stream * 8) / discount_factor  # ~8x EBIT multiple on peak
        rnpv = npv_unadjusted * pos

        return {
            "phase": phase,
            "indication": indication,
            "probability_of_success": pos,
            "peak_sales_usd_bn": peak_sales_usd_bn,
            "rnpv_usd_bn": round(rnpv, 2),
            "npv_unadjusted_usd_bn": round(npv_unadjusted, 2),
            "note": "Simplified rNPV. Refine with actual COGS, opex, timeline.",
        }
