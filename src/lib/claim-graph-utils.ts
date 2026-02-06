import type { AuditSentence, SentenceStatus } from "./audit-types";

// ═══════════════════════════════════════════
// CLAIM DEPENDENCY GRAPH
// ═══════════════════════════════════════════

export type ClaimNodeStatus = SentenceStatus | "cascade";

export interface ClaimNode {
  id: string;
  label: string; // e.g. "C1"
  text: string;
  originalStatus: SentenceStatus;
  effectiveStatus: ClaimNodeStatus;
  confidence: number;
  x: number;
  y: number;
  dependsOn: string[]; // upstream claim IDs
  cascadeSource?: string; // if cascade, which contradicted node caused it
}

export interface ClaimEdge {
  from: string;
  to: string;
  isCascade: boolean; // true if this edge propagates a contradiction
}

export interface ClaimGraph {
  nodes: ClaimNode[];
  edges: ClaimEdge[];
}

// Dependency definitions: which claims depend on which
// This creates a realistic causal chain for the mock data
const DEPENDENCY_MAP: Record<string, string[]> = {
  s1: [],           // Founding — root claim
  s9: ["s1"],       // Dr. Kapoor's credentials depend on her being the founder
  s3: ["s1"],       // Training data depends on company existing
  s2: ["s1"],       // FDA clearance depends on company existing
  s5: ["s2"],       // Partnerships depend on FDA regulatory status
  s6: ["s3", "s2"], // Accuracy claims depend on training data AND FDA scope
  s4: ["s1", "s5"], // Revenue depends on company + partnerships
  s7: ["s1"],       // EU expansion depends on company existing
  s8: ["s1"],       // Employee count depends on company existing
  s10: ["s6"],      // WHO endorsement depends on clinical accuracy claims
  s11: ["s1", "s4"], // Series B funding depends on company + financials
};

/**
 * Build a claim dependency graph from audit sentences.
 * Propagates contradictions through dependency chains.
 */
export function buildClaimGraph(sentences: AuditSentence[]): ClaimGraph {
  const sentenceMap = new Map(sentences.map((s) => [s.id, s]));

  // Build nodes with original status
  const nodes: ClaimNode[] = sentences.map((s, i) => ({
    id: s.id,
    label: `C${i + 1}`,
    text: s.text,
    originalStatus: s.status,
    effectiveStatus: s.status,
    confidence: s.confidence,
    x: 0,
    y: 0,
    dependsOn: DEPENDENCY_MAP[s.id] || [],
  }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build edges
  const edges: ClaimEdge[] = [];
  for (const node of nodes) {
    for (const depId of node.dependsOn) {
      if (nodeMap.has(depId)) {
        edges.push({ from: depId, to: node.id, isCascade: false });
      }
    }
  }

  // Propagate cascade hallucinations (BFS from contradicted nodes)
  const contradicted = nodes.filter((n) => n.originalStatus === "contradicted");
  const visited = new Set<string>();

  // Build adjacency list (downstream)
  const downstream = new Map<string, string[]>();
  for (const edge of edges) {
    if (!downstream.has(edge.from)) downstream.set(edge.from, []);
    downstream.get(edge.from)!.push(edge.to);
  }

  const queue = contradicted.map((n) => n.id);
  for (const id of queue) visited.add(id);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = downstream.get(currentId) || [];

    for (const childId of children) {
      const child = nodeMap.get(childId);
      if (!child) continue;

      // Only cascade if the child isn't already contradicted
      if (child.originalStatus !== "contradicted" && !visited.has(childId)) {
        child.effectiveStatus = "cascade";
        child.cascadeSource = currentId;

        // Mark the edge as cascade
        const edge = edges.find((e) => e.from === currentId && e.to === childId);
        if (edge) edge.isCascade = true;

        visited.add(childId);
        queue.push(childId);
      } else if (child.originalStatus === "contradicted") {
        // Edge to an already-contradicted node is still cascade-colored
        const edge = edges.find((e) => e.from === currentId && e.to === childId);
        if (edge) edge.isCascade = true;
      }
    }
  }

  // Layout: hierarchical left-to-right by dependency depth
  const depths = computeDepths(nodes, edges);
  const maxDepth = Math.max(...Array.from(depths.values()), 0);

  // Group nodes by depth
  const byDepth = new Map<number, ClaimNode[]>();
  for (const node of nodes) {
    const d = depths.get(node.id) || 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(node);
  }

  // Assign positions
  const PADDING_X = 220;
  const PADDING_Y = 100;
  const OFFSET_X = 100;
  const OFFSET_Y = 60;

  for (let depth = 0; depth <= maxDepth; depth++) {
    const group = byDepth.get(depth) || [];
    const totalHeight = (group.length - 1) * PADDING_Y;
    const startY = -totalHeight / 2 + OFFSET_Y;

    group.forEach((node, i) => {
      node.x = depth * PADDING_X + OFFSET_X;
      node.y = startY + i * PADDING_Y;
    });
  }

  return { nodes, edges };
}

function computeDepths(
  nodes: ClaimNode[],
  edges: ClaimEdge[]
): Map<string, number> {
  const depths = new Map<string, number>();
  const incoming = new Map<string, Set<string>>();

  for (const node of nodes) {
    incoming.set(node.id, new Set());
  }
  for (const edge of edges) {
    incoming.get(edge.to)?.add(edge.from);
  }

  // Topological sort with depth tracking
  const queue: string[] = [];
  for (const [id, deps] of incoming) {
    if (deps.size === 0) {
      queue.push(id);
      depths.set(id, 0);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDepth = depths.get(current) || 0;

    for (const edge of edges) {
      if (edge.from === current) {
        const childDeps = incoming.get(edge.to);
        if (childDeps) {
          childDeps.delete(current);
          const newDepth = Math.max(depths.get(edge.to) || 0, currentDepth + 1);
          depths.set(edge.to, newDepth);
          if (childDeps.size === 0) {
            queue.push(edge.to);
          }
        }
      }
    }
  }

  // Handle any remaining nodes (cycles, etc.)
  for (const node of nodes) {
    if (!depths.has(node.id)) {
      depths.set(node.id, 0);
    }
  }

  return depths;
}
