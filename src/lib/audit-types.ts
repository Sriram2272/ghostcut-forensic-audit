export type SentenceStatus = "supported" | "contradicted" | "unverifiable" | "source_conflict";

// ═══ MULTI-MODEL VERIFICATION ═══

export type VerifierType = "nli" | "llm_judge" | "rule_based";

export type VerifierVerdict = "supported" | "contradicted" | "unverifiable" | "not_applicable";

export interface ConfidenceRange {
  low: number;  // 0–1
  high: number; // 0–1
  explanation?: string; // e.g. "Explicit negation found in source document."
}

export interface VerifierResult {
  verifier: VerifierType;
  verdict: VerifierVerdict;
  confidence: ConfidenceRange;
  reasoning: string;
  modelName: string; // e.g. "RoBERTa-large-MNLI", "GPT-5 Judge", "NumericChecker v2"
}

export interface MultiModelVerification {
  results: VerifierResult[];
  consensus: boolean; // true if all applicable verifiers agree
  finalVerdict: SentenceStatus;
  disagreementNote?: string; // present when consensus is false
}

export type HallucinationSeverity = "critical" | "moderate" | "minor";

export interface SeverityInfo {
  level: HallucinationSeverity;
  reasoning: string;
}

export interface ConflictEvidence {
  paragraphId: string;
  documentName: string;
  excerpt: string;
}

export interface SourceConflictInfo {
  explanation: string; // explains the conflict is from sources, not the model
  evidenceA: ConflictEvidence;
  evidenceB: ConflictEvidence;
}

export interface CorrectionCitation {
  documentName: string;
  paragraphId: string;
  excerpt: string; // short excerpt from the source used in this segment
}

export interface CorrectionSegment {
  text: string;
  citation?: CorrectionCitation; // if present, this segment is source-backed
}

export interface LockedCorrection {
  segments: CorrectionSegment[];
  sourceLockedNote: string; // explains that only source-present facts were used
  removedContent?: string; // describes what was removed because no source supports it
}

// ═══ RETRIEVED EVIDENCE ═══

export interface RetrievedEvidence {
  chunkId: string;
  documentName: string;
  chunkText: string;
  similarityScore: number;
  chunkIndex: number;
}

export interface AuditSentence {
  id: string;
  text: string;
  status: SentenceStatus;
  confidence: ConfidenceRange;
  reasoning: string;
  evidenceIds: string[]; // links to SourceParagraph ids
  retrievedEvidence: RetrievedEvidence[]; // explicit evidence trail from retrieval
  severity?: SeverityInfo; // only present for contradicted claims
  sourceConflict?: SourceConflictInfo; // only present for source_conflict claims
  correction?: LockedCorrection; // only present for contradicted claims
  verification?: MultiModelVerification; // multi-model verification results
}

export interface SourceParagraph {
  id: string;
  text: string;
  linkedSentenceIds: string[];
}

export interface SourceDocument {
  id: string;
  name: string;
  type: "pdf" | "txt" | "md";
  paragraphs: SourceParagraph[];
}

export type VerificationScope = "uploaded_documents_only";

export interface AuditResult {
  sentences: AuditSentence[];
  documents: SourceDocument[];
  trustScore: number; // now computed dynamically via computeWeightedTrustScore
  verificationScope: VerificationScope; // enforces strict source isolation
}

// ═══════════════════════════════════════════
// STRICTLY COMPUTED TRUST SCORE
// Formula: 100 - (Contradicted% × 1.5) - (Unverifiable% × 0.5)
// Clamped between 0 and 100.
// ═══════════════════════════════════════════

export interface StrictAuditStats {
  total: number;
  supported: number;
  contradicted: number;
  unverifiable: number;
  sourceConflict: number;
  /** Percentages that sum to exactly 100% (adjusted for rounding) */
  percentages: {
    supported: number;
    contradicted: number;
    unverifiable: number;
    sourceConflict: number;
  };
  /** Whether rounding adjustment was applied */
  roundingAdjusted: boolean;
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskReason: string;
  hasCriticalContradiction: boolean;
  insufficient: boolean;
}

/**
 * Compute percentages that are guaranteed to sum to exactly 100%.
 * Uses largest-remainder method to distribute rounding error.
 */
