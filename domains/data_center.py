"""
Data Center Ecosystem domain: capex cycle tracking, power infrastructure, cooling technology.
"""

from __future__ import annotations


HYPERSCALER_CAPEX_GUIDANCE = {
    "MSFT": {"FY2025_capex_usd_bn": 80, "primary_use": "Azure AI infrastructure, data centers"},
    "GOOGL": {"CY2025_capex_usd_bn": 75, "primary_use": "TPU clusters, global data centers"},
    "AMZN": {"CY2025_capex_usd_bn": 104, "primary_use": "AWS, Project Kuiper"},
    "META": {"CY2025_capex_usd_bn": 65, "primary_use": "AI compute, Llama training"},
    "ORCL": {"FY2025_capex_usd_bn": 15, "primary_use": "OCI AI cloud"},
    "TOTAL_HYPERSCALER": {"CY2025_estimate_usd_bn": 350, "yoy_growth_pct": 35},
}

POWER_DENSITY_EVOLUTION = {
    "Traditional_rack": {"kW_per_rack": 7, "cooling": "air"},
    "AI_GPU_rack_H100": {"kW_per_rack": 35, "cooling": "rear-door or direct liquid"},
    "AI_GPU_rack_B200": {"kW_per_rack": 70, "cooling": "direct liquid cooling required"},
    "AI_GPU_rack_GB300": {"kW_per_rack": 120, "cooling": "immersion or CDU required"},
    "Future_2027": {"kW_per_rack": 200, "cooling": "immersion only"},
}

COOLING_TECHNOLOGY_VENDORS = {
    "Direct_Liquid_Cooling": ["Vertiv", "Schneider Electric", "nVent"],
    "Immersion_Cooling": ["Submer", "LiquidStack", "GRC"],
    "Air_Cooling_Optimization": ["Vertiv", "STULZ", "Airedale"],
    "CDU_manufacturers": ["Vertiv", "Liebert", "Rittal"],
}

POWER_INFRASTRUCTURE_VENDORS = {
    "UPS_systems": ["Eaton", "Schneider Electric", "ABB"],
    "Switchgear": ["Eaton", "Siemens", "ABB"],
    "Generators": ["Caterpillar", "Cummins", "MTU"],
    "Transformers": ["ABB", "Siemens", "Hitachi Energy"],
    "Fuel_cells": ["Bloom Energy"],
}

DATA_CENTER_REIT_COMPS = {
    "EQIX": {"market_cap_bn": 75, "speciality": "Interconnection, retail colocation"},
    "DLR": {"market_cap_bn": 50, "speciality": "Wholesale, hyperscale leasing"},
    "AMT": {"market_cap_bn": 90, "speciality": "Wireless towers + data centers"},
    "CONE": {"market_cap_bn": 9, "speciality": "Wholesale hyperscale"},
    "IREN": {"market_cap_bn": 1.5, "speciality": "AI cloud, bitcoin mining"},
    "CORZ": {"market_cap_bn": 3, "speciality": "AI cloud, bitcoin mining"},
}


class DataCenterDomain:
    """Domain controller for data center ecosystem analysis."""

    def get_hyperscaler_capex(self) -> dict:
        return HYPERSCALER_CAPEX_GUIDANCE

    def get_power_density_trend(self) -> dict:
        return POWER_DENSITY_EVOLUTION

    def get_cooling_vendors(self) -> dict:
        return COOLING_TECHNOLOGY_VENDORS

    def assess_power_intensity(self, ticker: str) -> str:
        """Assess exposure to power density escalation."""
        beneficiaries = ["VRT", "VERTIV", "EATON", "ETN", "SNPS", "PWR"]
        risks = ["SMCI", "HPE", "DELL"]
        ticker = ticker.upper()
        if ticker in beneficiaries:
            return f"{ticker} is a DIRECT BENEFICIARY of power density escalation. " \
                   f"Higher kW/rack → more liquid cooling, more UPS, more switchgear revenue per rack."
        elif ticker in risks:
            return f"{ticker} faces SPEC RISK as power density forces system redesign. " \
                   f"Transition from air-cooled to liquid-cooled servers requires new platform investment."
        return f"Power density assessment for {ticker}: Not pre-loaded. Run supply chain mapping."

    def total_addressable_power_opportunity(self) -> str:
        total_capex = HYPERSCALER_CAPEX_GUIDANCE["TOTAL_HYPERSCALER"]["CY2025_estimate_usd_bn"]
        power_pct = 0.15  # ~15% of data center capex goes to power/cooling
        cooling_pct = 0.08
        return (
            f"CY2025 Total Hyperscaler Capex: ~${total_capex}B\n"
            f"Power Infrastructure (~{int(power_pct*100)}% of capex): ~${total_capex * power_pct:.0f}B\n"
            f"Cooling Infrastructure (~{int(cooling_pct*100)}% of capex): ~${total_capex * cooling_pct:.0f}B\n"
            f"TAM for power+cooling vendors: ~${total_capex * (power_pct + cooling_pct):.0f}B"
        )
