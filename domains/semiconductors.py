"""
Semiconductor domain knowledge: process node economics, equipment cycle, EDA/IP ecosystem.
"""

from __future__ import annotations


# Process node economics reference data
PROCESS_NODE_DATA = {
    "3nm": {
        "foundries": ["TSMC", "Samsung"],
        "status": "HVM",
        "key_customers": ["Apple", "NVIDIA", "AMD", "Qualcomm"],
        "relative_cost_vs_5nm": 1.3,
        "performance_improvement": "~15% vs 5nm",
    },
    "2nm": {
        "foundries": ["TSMC", "Samsung", "Intel"],
        "status": "Ramp 2025",
        "key_customers": ["Apple", "NVIDIA (Blackwell Ultra)"],
        "relative_cost_vs_3nm": 1.4,
        "performance_improvement": "~15% vs 3nm",
    },
    "1.6nm": {
        "foundries": ["TSMC"],
        "status": "Development (2026)",
        "key_customers": ["TBD"],
        "relative_cost_vs_2nm": 1.5,
    },
}

# Equipment spending concentration by node
EQUIPMENT_INTENSITY = {
    "EUV_lithography": {"vendor": "ASML", "spend_per_layer": "~$200M/tool", "node_required": ["3nm", "2nm", "1.6nm"]},
    "ALD_deposition": {"vendor": "AMAT, Lam", "spend_per_layer": "High", "node_required": ["all"]},
    "dry_etch": {"vendor": "Lam, TEL", "spend_per_layer": "High", "node_required": ["all"]},
    "metrology_inspection": {"vendor": "KLA", "spend_per_layer": "Medium", "node_required": ["all"]},
}

# Semiconductor cycle indicators
CYCLE_INDICATORS = [
    "Lead times (extended = bull; collapsed = correction)",
    "Inventory days at distributors (>90d = correction risk)",
    "Book-to-bill ratio (>1.0 = expansion; <1.0 = contraction)",
    "NAND/DRAM spot price trends",
    "Capex guidance from TSMC, Samsung, Intel Foundry",
    "Wafer start trends at TSMC (reported quarterly)",
]


class SemiconductorDomain:
    """Domain controller for semiconductor analysis."""

    def get_node_economics(self, node: str) -> dict:
        return PROCESS_NODE_DATA.get(node, {})

    def get_cycle_indicators(self) -> list[str]:
        return CYCLE_INDICATORS

    def get_equipment_intensity(self) -> dict:
        return EQUIPMENT_INTENSITY

    def describe_moat(self, subsector: str) -> str:
        moats = {
            "EUV": "ASML has a true monopoly — no viable alternative for sub-5nm lithography. "
                   "15-year technology lead. ~$400M ASP per machine. Only ~60 shipped/year.",
            "Foundry": "TSMC has a 60-70% global leading-edge market share. "
                       "2+ year technology lead on Samsung. "
                       "Customer list reads like AI compute spending map.",
            "Memory": "HBM is an oligopoly (SK Hynix 50%, Samsung 35%, Micron 15%). "
                      "HBM3E and HBM4 demand tied directly to AI accelerator unit growth.",
            "EDA": "Synopsys + Cadence control 85% of chip design software market. "
                   "Multi-year contracts. Switching cost = 12-18 months of lost engineering productivity.",
        }
        return moats.get(subsector, "No pre-loaded moat data for this subsector.")
