"""
AI Supply Chain domain knowledge base.
Pre-loaded company relationships, subsector mappings, and second-order beneficiary logic.
"""

from __future__ import annotations
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from knowledge_graph import KnowledgeGraph, Entity, EntityType


# Pre-seeded supply chain relationships (abbreviated; expanded at runtime via agents)
AI_SUPPLY_CHAIN_GRAPH = {
    # Tier 1: Model Trainers / Compute Buyers
    "NVDA": {"name": "NVIDIA", "type": "GPU Ecosystem", "role": "AI Accelerator Provider"},
    "AMD": {"name": "AMD", "type": "GPU Ecosystem", "role": "AI Accelerator Competitor"},
    "INTC": {"name": "Intel", "type": "ASIC/FPGA", "role": "AI Accelerator, Foundry"},
    "GOOGL": {"name": "Alphabet / Google", "type": "Hyperscaler", "role": "TPU ASIC, Cloud AI"},
    "MSFT": {"name": "Microsoft", "type": "Hyperscaler", "role": "Azure AI, Copilot"},
    "AMZN": {"name": "Amazon", "type": "Hyperscaler", "role": "AWS, Trainium/Inferentia ASIC"},
    "META": {"name": "Meta", "type": "Hyperscaler", "role": "MTIA ASIC, Open-source AI"},

    # Tier 2: Infrastructure
    "TSMC": {"name": "TSMC", "type": "Foundry", "role": "Leading-edge logic fab"},
    "AMAT": {"name": "Applied Materials", "type": "Semiconductor Equipment", "role": "CVD/PVD/Etch"},
    "LRCX": {"name": "Lam Research", "type": "Semiconductor Equipment", "role": "Etch, Deposition"},
    "KLAC": {"name": "KLA Corp", "type": "Semiconductor Equipment", "role": "Inspection/Metrology"},
    "ASML": {"name": "ASML", "type": "Semiconductor Equipment", "role": "EUV lithography monopoly"},
    "MU": {"name": "Micron", "type": "Memory", "role": "HBM, DRAM, NAND"},
    "SNPS": {"name": "Synopsys", "type": "EDA", "role": "Chip design software"},
    "CDNS": {"name": "Cadence", "type": "EDA", "role": "Chip design software"},

    # Tier 3: Networking / Interconnect
    "MRVL": {"name": "Marvell Technology", "type": "Networking/ASIC", "role": "Custom ASIC, 800G switches"},
    "AVGO": {"name": "Broadcom", "type": "Networking/ASIC", "role": "Custom AI ASIC, switches"},
    "ANET": {"name": "Arista Networks", "type": "Networking", "role": "AI data center switches"},
    "CSCO": {"name": "Cisco", "type": "Networking", "role": "Data center networking"},
    "II-VI": {"name": "Coherent (COHR)", "type": "Optical Interconnects", "role": "800G/1.6T transceivers"},
    "LITE": {"name": "Lumentum", "type": "Optical Interconnects", "role": "Optical components"},

    # Tier 4: Power / Cooling / Infrastructure
    "EATON": {"name": "Eaton", "type": "Power Electronics", "role": "Data center UPS, PDUs"},
    "VRT": {"name": "Vertiv", "type": "Power/Cooling", "role": "Liquid cooling, power infra"},
    "SMCI": {"name": "Super Micro Computer", "type": "Server Systems", "role": "AI server platforms"},
    "HPE": {"name": "Hewlett Packard Enterprise", "type": "Server Systems", "role": "AI servers, networking"},
    "DLR": {"name": "Digital Realty", "type": "Data Center REIT", "role": "Colocation real estate"},
    "EQIX": {"name": "Equinix", "type": "Data Center REIT", "role": "Interconnection, colocation"},
}

