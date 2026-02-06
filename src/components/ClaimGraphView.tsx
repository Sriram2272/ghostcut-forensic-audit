import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { buildClaimGraph, type ClaimNode, type ClaimNodeStatus } from "@/lib/claim-graph-utils";
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

const NODE_RADIUS = 28;

const ClaimGraphView = ({ sentences }: ClaimGraphViewProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panViewStart, setPanViewStart] = useState({ x: 0, y: 0 });

  const graph = useMemo(() => buildClaimGraph(sentences), [sentences]);

  // Compute viewBox to fit all nodes with padding
  useEffect(() => {
    if (graph.nodes.length === 0) return;
    const xs = graph.nodes.map((n) => n.x);
    const ys = graph.nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 80;
    const maxX = Math.max(...xs) + 80;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 80;
    setViewBox({
      x: minX,
      y: minY,
      w: Math.max(maxX - minX, 400),
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b-2 border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-mono font-extrabold tracking-widest uppercase text-foreground">
            Claim Dependency Graph
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground">
            {graph.nodes.length} claims • {graph.edges.length} dependencies
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Legend color={STATUS_COLORS.supported.fill} label="Supported" />
          <Legend color={STATUS_COLORS.contradicted.fill} label="Contradicted" />
          <Legend color={STATUS_COLORS.unverifiable.fill} label="Unverifiable" />
          <Legend color={STATUS_COLORS.source_conflict.fill} label="Source Conflict" />
          <Legend color={STATUS_COLORS.cascade.fill} label={`Cascade (${cascadeCount})`} pulse />
          <div className="ml-auto text-[10px] font-mono text-muted-foreground">
            Scroll to zoom • Drag to pan
          </div>
        </div>
      </div>

      {/* Graph canvas */}
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

        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Arrow marker for normal edges */}
            <marker
              id="arrow-normal"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" opacity="0.4" />
            </marker>
            {/* Arrow marker for cascade edges */}
            <marker
              id="arrow-cascade"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
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
            {/* Cascade pulse filter */}
            <filter id="cascade-glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Animated dash for cascade edges */}
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

            const x1 = fromNode.x + ux * (NODE_RADIUS + 4);
            const y1 = fromNode.y + uy * (NODE_RADIUS + 4);
            const x2 = toNode.x - ux * (NODE_RADIUS + 10);
            const y2 = toNode.y - uy * (NODE_RADIUS + 10);

            // Curved path for visual appeal
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const offsetX = -uy * 20;
            const offsetY = ux * 20;

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
              </g>
            );
          })}

          {/* NODES */}
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
                style={{ transition: "transform 0.15s ease" }}
              >
                {/* Outer glow ring */}
                {(isContradicted || isCascade) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="1.5"
                    opacity={0.3}
                    filter="url(#glow-filter)"
                  >
                    <animate
                      attributeName="r"
                      values={`${NODE_RADIUS + 6};${NODE_RADIUS + 12};${NODE_RADIUS + 6}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.1;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Hover ring */}
                {isHovered && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 5}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                )}

                {/* Main node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill={colors.fill}
                  stroke={isHovered ? colors.stroke : "transparent"}
                  strokeWidth="2"
                  style={{
                    filter: isHovered || isContradicted || isCascade
                      ? `drop-shadow(${colors.glow})`
                      : "none",
                    transform: isHovered ? `scale(1.1)` : "scale(1)",
                    transformOrigin: `${node.x}px ${node.y}px`,
                    transition: "transform 0.15s ease, filter 0.15s ease",
                  }}
                />

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={colors.text}
                  fontSize="13"
                  fontWeight="800"
                  fontFamily="'JetBrains Mono', monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label}
                </text>

                {/* Cascade skull icon */}
                {isCascade && (
                  <text
                    x={node.x + NODE_RADIUS - 4}
                    y={node.y - NODE_RADIUS + 4}
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
              maxWidth: 360,
            }}
          >
            <div className="rounded-lg bg-card border-2 border-border shadow-2xl p-3 space-y-2">
              {/* Header */}
              <div className="flex items-center gap-2">
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
              </div>
              {/* Claim text */}
              <p className="text-xs text-foreground leading-relaxed">
                {hoveredNodeData.text}
              </p>
              {/* Confidence */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Confidence: {(hoveredNodeData.confidence * 100).toFixed(0)}%
                </span>
                {hoveredNodeData.effectiveStatus === "cascade" && (
                  <span className="text-[10px] font-mono text-destructive font-bold">
                    ⚠ Corrupted by upstream hallucination
                  </span>
                )}
              </div>
              {/* Confidence bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${hoveredNodeData.confidence * 100}%`,
                    backgroundColor: STATUS_COLORS[hoveredNodeData.effectiveStatus].fill,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Legend = ({
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

export default ClaimGraphView;
