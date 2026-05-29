"""
Entity types and relationship definitions for the equity research knowledge graph.
"""

from __future__ import annotations
from enum import Enum
from dataclasses import dataclass, field
from typing import Any


class EntityType(Enum):
    COMPANY = "company"
    PRODUCT = "product"
    EXECUTIVE = "executive"
    CUSTOMER = "customer"
    SUPPLIER = "supplier"
    COMPETITOR = "competitor"
    CLINICAL_ASSET = "clinical_asset"
    DISEASE = "disease"
    PATENT = "patent"
    ACADEMIC_PAPER = "academic_paper"
    TECHNOLOGY = "technology"
    MARKET = "market"
    REGULATOR = "regulator"
    COUNTRY = "country"


@dataclass
class Entity:
    id: str
    name: str
    entity_type: EntityType
    attributes: dict[str, Any] = field(default_factory=dict)

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        return isinstance(other, Entity) and self.id == other.id


@dataclass
class Relationship:
    source_id: str
    target_id: str
    relation_type: str  # e.g., "SUPPLIES_TO", "COMPETES_WITH", "MANUFACTURES"
    weight: float = 1.0  # revenue exposure, dependency score, etc.
    attributes: dict[str, Any] = field(default_factory=dict)
