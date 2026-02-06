import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { buildClaimGraph, type ClaimNode, type ClaimNodeStatus, type EdgeRelation } from "@/lib/claim-graph-utils";
import type { AuditSentence } from "@/lib/audit-types";
import { X } from "lucide-react";

interface ClaimGraphViewProps {
  sentences: AuditSentence[];
}

// ═══ STATUS VISUAL CONFIG ═══
const STATUS_COLORS: Record<ClaimNodeStatus, { fill: string; stroke: string; text: string; glow: string }> = {
  supported: {
    fill: "hsl(var(--verified))",
    stroke: "hsl(var(--verified))",
    text: "hsl(var(--verified-foreground))",
    glow: "0 0 12px hsl(var(--verified) / 0.35)",
  },
  contradicted: {
    fill: "hsl(var(--destructive))",
    stroke: "hsl(var(--destructive))",
    text: "hsl(var(--destructive-foreground))",
    glow: "0 0 16px hsl(var(--destructive) / 0.4)",
  },
  unverifiable: {
    fill: "hsl(var(--warning))",
    stroke: "hsl(var(--warning))",
    text: "hsl(var(--warning-foreground))",
    glow: "0 0 12px hsl(var(--warning) / 0.35)",
  },
  source_conflict: {
    fill: "hsl(var(--conflict))",
    stroke: "hsl(var(--conflict))",
    text: "hsl(var(--conflict-foreground))",
    glow: "0 0 12px hsl(var(--conflict) / 0.35)",
  },
  cascade: {
    fill: "hsl(0 70% 35%)",
    stroke: "hsl(var(--destructive))",
    text: "hsl(0 0% 100%)",
    glow: "0 0 18px hsl(var(--destructive) / 0.3)",
  },
};

const STATUS_LABELS: Record<ClaimNodeStatus, string> = {
  supported: "SUPPORTED",
  contradicted: "CONTRADICTED",
  unverifiable: "UNVERIFIABLE",
  source_conflict: "SOURCE CONFLICT",
  cascade: "CASCADE HALLUCINATION",
};

const EDGE_RELATION_LABELS: Record<EdgeRelation, string> = {
  depends_on: "Depends on",
  derived_from: "Derived from",
  assumes: "Assumes",
};

// Larger pill-shaped nodes with generous padding
const NODE_WIDTH = 200;
const NODE_HEIGHT = 64;
const NODE_RX = 14;

