"""
Knowledge Graph for the Equity Research OS.
Connects companies, products, customers, suppliers, competitors, and research assets.
Supports recursive supply chain traversal and second/third-order beneficiary analysis.
"""

from __future__ import annotations
import json
from collections import defaultdict, deque
from typing import Any
from .entities import Entity, EntityType, Relationship


class KnowledgeGraph:
    """
    Directed graph of investment-research entities.
    Nodes = companies, products, people, technologies, clinical assets, etc.
    Edges = relationships with typed weights (revenue exposure, dependency, competition).
    """

    def __init__(self):
        self.entities: dict[str, Entity] = {}
        self.adjacency: dict[str, list[Relationship]] = defaultdict(list)
        self.reverse_adjacency: dict[str, list[Relationship]] = defaultdict(list)

    # --- Entity management ---

    def add_entity(self, entity: Entity) -> None:
        self.entities[entity.id] = entity

    def get_or_create(self, id: str, name: str, entity_type: EntityType, **attrs) -> Entity:
        if id not in self.entities:
            self.entities[id] = Entity(id=id, name=name, entity_type=entity_type, attributes=attrs)
        return self.entities[id]

    # --- Relationship management ---

    def add_relationship(self, rel: Relationship) -> None:
        self.adjacency[rel.source_id].append(rel)
        self.reverse_adjacency[rel.target_id].append(rel)

    def link(self, source_id: str, target_id: str, relation_type: str,
             weight: float = 1.0, **attrs) -> None:
        rel = Relationship(
            source_id=source_id,
            target_id=target_id,
            relation_type=relation_type,
            weight=weight,
            attributes=attrs,
        )
        self.add_relationship(rel)

    # --- Traversal ---

    def get_neighbors(self, entity_id: str, relation_types: list[str] | None = None) -> list[Entity]:
        """Return direct neighbors (outgoing edges)."""
        rels = self.adjacency.get(entity_id, [])
        if relation_types:
            rels = [r for r in rels if r.relation_type in relation_types]
        return [self.entities[r.target_id] for r in rels if r.target_id in self.entities]

    def get_suppliers(self, entity_id: str) -> list[tuple[Entity, float]]:
        """Return suppliers with dependency weight."""
        return [
            (self.entities[r.target_id], r.weight)
            for r in self.adjacency.get(entity_id, [])
            if r.relation_type == "SUPPLIED_BY" and r.target_id in self.entities
        ]

    def get_customers(self, entity_id: str) -> list[tuple[Entity, float]]:
        """Return customers with revenue exposure weight."""
        return [
            (self.entities[r.target_id], r.weight)
            for r in self.adjacency.get(entity_id, [])
            if r.relation_type == "SELLS_TO" and r.target_id in self.entities
        ]

    def get_competitors(self, entity_id: str) -> list[Entity]:
        return self.get_neighbors(entity_id, relation_types=["COMPETES_WITH"])

    def find_beneficiaries(self, entity_id: str, max_depth: int = 3) -> dict[str, dict]:
        """
        BFS traversal: who benefits if entity_id grows?
        Returns dict of entity_id -> {entity, depth, path, benefit_type}.
        Used for second/third-order supply chain beneficiary analysis.
        """
        visited: dict[str, dict] = {}
        queue: deque = deque()

        # Seed with direct customers/dependents (beneficiaries of upstream growth)
        DOWNSTREAM_RELS = ("SUPPLIES_TO", "ENABLES", "MANUFACTURES_FOR", "SELLS_TO")
        for rel in self.adjacency.get(entity_id, []):
            if rel.relation_type in DOWNSTREAM_RELS:
                if rel.target_id in self.entities:
                    queue.append((rel.target_id, 1, [entity_id, rel.target_id], rel.relation_type))

        while queue:
            current_id, depth, path, benefit_type = queue.popleft()
            if current_id in visited or depth > max_depth:
                continue
            visited[current_id] = {
                "entity": self.entities.get(current_id),
                "depth": depth,
                "path": path,
                "benefit_type": benefit_type,
            }
            if depth < max_depth:
                for rel in self.adjacency.get(current_id, []):
                    if rel.relation_type in DOWNSTREAM_RELS:
                        if rel.target_id not in visited and rel.target_id in self.entities:
                            queue.append((rel.target_id, depth + 1, path + [rel.target_id], rel.relation_type))

        return visited

    def find_dependencies(self, entity_id: str, max_depth: int = 3) -> dict[str, dict]:
        """
        Upstream traversal: what does entity_id depend on?
        Used for supply chain risk mapping.
        """
        visited: dict[str, dict] = {}
        queue: deque = deque()

        for rel in self.adjacency.get(entity_id, []):
            if rel.relation_type in ("SUPPLIED_BY", "DEPENDS_ON", "MANUFACTURED_BY"):
                if rel.target_id in self.entities:
                    queue.append((rel.target_id, 1, [entity_id, rel.target_id], rel.weight))

        while queue:
            current_id, depth, path, cumulative_weight = queue.popleft()
            if current_id in visited or depth > max_depth:
                continue
            visited[current_id] = {
                "entity": self.entities.get(current_id),
                "depth": depth,
                "path": path,
                "dependency_weight": cumulative_weight,
            }
            if depth < max_depth:
                for rel in self.adjacency.get(current_id, []):
                    if rel.relation_type in ("SUPPLIED_BY", "DEPENDS_ON", "MANUFACTURED_BY"):
                        if rel.target_id not in visited and rel.target_id in self.entities:
                            queue.append((rel.target_id, depth + 1,
                                         path + [rel.target_id],
                                         cumulative_weight * rel.weight))
        return visited

    # --- Serialization ---

    def to_dict(self) -> dict:
        return {
            "entities": {
                eid: {
                    "id": e.id,
                    "name": e.name,
                    "type": e.entity_type.value,
                    "attributes": e.attributes,
                }
                for eid, e in self.entities.items()
            },
            "relationships": [
                {
                    "source": r.source_id,
                    "target": r.target_id,
                    "type": r.relation_type,
                    "weight": r.weight,
                }
                for rels in self.adjacency.values()
                for r in rels
            ],
        }

    def save(self, path: str) -> None:
        with open(path, "w") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, path: str) -> "KnowledgeGraph":
        with open(path) as f:
            data = json.load(f)
        kg = cls()
        for eid, e in data["entities"].items():
            kg.entities[eid] = Entity(
                id=e["id"], name=e["name"],
                entity_type=EntityType(e["type"]),
                attributes=e.get("attributes", {}),
            )
        for r in data["relationships"]:
            kg.link(r["source"], r["target"], r["type"], r.get("weight", 1.0))
        return kg

    def summary(self) -> str:
        return (
            f"KnowledgeGraph: {len(self.entities)} entities, "
            f"{sum(len(v) for v in self.adjacency.values())} relationships"
        )