SUPPLY_CHAIN_EDGES = [
    # TSMC manufactures for GPU makers (downstream: who benefits if TSMC ships more)
    ("TSMC", "NVDA", "MANUFACTURES_FOR", 0.9),
    ("TSMC", "AMD", "MANUFACTURES_FOR", 0.7),
    ("TSMC", "AVGO", "MANUFACTURES_FOR", 0.6),
    ("TSMC", "MRVL", "MANUFACTURES_FOR", 0.5),

    # Reverse: GPU makers depend on TSMC (upstream dependency)
    ("NVDA", "TSMC", "MANUFACTURED_BY", 0.9),
    ("AMD", "TSMC", "MANUFACTURED_BY", 0.7),
    ("AVGO", "TSMC", "MANUFACTURED_BY", 0.6),
    ("MRVL", "TSMC", "MANUFACTURED_BY", 0.5),

    # Equipment supplies to TSMC (downstream: who benefits if equipment ships more)
    ("ASML", "TSMC", "SUPPLIES_TO", 1.0),
    ("AMAT", "TSMC", "SUPPLIES_TO", 0.8),
    ("LRCX", "TSMC", "SUPPLIES_TO", 0.7),
    ("KLAC", "TSMC", "SUPPLIES_TO", 0.7),

    # Reverse: TSMC depends on equipment vendors
    ("TSMC", "ASML", "DEPENDS_ON", 1.0),
    ("TSMC", "AMAT", "DEPENDS_ON", 0.8),
    ("TSMC", "LRCX", "DEPENDS_ON", 0.7),
    ("TSMC", "KLAC", "DEPENDS_ON", 0.7),

    # NVIDIA sells to hyperscalers
    ("NVDA", "MSFT", "SELLS_TO", 0.25),
    ("NVDA", "GOOGL", "SELLS_TO", 0.20),
    ("NVDA", "AMZN", "SELLS_TO", 0.20),
    ("NVDA", "META", "SELLS_TO", 0.15),

    # Memory sells to NVIDIA (HBM in H100/H200/B200)
    ("MU", "NVDA", "SELLS_TO", 0.3),

    # Networking connects data centers
    ("ANET", "MSFT", "SELLS_TO", 0.30),
    ("ANET", "GOOGL", "SELLS_TO", 0.20),
    ("ANET", "META", "SELLS_TO", 0.15),
    ("MRVL", "AMZN", "SELLS_TO", 0.40),
    ("AVGO", "META", "SELLS_TO", 0.35),
    ("AVGO", "GOOGL", "SELLS_TO", 0.30),

    # Optical interconnects enable networking
    ("II-VI", "ANET", "SUPPLIES_TO", 0.5),
    ("II-VI", "NVDA", "SUPPLIES_TO", 0.2),

    # Power/Cooling enables data centers
    ("VRT", "MSFT", "SELLS_TO", 0.25),
    ("VRT", "AMZN", "SELLS_TO", 0.20),
    ("SMCI", "NVDA", "DEPENDS_ON", 0.8),

    # EDA enables chip design
    ("SNPS", "NVDA", "ENABLES", 0.4),
    ("SNPS", "AVGO", "ENABLES", 0.4),
    ("CDNS", "NVDA", "ENABLES", 0.4),
]


def build_ai_supply_chain_graph() -> KnowledgeGraph:
    """Build and return a pre-seeded AI supply chain knowledge graph."""
    kg = KnowledgeGraph()

    # Add entities
    for ticker, info in AI_SUPPLY_CHAIN_GRAPH.items():
        kg.get_or_create(
            id=ticker,
            name=info["name"],
            entity_type=EntityType.COMPANY,
            subsector=info["type"],
            role=info["role"],
        )

    # Add relationships
    for source, target, rel_type, weight in SUPPLY_CHAIN_EDGES:
        if source in kg.entities and target in kg.entities:
            kg.link(source, target, rel_type, weight)

    return kg


class AISupplyChainDomain:
    """Domain controller for AI supply chain analysis."""

    def __init__(self):
        self.graph = build_ai_supply_chain_graph()

    def who_benefits_if(self, ticker: str, max_depth: int = 3) -> str:
        """
        Answer: 'Who benefits if [ticker] shipments increase?'
        Returns formatted beneficiary analysis.
        """
        ticker = ticker.upper()
        if ticker not in self.graph.entities:
            return f"{ticker} not in AI supply chain graph."

        beneficiaries = self.graph.find_beneficiaries(ticker, max_depth=max_depth)
        if not beneficiaries:
            return f"No downstream beneficiaries found for {ticker} in current graph."

        lines = [f"SECOND/THIRD-ORDER BENEFICIARIES IF {ticker} SHIPMENTS INCREASE:\n"]
        by_depth = {}
        for bid, bdata in beneficiaries.items():
            d = bdata["depth"]
            if d not in by_depth:
                by_depth[d] = []
            by_depth[d].append((bid, bdata))

        for depth in sorted(by_depth.keys()):
            label = {1: "DIRECT (1st-order)", 2: "SECOND-ORDER", 3: "THIRD-ORDER"}.get(depth, f"{depth}-order")
            lines.append(f"\n{label}:")
            for bid, bdata in by_depth[depth]:
                entity = bdata.get("entity")
                path_str = " -> ".join(bdata.get("path", []))
                name = entity.name if entity else bid
                lines.append(f"  * {name} ({bid})  |  path: {path_str}")

        return "\n".join(lines)

    def dependency_map(self, ticker: str) -> str:
        """What does [ticker] depend on upstream?"""
        ticker = ticker.upper()
        if ticker not in self.graph.entities:
            return f"{ticker} not in AI supply chain graph."

        deps = self.graph.find_dependencies(ticker, max_depth=3)
        if not deps:
            return f"No upstream dependencies found for {ticker} in current graph."

        lines = [f"UPSTREAM DEPENDENCIES FOR {ticker}:\n"]
        for did, ddata in sorted(deps.items(), key=lambda x: x[1]["depth"]):
            entity = ddata.get("entity")
            name = entity.name if entity else did
            weight = ddata.get("dependency_weight", 0)
            lines.append(f"  Depth {ddata['depth']}: {name} ({did})  |  dependency_weight: {weight:.2f}")

        return "\n".join(lines)

    def get_company_profile(self, ticker: str) -> dict:
        """Return known attributes for a company in the graph."""
        ticker = ticker.upper()
        if ticker not in self.graph.entities:
            return {}
        entity = self.graph.entities[ticker]
        return {"id": entity.id, "name": entity.name, **entity.attributes}