function computeExactPercentages(
  counts: { supported: number; contradicted: number; unverifiable: number; sourceConflict: number },
  total: number
): { percentages: { supported: number; contradicted: number; unverifiable: number; sourceConflict: number }; adjusted: boolean } {
  if (total === 0) {
    return { percentages: { supported: 0, contradicted: 0, unverifiable: 0, sourceConflict: 0 }, adjusted: false };
  }

  const keys = ["supported", "contradicted", "unverifiable", "sourceConflict"] as const;
  const rawPcts = keys.map((k) => (counts[k] / total) * 100);
  const floored = rawPcts.map(Math.floor);
  const remainders = rawPcts.map((r, i) => r - floored[i]);

  let roundedSum = floored.reduce((a, b) => a + b, 0);
  const diff = 100 - roundedSum;

  // Distribute remaining points to entries with largest remainders
  const indices = keys.map((_, i) => i).sort((a, b) => remainders[b] - remainders[a]);
  for (let i = 0; i < diff; i++) {
    floored[indices[i]]++;
  }

  const result = { supported: floored[0], contradicted: floored[1], unverifiable: floored[2], sourceConflict: floored[3] };
  const adjusted = diff > 0;
  return { percentages: result, adjusted };
}

/**
 * Compute trust score using the strict formula:
 * Trust Score = 100 - (Contradicted% × 1.5) - (Unverifiable% × 0.5)
 * Clamped between 0 and 100.
 */
export function computeWeightedTrustScore(sentences: AuditSentence[]): number {
  const stats = computeStrictAuditStats(sentences);
  return stats.trustScore;
}

/**
 * Compute all strictly-derived audit statistics from claim verdicts.
 * Every number is computed, never hardcoded.
 */
export function computeStrictAuditStats(sentences: AuditSentence[]): StrictAuditStats {
  const total = sentences.length;

  if (total === 0) {
    return {
      total: 0,
      supported: 0,
      contradicted: 0,
      unverifiable: 0,
      sourceConflict: 0,
      percentages: { supported: 0, contradicted: 0, unverifiable: 0, sourceConflict: 0 },
      roundingAdjusted: false,
      trustScore: 0,
      riskLevel: "LOW",
      riskReason: "Insufficient data to compute",
      hasCriticalContradiction: false,
      insufficient: true,
    };
  }

  const supported = sentences.filter((s) => s.status === "supported").length;
  const contradicted = sentences.filter((s) => s.status === "contradicted").length;
  const unverifiable = sentences.filter((s) => s.status === "unverifiable").length;
  const sourceConflict = sentences.filter((s) => s.status === "source_conflict").length;

  const counts = { supported, contradicted, unverifiable, sourceConflict };
  const { percentages, adjusted } = computeExactPercentages(counts, total);

  // Exact (non-rounded) percentages for formula precision
  const exactContradictedPct = (contradicted / total) * 100;
  const exactUnverifiablePct = (unverifiable / total) * 100;

  // Trust Score = 100 - (Contradicted% × 1.5) - (Unverifiable% × 0.5)
  const rawScore = 100 - (exactContradictedPct * 1.5) - (exactUnverifiablePct * 0.5);
  const trustScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Check for any CRITICAL severity contradiction
  const hasCriticalContradiction = sentences.some(
    (s) => s.status === "contradicted" && s.severity?.level === "critical"
  );

  // Rule-based risk assessment
  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  let riskReason: string;

  if (hasCriticalContradiction || exactContradictedPct >= 30) {
    riskLevel = "HIGH";
    riskReason = hasCriticalContradiction
      ? `Critical severity contradiction detected (${contradicted} contradicted of ${total} claims, ${percentages.contradicted}%)`
      : `Contradicted claims ≥ 30% (${percentages.contradicted}% of ${total} claims)`;
  } else if (exactContradictedPct >= 10) {
    riskLevel = "MEDIUM";
    riskReason = `Contradicted claims between 10–29% (${percentages.contradicted}% of ${total} claims)`;
  } else {
    riskLevel = "LOW";
    riskReason = `Contradicted claims < 10% (${percentages.contradicted}% of ${total} claims)`;
  }

  return {
    total,
    supported,
    contradicted,
    unverifiable,
    sourceConflict,
    percentages,
    roundingAdjusted: adjusted,
    trustScore,
    riskLevel,
    riskReason,
    hasCriticalContradiction,
    insufficient: false,
  };
}

// MOCK_AUDIT_RESULT has been removed.
// All verification is performed live via the document ingestion pipeline.
