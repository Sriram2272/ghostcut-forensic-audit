export type SentenceStatus = "supported" | "contradicted" | "unverifiable" | "source_conflict";

// ═══ MULTI-MODEL VERIFICATION ═══

export type VerifierType = "nli" | "llm_judge" | "rule_based";

export type VerifierVerdict = "supported" | "contradicted" | "unverifiable" | "not_applicable";

export interface VerifierResult {
  verifier: VerifierType;
  verdict: VerifierVerdict;
  confidence: number; // 0–1
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
  confidence: number;
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
// SEVERITY-WEIGHTED TRUST SCORE
// ═══════════════════════════════════════════

const SEVERITY_WEIGHTS: Record<HallucinationSeverity, number> = {
  critical: 3.0,
  moderate: 1.5,
  minor: 0.5,
};

/**
 * Compute a trust score weighted by hallucination severity.
 * Critical errors hurt 3× more than minor ones.
 */
export function computeWeightedTrustScore(sentences: AuditSentence[]): number {
  if (sentences.length === 0) return 100;

  const maxPenalty = sentences.length * SEVERITY_WEIGHTS.critical; // worst case
  let totalPenalty = 0;

  for (const s of sentences) {
    if (s.status === "contradicted" && s.severity) {
      totalPenalty += SEVERITY_WEIGHTS[s.severity.level];
    } else if (s.status === "unverifiable") {
      totalPenalty += 0.3; // minor penalty for unverifiable
    } else if (s.status === "source_conflict") {
      totalPenalty += 0.8; // moderate penalty — not the model's fault but still uncertain
    }
    // supported = 0 penalty
  }

  const score = Math.round(Math.max(0, Math.min(100, 100 * (1 - totalPenalty / maxPenalty) )));
  return score;
}

// MOCK_AUDIT_RESULT has been removed.
// All verification is performed live via the document ingestion pipeline.