const ClaimGraphView = ({ sentences }: ClaimGraphViewProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panViewStart, setPanViewStart] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(true);
  const [focusCascade, setFocusCascade] = useState(false);

  const graph = useMemo(() => buildClaimGraph(sentences), [sentences]);

  // Compute the set of node IDs that belong to a cascade path
  const cascadePathIds = useMemo(() => {
    const ids = new Set<string>();
    for (const node of graph.nodes) {
      if (node.effectiveStatus === "cascade" || node.effectiveStatus === "contradicted") {
        ids.add(node.id);
      }
    }
    // Also include direct upstream dependencies of cascade nodes to show full chain
    for (const edge of graph.edges) {
      if (edge.isCascade) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    }
    return ids;
  }, [graph]);

  const hasCascadePath = cascadePathIds.size > 0;

  // Compute viewBox to fit all nodes with generous padding
  useEffect(() => {
    if (graph.nodes.length === 0) return;
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 160;
    const maxX = Math.max(...xs) + 160;
    const minY = Math.min(...ys) - 100;
    const maxY = Math.max(...ys) + 100;
    setViewBox({
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 600),
      h: Math.max(maxY - minY, 400),
    });
  }, [graph]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanViewStart({ x: viewBox.x, y: viewBox.y });
    },
    [viewBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox((v) => ({ ...v, x: panViewStart.x - dx, y: panViewStart.y - dy }));
    },
    [isPanning, panStart, panViewStart, viewBox.w, viewBox.h]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((v) => {
        const newW = v.w * zoomFactor;
        const newH = v.h * zoomFactor;
        const cx = v.x + v.w / 2;
        const cy = v.y + v.h / 2;
        return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH };
      });
    },
    []
  );

  const handleNodeHover = useCallback(
    (nodeId: string | null, e?: React.MouseEvent) => {
      setHoveredNode(nodeId);
      if (e && nodeId) {
        setTooltipPos({ x: e.clientX, y: e.clientY });
      }
    },
    []
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const hoveredNodeData = useMemo(
    () => graph.nodes.find((n) => n.id === hoveredNode) ?? null,
    [hoveredNode, graph.nodes]
  );

  const selectedNodeData = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNode) ?? null,
    [selectedNode, graph.nodes]
  );

  const cascadeCount = graph.nodes.filter((n) => n.effectiveStatus === "cascade").length;
  const rootCauseCount = graph.nodes.filter((n) => n.isRootCause).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
            Claim Dependency Graph
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground">
              {graph.nodes.length} claims • {graph.edges.length} dependencies
              {rootCauseCount > 0 && ` • ${rootCauseCount} root cause${rootCauseCount > 1 ? "s" : ""}`}
            </span>
            {hasCascadePath && (
              <button
                onClick={() => setFocusCascade((v) => !v)}
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded border transition-colors ${
                  focusCascade
                    ? "border-destructive bg-destructive/15 text-destructive"
                    : "border-border bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {focusCascade ? "✦ Cascade Focus ON" : "Focus Cascade"}
              </button>
            )}
            <button
              onClick={() => setShowLegend((v) => !v)}
              className="text-[10px] font-mono font-bold px-2 py-1 rounded border border-border bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {showLegend ? "Hide" : "Show"} Legend
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ColorLegendDot color={STATUS_COLORS.supported.fill} label="Supported" />
          <ColorLegendDot color={STATUS_COLORS.contradicted.fill} label="Contradicted" />
          <ColorLegendDot color={STATUS_COLORS.unverifiable.fill} label="Unverifiable" />
          <ColorLegendDot color={STATUS_COLORS.source_conflict.fill} label="Source Conflict" />
          <ColorLegendDot color={STATUS_COLORS.cascade.fill} label={`Cascade (${cascadeCount})`} pulse />
          <div className="ml-auto text-[10px] font-mono text-muted-foreground">
            Scroll to zoom • Drag to pan • Click node for details
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* SVG canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-background cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />

          {/* Cascade banner */}
          {cascadeCount > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg border border-destructive/30 bg-destructive/10 backdrop-blur-sm max-w-lg text-center">
              <p className="text-[11px] font-mono font-bold text-destructive">
                ⚠ Cascade Detected — {cascadeCount} claim{cascadeCount > 1 ? "s" : ""} affected by upstream contradiction
              </p>
            </div>
          )}

          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Subtle small arrow for normal edges */}
              <marker id="arrow-normal" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="hsl(var(--muted-foreground))" opacity="0.3" />
              </marker>
              {/* Slightly bolder arrow for cascade */}
              <marker id="arrow-cascade" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="hsl(var(--destructive))" opacity="0.65" />
              </marker>
              <filter id="node-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
              <filter id="cascade-glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <style>{`
                @keyframes dash-flow {
                  to { stroke-dashoffset: -20; }
                }
                .cascade-edge {
                  animation: dash-flow 1s linear infinite;
                }
              `}</style>
            </defs>

            {/* ── EDGES ── */}
            {graph.edges.map((edge) => {
              const fromNode = graph.nodes.find((n) => n.id === edge.from);
              const toNode = graph.nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              const x1 = fromNode.x + NODE_WIDTH / 2;
              const y1 = fromNode.y;
              const x2 = toNode.x - NODE_WIDTH / 2;
              const y2 = toNode.y;

              const cpOffset = Math.abs(x2 - x1) * 0.4;
              const pathD = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;

              const labelX = (x1 + x2) / 2;
              const labelY = (y1 + y2) / 2 - 8;

              // Dim non-cascade edges when focus mode is on
              const isDimmed = focusCascade && !edge.isCascade;

              return (
                <g key={`${edge.from}-${edge.to}`} style={{ opacity: isDimmed ? 0.06 : 1, transition: "opacity 0.3s ease" }}>
                  {edge.isCascade && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="5"
                      opacity="0.1"
                      filter="url(#cascade-glow)"
                    />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={edge.isCascade ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                    strokeWidth={edge.isCascade ? 2 : 1}
                    strokeDasharray={edge.isCascade ? "8 5" : "none"}
                    opacity={edge.isCascade ? 0.75 : 0.18}
                    markerEnd={edge.isCascade ? "url(#arrow-cascade)" : "url(#arrow-normal)"}
                    className={edge.isCascade ? "cascade-edge" : ""}
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="auto"
                    fill={edge.isCascade ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                    fontSize="7.5"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={edge.isCascade ? "600" : "400"}
                    fontStyle="italic"
                    opacity={edge.isCascade ? 0.8 : 0.45}
                    style={{ pointerEvents: "none" }}
                  >
                    {EDGE_RELATION_LABELS[edge.relation]}
                  </text>
                </g>
              );
            })}

            {/* ── NODES ── */}
            {graph.nodes.map((node) => {
              const colors = STATUS_COLORS[node.effectiveStatus];
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              const isCascade = node.effectiveStatus === "cascade";
              const isContradicted = node.effectiveStatus === "contradicted";
              const isDanger = isContradicted || isCascade;
              const isInCascadePath = cascadePathIds.has(node.id);
              const isDimmed = focusCascade && !isInCascadePath;

              return (
                <g
                  key={node.id}
                  onMouseEnter={(e) => handleNodeHover(node.id, e)}
                  onMouseMove={(e) => handleNodeHover(node.id, e)}
                  onMouseLeave={() => handleNodeHover(null)}
                  onClick={() => handleNodeClick(node.id)}
                  className="cursor-pointer"
                  style={{ opacity: isDimmed ? 0.12 : 1, transition: "opacity 0.3s ease" }}
                >
                  {/* Subtle animated ring for danger nodes */}
                  {isDanger && (
                    <rect
                      x={node.x - NODE_WIDTH / 2 - 5}
                      y={node.y - NODE_HEIGHT / 2 - 5}
                      width={NODE_WIDTH + 10}
                      height={NODE_HEIGHT + 10}
                      rx={NODE_RX + 3}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="1"
                      opacity={0.25}
                    >
                      <animate attributeName="opacity" values="0.25;0.08;0.25" dur="2.5s" repeatCount="indefinite" />
                    </rect>
                  )}

                  {/* Selected ring */}
                  {isSelected && (
                    <rect
                      x={node.x - NODE_WIDTH / 2 - 4}
                      y={node.y - NODE_HEIGHT / 2 - 4}
                      width={NODE_WIDTH + 8}
                      height={NODE_HEIGHT + 8}
                      rx={NODE_RX + 2}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="2.5"
                      opacity="0.8"
                    />
                  )}

                  {/* Main node pill */}
                  <rect
                    x={node.x - NODE_WIDTH / 2}
                    y={node.y - NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={NODE_RX}
                    fill={colors.fill}
                    stroke={isHovered ? colors.stroke : "transparent"}
                    strokeWidth="1.5"
                    filter="url(#node-shadow)"
                    style={{
                      transform: isHovered ? "scale(1.03)" : "scale(1)",
                      transformOrigin: `${node.x}px ${node.y}px`,
                      transition: "transform 0.15s ease",
                    }}
                  />

                  {/* Short claim title — 3-5 words, centered, readable */}
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={colors.text}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="0.2"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.shortSummary}
                  </text>

                  {/* Claim ID in top-left corner */}
                  <text
                    x={node.x - NODE_WIDTH / 2 + 10}
                    y={node.y - NODE_HEIGHT / 2 + 11}
                    textAnchor="start"
                    dominantBaseline="central"
                    fill={colors.text}
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    opacity={0.6}
                    style={{ pointerEvents: "none" }}
                  >
                    {node.label}
                  </text>

                  {/* Root Hallucination badge — above node */}
                  {node.isRootCause && (
                    <g>
                      <rect
                        x={node.x - 48}
                        y={node.y - NODE_HEIGHT / 2 - 18}
                        width={96}
                        height={15}
                        rx={4}
                        fill="hsl(var(--destructive))"
                      />
                      <text
                        x={node.x}
                        y={node.y - NODE_HEIGHT / 2 - 10.5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="hsl(0 0% 100%)"
                        fontSize="7.5"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        letterSpacing="0.8"
                        style={{ pointerEvents: "none" }}
                      >
                        ROOT HALLUCINATION
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip — full claim text + confidence */}
          {hoveredNodeData && !selectedNode && (
            <div
              className="fixed z-50 pointer-events-none animate-fade-in-up"
              style={{
                left: tooltipPos.x + 16,
                top: tooltipPos.y - 10,
                maxWidth: 380,
              }}
            >
              <div className="rounded-lg bg-card border border-border shadow-xl p-3 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill }}
                  />
                  <span className="text-[10px] font-mono font-bold text-foreground">
                    {hoveredNodeData.label}
                  </span>
                  <span
                    className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill,
                      backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[hoveredNodeData.effectiveStatus].fill} 12%, transparent)`,
                    }}
                  >
                    {STATUS_LABELS[hoveredNodeData.effectiveStatus]}
                  </span>
                  {hoveredNodeData.isRootCause && (
                    <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">
                      ROOT CAUSE
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {hoveredNodeData.text}
                </p>
                {hoveredNodeData.effectiveStatus === "cascade" && (
                  <p className="text-[10px] text-destructive font-medium leading-relaxed">
                    ⚠ This claim is incorrect because it depends on a contradicted claim.
                  </p>
                )}
                <div className="text-[10px] font-mono text-muted-foreground">
                  Confidence: {(hoveredNodeData.confidenceLow * 100).toFixed(0)}–{(hoveredNodeData.confidenceHigh * 100).toFixed(0)}%
                </div>
                <p className="text-[9px] text-muted-foreground italic">Click for full details</p>
              </div>
            </div>
          )}
        </div>

        {/* Click-to-expand detail panel */}
        {selectedNodeData && (
          <div className="w-80 shrink-0 border-l-2 border-border bg-card overflow-y-auto animate-fade-in">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
                  Claim Detail
                </h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status + ID */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[selectedNodeData.effectiveStatus].fill }}
                />
                <span className="text-sm font-mono font-bold text-foreground">
                  {selectedNodeData.label}
                </span>
                <span
                  className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded"
                  style={{
                    color: STATUS_COLORS[selectedNodeData.effectiveStatus].fill,
                    backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[selectedNodeData.effectiveStatus].fill} 12%, transparent)`,
                  }}
                >
                  {STATUS_LABELS[selectedNodeData.effectiveStatus]}
                </span>
                {selectedNodeData.isRootCause && (
                  <span className="text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-destructive text-destructive-foreground">
                    ROOT HALLUCINATION
                  </span>
                )}
              </div>

              {/* Full claim text */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Full Claim</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedNodeData.text}
                </p>
              </div>

              {/* Cascade explanation */}
              {selectedNodeData.effectiveStatus === "cascade" && (
                <div className="px-3 py-2 rounded-lg border border-destructive/30 bg-destructive/10">
                  <p className="text-[11px] font-mono text-destructive font-bold leading-relaxed">
                    ⚠ This claim is incorrect because it depends on a contradicted claim.
                  </p>
                  {selectedNodeData.cascadeSource && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Source: Claim {graph.nodes.find((n) => n.id === selectedNodeData.cascadeSource)?.label ?? selectedNodeData.cascadeSource}
                    </p>
                  )}
                </div>
              )}

              {/* Confidence */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Confidence Range</p>
                <p className="text-sm font-mono text-foreground">
                  {(selectedNodeData.confidenceLow * 100).toFixed(0)}–{(selectedNodeData.confidenceHigh * 100).toFixed(0)}%
                </p>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute h-full rounded-full opacity-25"
                    style={{
                      left: `${selectedNodeData.confidenceLow * 100}%`,
                      width: `${(selectedNodeData.confidenceHigh - selectedNodeData.confidenceLow) * 100}%`,
                      backgroundColor: STATUS_COLORS[selectedNodeData.effectiveStatus].fill,
                    }}
                  />
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${((selectedNodeData.confidenceLow + selectedNodeData.confidenceHigh) / 2) * 100}%`,
                      backgroundColor: STATUS_COLORS[selectedNodeData.effectiveStatus].fill,
                    }}
                  />
                </div>
              </div>

              {/* Dependencies */}
              {selectedNodeData.dependsOn.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Depends On</p>
                  <div className="space-y-1">
                    {selectedNodeData.dependsOn.map((depId) => {
                      const depNode = graph.nodes.find((n) => n.id === depId);
                      if (!depNode) return null;
                      return (
                        <button
                          key={depId}
                          onClick={() => setSelectedNode(depId)}
                          className="w-full text-left px-2 py-1.5 rounded border border-border hover:bg-muted transition-colors"
                        >
                          <span className="text-[10px] font-mono font-bold text-foreground">{depNode.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{depNode.shortSummary}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* "How to Read This Graph" legend panel */}
        {showLegend && !selectedNodeData && (
          <div className="w-72 shrink-0 border-l-2 border-border bg-card overflow-y-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
                How to Read This Graph
              </h3>

              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Layout</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Claims flow left → right. <strong className="text-foreground">Root claims</strong> appear on the left.
                  <strong className="text-foreground"> Dependent claims</strong> appear further right, showing cause → effect.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Node Colors</p>
                <LegendItem color={STATUS_COLORS.supported.fill} title="Supported" desc="Verified by source documents." />
                <LegendItem color={STATUS_COLORS.contradicted.fill} title="Contradicted" desc="Source evidence directly refutes this claim." />
                <LegendItem color={STATUS_COLORS.unverifiable.fill} title="Unverifiable" desc="Source documents are silent on this topic." />
                <LegendItem color={STATUS_COLORS.source_conflict.fill} title="Source Conflict" desc="Multiple sources provide conflicting evidence." />
                <LegendItem color={STATUS_COLORS.cascade.fill} title="Cascade" desc="Invalid because it depends on a contradicted claim." />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Badges</p>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground mt-0.5">
                    ROOT HALLUCINATION
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    A contradicted claim that corrupts downstream claims. Fix this first.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Edge Labels</p>
                <EdgeLegendItem label="Depends on" desc="Downstream claim requires upstream to be true." />
                <EdgeLegendItem label="Derived from" desc="Downstream claim is calculated from upstream data." />
                <EdgeLegendItem label="Assumes" desc="Downstream claim presupposes upstream without derivation." />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Cascade Logic</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When a claim is <strong className="text-destructive">contradicted</strong>, all dependent claims are flagged as
                  <strong className="text-destructive"> cascade hallucinations</strong>. Red dashed edges trace propagation.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Interaction</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Hover</strong> for quick summary.
                  <strong className="text-foreground"> Click</strong> for full details.
                  <strong className="text-foreground"> Scroll</strong> to zoom.
                  <strong className="text-foreground"> Drag</strong> to pan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══ HELPER COMPONENTS ═══

const ColorLegendDot = ({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) => (
  <div className="flex items-center gap-1.5">
    <div
      className={`w-2.5 h-2.5 rounded-full ${pulse ? "animate-pulse-glow" : ""}`}
      style={{ backgroundColor: color }}
    />
    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
  </div>
);

const LegendItem = ({ color, title, desc }: { color: string; title: string; desc: string }) => (
  <div className="flex items-start gap-2">
    <div className="w-3 h-3 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: color }} />
    <div>
      <p className="text-[11px] font-bold text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

const EdgeLegendItem = ({ label, desc }: { label: string; desc: string }) => (
  <div className="flex items-start gap-2">
    <span className="shrink-0 text-[9px] font-mono font-medium text-muted-foreground mt-0.5 border-b border-dashed border-muted-foreground">
      {label}
    </span>
    <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

export default ClaimGraphView;
