// ═══════════════════════════════════════════
// PDF FORENSIC AUDIT REPORT GENERATOR
// ═══════════════════════════════════════════

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditResult, AuditSentence } from "@/lib/audit-types";
import { computeStrictAuditStats } from "@/lib/audit-types";

const STATUS_COLORS: Record<string, [number, number, number]> = {
  supported: [34, 197, 94],     // green
  contradicted: [239, 68, 68],  // red
  unverifiable: [234, 179, 8],  // yellow
  source_conflict: [168, 85, 247], // purple
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "CRITICAL",
  moderate: "MODERATE",
  minor: "MINOR",
};

export function generateAuditPDF(auditResult: AuditResult, auditDurationMs: number): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const stats = computeStrictAuditStats(auditResult.sentences);

  // ═══ HEADER ═══
  doc.setFillColor(20, 25, 35);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("GHOSTCUT", margin, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("FORENSIC AUDIT REPORT", margin, 26);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`, margin, 33);
  doc.text(`Audit Duration: ${auditDurationMs < 1000 ? `${auditDurationMs}ms` : `${(auditDurationMs / 1000).toFixed(1)}s`}`, pageWidth - margin - 50, 33);

  y = 50;

  // ═══ TRUST SCORE SECTION ═══
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Trust Score & Risk Assessment", margin, y);
  y += 8;

  // Score box
  const scoreColor = stats.trustScore >= 80 ? [34, 197, 94] : stats.trustScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(margin, y, 30, 20, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(String(stats.trustScore), margin + 15, y + 13, { align: "center" });

  // Risk level
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const riskColors: Record<string, [number, number, number]> = {
    LOW: [34, 197, 94],
    MEDIUM: [234, 179, 8],
    HIGH: [239, 68, 68],
  };
  const riskColor = riskColors[stats.riskLevel] || [100, 100, 100];
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`${stats.riskLevel} RISK`, margin + 35, y + 8);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(stats.riskReason, margin + 35, y + 14);

  y += 26;

  // ═══ FORMULA BREAKDOWN ═══
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Trust Score Formula", margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Score = 100 − (Contradicted% × 1.5) − (Unverifiable% × 0.5), clamped [0, 100]", margin, y);
  y += 4;

  const exactContradictedPct = stats.total > 0 ? (stats.contradicted / stats.total) * 100 : 0;
  const exactUnverifiablePct = stats.total > 0 ? (stats.unverifiable / stats.total) * 100 : 0;
  doc.text(
    `= 100 − (${exactContradictedPct.toFixed(1)}% × 1.5) − (${exactUnverifiablePct.toFixed(1)}% × 0.5) = ${stats.trustScore}`,
    margin,
    y
  );
  y += 6;

  doc.text("Risk Classification Rules:", margin, y);
  y += 4;
  doc.text("• HIGH RISK → Any CRITICAL contradiction OR contradicted ≥ 30%", margin + 3, y);
  y += 3.5;
  doc.text("• MEDIUM RISK → Contradicted between 10–29%", margin + 3, y);
  y += 3.5;
  doc.text("• LOW RISK → Contradicted < 10%", margin + 3, y);
  y += 8;

  // ═══ VERDICT DISTRIBUTION TABLE ═══
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Verdict Distribution", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Status", "Count", "Percentage"]],
    body: [
      ["Supported", String(stats.supported), `${stats.percentages.supported}%`],
      ["Contradicted", String(stats.contradicted), `${stats.percentages.contradicted}%`],
      ["Unverifiable", String(stats.unverifiable), `${stats.percentages.unverifiable}%`],
      ["Source Conflict", String(stats.sourceConflict), `${stats.percentages.sourceConflict}%`],
      ["TOTAL", String(stats.total), "100%"],
    ],
    margin: { left: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 35, 50], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 4) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [230, 230, 240];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ═══ CLAIM VERDICTS TABLE ═══
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Claim Verdicts with Confidence Ranges", margin, y);
  y += 2;

  const claimRows = auditResult.sentences.map((s, i) => {
    const confRange = `${(s.confidence.low * 100).toFixed(0)}–${(s.confidence.high * 100).toFixed(0)}%`;
    const severity = s.severity ? SEVERITY_LABELS[s.severity.level] || "" : "";
    const truncatedText = s.text.length > 80 ? s.text.slice(0, 77) + "…" : s.text;
    return [
      `C${i + 1}`,
      truncatedText,
      s.status.toUpperCase().replace("_", " "),
      confRange,
      severity,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["ID", "Claim", "Verdict", "Confidence", "Severity"]],
    body: claimRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [30, 35, 50], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold" },
      1: { cellWidth: 80 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const status = data.cell.raw?.toString().toLowerCase().replace(" ", "_") || "";
        const color = STATUS_COLORS[status];
        if (color) {
          data.cell.styles.textColor = color;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ═══ DETAILED CLAIM ANALYSIS ═══
  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Claim Analysis", margin, y);
  y += 8;

  for (const sentence of auditResult.sentences) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    const color = STATUS_COLORS[sentence.status] || [100, 100, 100];

    // Status indicator bar
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, y, 2, 18, "F");

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const statusLabel = sentence.status.toUpperCase().replace("_", " ");
    const confLabel = `${(sentence.confidence.low * 100).toFixed(0)}–${(sentence.confidence.high * 100).toFixed(0)}%`;
    doc.text(`${statusLabel} | Confidence: ${confLabel}`, margin + 5, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(7.5);
    const claimLines = doc.splitTextToSize(sentence.text, contentWidth - 8);
    doc.text(claimLines, margin + 5, y + 9);

    const textHeight = claimLines.length * 3.5;
    y += Math.max(20, textHeight + 10);

    // Reasoning
    if (sentence.reasoning) {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const reasoningLines = doc.splitTextToSize(`Reasoning: ${sentence.reasoning}`, contentWidth - 10);
      if (y + reasoningLines.length * 3 > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(reasoningLines, margin + 5, y);
      y += reasoningLines.length * 3 + 4;
    }
  }

  // ═══ SOURCE DOCUMENTS ═══
  doc.addPage();
  y = margin;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Source Documents Referenced", margin, y);
  y += 8;

  for (const docItem of auditResult.documents) {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`${docItem.name} (${docItem.type.toUpperCase()})`, margin, y);
    y += 5;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${docItem.paragraphs.length} paragraphs | ${docItem.paragraphs.filter((p) => p.linkedSentenceIds.length > 0).length} referenced by claims`, margin, y);
    y += 6;
  }

  // ═══ VERIFICATION SCOPE FOOTER ═══
  y += 5;
  doc.setFillColor(245, 245, 250);
  doc.rect(margin, y, contentWidth, 15, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("Verification Scope: UPLOADED DOCUMENTS ONLY", margin + 3, y + 5);
  doc.text("No external knowledge, internet search, or prior audit data was used.", margin + 3, y + 9);
  doc.text("All statistics are strictly computed from actual claim verdicts.", margin + 3, y + 13);

  // ═══ SAVE ═══
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  doc.save(`ghostcut-forensic-audit-${timestamp}.pdf`);
}
