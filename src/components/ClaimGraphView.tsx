import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { buildClaimGraph, type ClaimNode, type ClaimNodeStatus, type EdgeRelation } from "@/lib/claim-graph-utils";
import type { AuditSentence } from "@/lib/audit-types";

interface ClaimGraphViewProps {
  sentences: AuditSentence[];
}

// ═══ STATUS VISUAL CONFIG ═══
const STATUS_COLORS: Record<ClaimNodeStatus, { fill: string; stroke: string; text: string; glow: string }> = {
  supported: {
    fill: "hsl(var(--verified))",
    stroke: "hsl(var(--verified))",
    text: "hsl(var(--verified-foreground))",
    glow: "0 0 20px hsl(var(--verified) / 0.5)",
  },
  contradicted: {
    fill: "hsl(var(--destructive))",
    stroke: "hsl(var(--destructive))",
    text: "hsl(var(--destructive-foreground))",
    glow: "0 0 25px hsl(var(--destructive) / 0.6)",
  },
  unverifiable: {
    fill: "hsl(var(--warning))",
    stroke: "hsl(var(--warning))",
    text: "hsl(var(--warning-foreground))",
    glow: "0 0 20px hsl(var(--warning) / 0.5)",
  },
  source_conflict: {
    fill: "hsl(var(--conflict))",
    stroke: "hsl(var(--conflict))",
    text: "hsl(var(--conflict-foreground))",
    glow: "0 0 20px hsl(var(--conflict) / 0.5)",
  },
  cascade: {
    fill: "hsl(0 70% 35%)",
    stroke: "hsl(var(--destructive))",
    text: "hsl(0 0% 100%)",
    glow: "0 0 30px hsl(var(--destructive) / 0.4)",
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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;
const NODE_RX = 10;

const ClaimGraphView = ({ sentences }: ClaimGraphViewProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panViewStart, setPanViewStart] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(true);

  const graph = useMemo(() => buildClaimGraph(sentences), [sentences]);

  // Compute viewBox to fit all nodes with padding
  useEffect(() => {
    if (graph.nodes.length === 0) return;
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 120;
    const maxX = Math.max(...xs) + 120;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 80;
    setViewBox({
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 500),
      h: Math.max(maxY - minY, 300),
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
        return {
          x: cx - newW / 2,
          y: cy - newH / 2,
          w: newW,
          h: newH,
        };
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

  const hoveredNodeData = useMemo(
    () => graph.nodes.find((n) => n.id === hoveredNode) ?? null,
    [hoveredNode, graph.nodes]
  );

  // Cascade stats
  const cascadeCount = graph.nodes.filter((n) => n.effectiveStatus === "cascade").length;
  const rootCauseCount = graph.nodes.filter((n) => n.isRootCause).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
            Scroll to zoom • Drag to pan
          </div>
        </div>
      </div>

      {/* Graph canvas + legend side by side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main graph */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative bg-background cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />

          {/* Cascade explanation banner */}
          {cascadeCount > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg border-2 border-destructive/30 bg-destructive/10 backdrop-blur-sm max-w-lg text-center">
              <p className="text-[11px] font-mono font-bold text-destructive">
                ⚠ Cascade Detected — {cascadeCount} claim{cascadeCount > 1 ? "s are" : " is"} incorrect because {cascadeCount > 1 ? "they depend" : "it depends"} on a contradicted claim.
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
              {/* Arrow markers */}
              <marker id="arrow-normal" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" opacity="0.4" />
              </marker>
              <marker id="arrow-cascade" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--destructive))" opacity="0.8" />
              </marker>
              {/* Glow filter */}
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="cascade-glow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
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
                  animation: dash-flow 0.8s linear infinite;
                }
              `}</style>
            </defs>

            {/* EDGES */}
            {graph.edges.map((edge) => {
              const fromNode = graph.nodes.find((n) => n.id === edge.from);
              const toNode = graph.nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;

              const ux = dx / dist;
              const uy = dy / dist;

              const exitR = NODE_WIDTH / 2 + 4;
              const entryR = NODE_WIDTH / 2 + 10;

              const x1 = fromNode.x + ux * exitR;
              const y1 = fromNode.y + uy * (NODE_HEIGHT / 2 + 4);
              const x2 = toNode.x - ux * entryR;
              const y2 = toNode.y - uy * (NODE_HEIGHT / 2 + 10);

              // Curved path
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              const offsetX = -uy * 20;
              const offsetY = ux * 20;

              // Edge label position
              const labelX = midX + offsetX * 0.5;
              const labelY = midY + offsetY * 0.5 - 6;

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  {edge.isCascade && (
                    <path
                      d={`M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`}
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="6"
                      opacity="0.15"
                      filter="url(#cascade-glow)"
                    />
                  )}
                  <path
                    d={`M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`}
                    fill="none"
                    stroke={edge.isCascade ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                    strokeWidth={edge.isCascade ? 2.5 : 1.5}
                    strokeDasharray={edge.isCascade ? "6 4" : "none"}
                    opacity={edge.isCascade ? 0.85 : 0.25}
                    markerEnd={edge.isCascade ? "url(#arrow-cascade)" : "url(#arrow-normal)"}
                    className={edge.isCascade ? "cascade-edge" : ""}
                  />
                  {/* Edge relation label */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="auto"
                    fill={edge.isCascade ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                    fontSize="8"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={edge.isCascade ? "700" : "500"}
                    opacity={edge.isCascade ? 0.9 : 0.5}
                    style={{ pointerEvents: "none" }}
                  >
                    {EDGE_RELATION_LABELS[edge.relation]}
                  </text>
                </g>
              );
            })}

            {/* NODES — rounded rectangles with short summaries */}
            {graph.nodes.map((node) => {
              const colors = STATUS_COLORS[node.effectiveStatus];
              const isHovered = hoveredNode === node.id;
              const isCascade = node.effectiveStatus === "cascade";
              const isContradicted = node.effectiveStatus === "contradicted";

              return (
                <g
                  key={node.id}
                  onMouseEnter={(e) => handleNodeHover(node.id, e)}
                  onMouseMove={(e) => handleNodeHover(node.id, e)}
                  onMouseLeave={() => handleNodeHover(null)}
                  className="cursor-pointer"
                >
                  {/* Outer glow ring for danger nodes */}
                  {(isContradicted || isCascade) && (
                    <rect
                      x={node.x - NODE_WIDTH / 2 - 6}
                      y={node.y - NODE_HEIGHT / 2 - 6}
                      width={NODE_WIDTH + 12}
                      height={NODE_HEIGHT + 12}
                      rx={NODE_RX + 4}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="1.5"
                      opacity={0.3}
                      filter="url(#glow-filter)"
                    >
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}

                  {/* Hover ring */}
                  {isHovered && (
                    <rect
                      x={node.x - NODE_WIDTH / 2 - 4}
                      y={node.y - NODE_HEIGHT / 2 - 4}
                      width={NODE_WIDTH + 8}
                      height={NODE_HEIGHT + 8}
                      rx={NODE_RX + 2}
                      fill="none"
                      stroke={colors.stroke}
                      strokeWidth="2"
                      opacity="0.6"
                    />
                  )}

                  {/* Main node rectangle */}
                  <rect
                    x={node.x - NODE_WIDTH / 2}
                    y={node.y - NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={NODE_RX}
                    fill={colors.fill}
                    stroke={isHovered ? colors.stroke : "transparent"}
                    strokeWidth="2"
                    style={{
                      filter: isHovered || isContradicted || isCascade
                        ? `drop-shadow(${colors.glow})`
                        : "none",
                      transform: isHovered ? `scale(1.05)` : "scale(1)",
                      transformOrigin: `${node.x}px ${node.y}px`,
                      transition: "transform 0.15s ease, filter 0.15s ease",
                    }}
                  />

                  {/* Claim short summary (primary label) */}
                  <text
                    x={node.x}
                    y={node.y - 6}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={colors.text}
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="'JetBrains Mono', monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.shortSummary.length > 24 ? node.shortSummary.slice(0, 22) + "…" : node.shortSummary}
                  </text>

                  {/* Claim label (C1, C2, etc.) — secondary */}
                  <text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={colors.text}
                    fontSize="8"
                    fontWeight="500"
                    fontFamily="'JetBrains Mono', monospace"
                    opacity={0.7}
                    style={{ pointerEvents: "none" }}
                  >
                    {node.label}
                  </text>

                  {/* Root Hallucination badge */}
                  {node.isRootCause && (
                    <g>
                      <rect
                        x={node.x - 42}
                        y={node.y - NODE_HEIGHT / 2 - 16}
                        width={84}
                        height={14}
                        rx={3}
                        fill="hsl(var(--destructive))"
                        opacity={0.95}
                      />
                      <text
                        x={node.x}
                        y={node.y - NODE_HEIGHT / 2 - 9}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="hsl(0 0% 100%)"
                        fontSize="7"
                        fontWeight="800"
                        fontFamily="'JetBrains Mono', monospace"
                        letterSpacing="0.5"
                        style={{ pointerEvents: "none" }}
                      >
                        ROOT HALLUCINATION
                      </text>
                    </g>
                  )}

                  {/* Cascade warning icon */}
                  {isCascade && !node.isRootCause && (
                    <text
                      x={node.x + NODE_WIDTH / 2 - 8}
                      y={node.y - NODE_HEIGHT / 2 - 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="12"
                      style={{ pointerEvents: "none" }}
                    >
                      ⚠
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredNodeData && (
            <div
              className="fixed z-50 pointer-events-none animate-fade-in-up"
              style={{
                left: tooltipPos.x + 16,
                top: tooltipPos.y - 10,
                maxWidth: 400,
              }}
            >
              <div className="rounded-lg bg-card border-2 border-border shadow-2xl p-3 space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill }}
                  />
                  <span className="text-xs font-mono font-extrabold text-foreground">
                    {hoveredNodeData.label}
                  </span>
                  <span
                    className="text-[9px] font-mono font-extrabold tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill,
                      backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[hoveredNodeData.effectiveStatus].fill} 15%, transparent)`,
                    }}
                  >
                    {STATUS_LABELS[hoveredNodeData.effectiveStatus]}
                  </span>
                  {hoveredNodeData.isRootCause && (
                    <span className="text-[9px] font-mono font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground">
                      ROOT HALLUCINATION
                    </span>
                  )}
                </div>
                {/* Claim text */}
                <p className="text-xs text-foreground leading-relaxed">
                  {hoveredNodeData.text}
                </p>
                {/* Cascade explanation */}
                {hoveredNodeData.effectiveStatus === "cascade" && (
                  <div className="px-2 py-1.5 rounded border border-destructive/30 bg-destructive/10">
                    <p className="text-[10px] font-mono text-destructive font-bold">
                      ⚠ This claim is incorrect because it depends on a contradicted claim.
                    </p>
                  </div>
                )}
                {/* Confidence */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Confidence: {(hoveredNodeData.confidenceLow * 100).toFixed(0)}–{(hoveredNodeData.confidenceHigh * 100).toFixed(0)}%
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute h-full rounded-full transition-all opacity-30"
                    style={{
                      left: `${hoveredNodeData.confidenceLow * 100}%`,
                      width: `${(hoveredNodeData.confidenceHigh - hoveredNodeData.confidenceLow) * 100}%`,
                      backgroundColor: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill,
                    }}
                  />
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((hoveredNodeData.confidenceLow + hoveredNodeData.confidenceHigh) / 2) * 100}%`,
                      backgroundColor: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* "How to Read This Graph" legend panel */}
        {showLegend && (
          <div className="w-72 shrink-0 border-l-2 border-border bg-card overflow-y-auto">
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
                How to Read This Graph
              </h3>

              {/* Layout explanation */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Layout</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Claims flow left → right. <strong className="text-foreground">Root claims</strong> (no dependencies) appear on the left. 
                  <strong className="text-foreground"> Dependent claims</strong> appear further right, showing cause → effect relationships.
                </p>
              </div>

              {/* Node colors */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Node Colors</p>
                <LegendItem color={STATUS_COLORS.supported.fill} title="Supported" desc="Verified by source documents." />
                <LegendItem color={STATUS_COLORS.contradicted.fill} title="Contradicted" desc="Source evidence directly refutes this claim." />
                <LegendItem color={STATUS_COLORS.unverifiable.fill} title="Unverifiable" desc="Source documents are silent on this topic." />
                <LegendItem color={STATUS_COLORS.source_conflict.fill} title="Source Conflict" desc="Multiple sources provide conflicting evidence." />
                <LegendItem color={STATUS_COLORS.cascade.fill} title="Cascade Hallucination" desc="This claim may be invalid because it depends on a contradicted upstream claim." />
              </div>

              {/* Badges */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Badges</p>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground mt-0.5">
                    ROOT HALLUCINATION
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A contradicted claim that other claims depend on. Fixing this root cause may resolve downstream cascade errors.
                  </p>
                </div>
              </div>

              {/* Edge labels */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Edge Labels</p>
                <EdgeLegendItem label="Depends on" desc="The downstream claim requires the upstream claim to be true." />
                <EdgeLegendItem label="Derived from" desc="The downstream claim is calculated or inferred from the upstream claim." />
                <EdgeLegendItem label="Assumes" desc="The downstream claim presupposes the upstream claim without explicit derivation." />
              </div>

              {/* Cascade explanation */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Cascade Logic</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  When a claim is <strong className="text-destructive">contradicted</strong>, all claims that depend on it (directly or indirectly) are automatically flagged as <strong className="text-destructive">cascade hallucinations</strong>.
                  The animated red dashed edges trace the propagation path.
                </p>
              </div>

              {/* Interaction hints */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <p className="text-[10px] font-mono font-bold text-foreground uppercase tracking-wider">Interaction</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Hover</strong> any node to see the full claim text, confidence range, and cascade details.
                  <strong className="text-foreground"> Scroll</strong> to zoom. <strong className="text-foreground">Drag</strong> to pan.
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

const ColorLegendDot = ({
  color,
  label,
  pulse,
}: {
  color: string;
  label: string;
  pulse?: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    <div
      className={`w-3 h-3 rounded-full ${pulse ? "animate-pulse-glow" : ""}`}
      style={{ backgroundColor: color }}
    />
    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
  </div>
);

const LegendItem = ({
  color,
  title,
  desc,
}: {
  color: string;
  title: string;
  desc: string;
}) => (
  <div className="flex items-start gap-2">
    <div className="w-3 h-3 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: color }} />
    <div>
      <p className="text-[11px] font-mono font-bold text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </div>
);

const EdgeLegendItem = ({
  label,
  desc,
}: {
  label: string;
  desc: string;
}) => (
  <div className="flex items-start gap-2">
    <span className="shrink-0 text-[9px] font-mono font-bold text-muted-foreground mt-0.5 border-b border-dashed border-muted-foreground">
      {label}
    </span>
    <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

export default ClaimGraphView;
