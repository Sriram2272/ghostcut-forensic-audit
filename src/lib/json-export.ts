import type { AuditResult } from "@/lib/audit-types";
import { computeStrictAuditStats } from "@/lib/audit-types";

export function generateAuditJSON(auditResult: AuditResult, auditDurationMs: number): void {
  const stats = computeStrictAuditStats(auditResult.sentences);

  const exportData = {
    meta: {
      tool: "GHOSTCUT Forensic Audit",
      version: "1.0.0-alpha",
      generatedAt: new Date().toISOString(),
      auditDurationMs,
    },
    trustScore: stats.trustScore,
    riskLevel: stats.riskLevel,
    riskReason: stats.riskReason,
    verdictDistribution: {
      total: stats.total,
      supported: stats.supported,
      contradicted: stats.contradicted,
      unverifiable: stats.unverifiable,
      sourceConflict: stats.sourceConflict,
      percentages: stats.percentages,
    },
    claims: auditResult.sentences.map((s, i) => ({
      id: `C${i + 1}`,
      text: s.text,
      status: s.status,
      confidence: s.confidence,
      reasoning: s.reasoning,
      severity: s.severity ?? null,
      correction: s.correction ?? null,
      retrievedEvidence: s.retrievedEvidence.map((e) => ({
        documentName: e.documentName,
        chunkText: e.chunkText,
        similarityScore: e.similarityScore,
      })),
    })),
    documents: auditResult.documents.map((d) => ({
      name: d.name,
      type: d.type,
      paragraphCount: d.paragraphs.length,
      referencedParagraphs: d.paragraphs.filter((p) => p.linkedSentenceIds.length > 0).length,
    })),
    verificationScope: auditResult.verificationScope,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ghostcut-forensic-audit-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateAuditCSV(auditResult: AuditResult, auditDurationMs: number): void {
  const rows: string[][] = [];

  rows.push(["Claim ID", "Text", "Status", "Confidence Low", "Confidence High", "Severity", "Reasoning"]);

  auditResult.sentences.forEach((s, i) => {
    rows.push([
      `C${i + 1}`,
      `"${s.text.replace(/"/g, '""')}"`,
      s.status,
      (s.confidence.low * 100).toFixed(0) + "%",
      (s.confidence.high * 100).toFixed(0) + "%",
      s.severity?.level ?? "—",
      `"${(s.reasoning || "").replace(/"/g, '""')}"`,
    ]);
  });

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ghostcut-forensic-audit-${timestamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateAuditMarkdown(auditResult: AuditResult, auditDurationMs: number): void {
  const stats = computeStrictAuditStats(auditResult.sentences);
  const lines: string[] = [];

  lines.push("# GHOSTCUT Forensic Audit Report");
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Duration:** ${auditDurationMs < 1000 ? `${auditDurationMs}ms` : `${(auditDurationMs / 1000).toFixed(1)}s`}`);
  lines.push("");
  lines.push(`## Trust Score: ${stats.trustScore} — ${stats.riskLevel} RISK`);
  lines.push(`> ${stats.riskReason}`);
  lines.push("");
  lines.push("## Verdict Distribution");
  lines.push(`| Status | Count | % |`);
  lines.push(`|--------|-------|---|`);
  lines.push(`| Supported | ${stats.supported} | ${stats.percentages.supported}% |`);
  lines.push(`| Contradicted | ${stats.contradicted} | ${stats.percentages.contradicted}% |`);
  lines.push(`| Unverifiable | ${stats.unverifiable} | ${stats.percentages.unverifiable}% |`);
  lines.push(`| Source Conflict | ${stats.sourceConflict} | ${stats.percentages.sourceConflict}% |`);
  lines.push("");
  lines.push("## Claim Verdicts");
  lines.push("");

  auditResult.sentences.forEach((s, i) => {
    const conf = `${(s.confidence.low * 100).toFixed(0)}–${(s.confidence.high * 100).toFixed(0)}%`;
    lines.push(`### C${i + 1} — ${s.status.toUpperCase().replace("_", " ")} (${conf})`);
    lines.push(`> ${s.text}`);
    if (s.reasoning) lines.push(`\n*${s.reasoning}*`);
    lines.push("");
  });

  const md = lines.join("\n");
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ghostcut-forensic-audit-${timestamp}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
