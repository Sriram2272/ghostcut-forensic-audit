// ═══════════════════════════════════════════════════════════════
// VERIFICATION ENGINE
// Matches claims against the vector index to produce AuditResult
// Uses TF-IDF similarity, numeric comparison, and entity overlap
// ═══════════════════════════════════════════════════════════════

import type {
  AuditResult,
  AuditSentence,
  SentenceStatus,
  SourceDocument,
  SourceParagraph,
  MultiModelVerification,
  VerifierResult,
  SeverityInfo,
  HallucinationSeverity,
  LockedCorrection,
  RetrievedEvidence,
} from "@/lib/audit-types";
import type { InMemoryVectorIndex, IngestedDocument, SearchResult } from "@/lib/document-pipeline";

// ═══ SENTENCE SPLITTING ═══

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15); // filter out very short fragments
}

// ═══ NUMBER EXTRACTION ═══

interface ExtractedNumber {
  raw: string;
  value: number;
}

function extractNumbers(text: string): ExtractedNumber[] {
  // Match currency, percentages, plain numbers, numbers with suffixes
  const patterns = /\$?\d[\d,]*\.?\d*\s*(?:million|billion|thousand|%|M|B|K)?/gi;
  const matches = text.match(patterns) || [];

  return matches
    .map((raw) => {
      let clean = raw.replace(/[$,\s]/g, "").toLowerCase();
      let multiplier = 1;

      if (clean.endsWith("million") || clean.endsWith("m")) {
        multiplier = 1e6;
        clean = clean.replace(/million|m$/i, "");
      } else if (clean.endsWith("billion") || clean.endsWith("b")) {
        multiplier = 1e9;
        clean = clean.replace(/billion|b$/i, "");
      } else if (clean.endsWith("thousand") || clean.endsWith("k")) {
        multiplier = 1e3;
        clean = clean.replace(/thousand|k$/i, "");
      } else if (clean.endsWith("%")) {
        clean = clean.replace(/%$/, "");
      }

      const value = parseFloat(clean) * multiplier;
      return { raw: raw.trim(), value };
    })
    .filter((n) => !isNaN(n.value) && n.value > 0);
}

function numericDeviation(claimed: number, source: number): number {
  if (source === 0) return claimed === 0 ? 0 : 1;
  return Math.abs(claimed - source) / Math.abs(source);
}

// ═══ DOMAIN DETECTION (for severity) ═══

function detectSeverityDomain(text: string): HallucinationSeverity {
  const lower = text.toLowerCase();
  const medicalTerms = /\b(fda|clinical|medical|drug|patient|diagnosis|treatment|disease|therapy|dosage|trial|pharmaceutical|health|hospital)\b/;
  const financialTerms = /\b(revenue|profit|valuation|investor|sec|stock|earnings|ipo|funding|financial|million|billion|arR|ebitda)\b/;
  const legalTerms = /\b(law|legal|regulation|compliance|court|statute|liability|contract|patent|license|clearance)\b/;

  if (medicalTerms.test(lower)) return "critical";
  if (financialTerms.test(lower)) return "critical";
  if (legalTerms.test(lower)) return "moderate";
  return "minor";
}

// ═══ ENTITY OVERLAP (simple keyword match ratio) ═══

function entityOverlap(claim: string, source: string): number {
  const claimWords = new Set(
    claim
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const sourceWords = new Set(
    source
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (claimWords.size === 0) return 0;

  let overlap = 0;
  for (const word of claimWords) {
    if (sourceWords.has(word)) overlap++;
  }
  return overlap / claimWords.size;
}

// ═══ THRESHOLDS ═══

const SUPPORTED_THRESHOLD = 0.35;
const UNVERIFIABLE_THRESHOLD = 0.12;
const NUMERIC_TOLERANCE = 0.05; // 5% deviation allowed

// ═══ SINGLE CLAIM VERIFICATION ═══

interface ClaimVerification {
  status: SentenceStatus;
  confidence: number;
  reasoning: string;
  evidenceIds: string[];
  retrievedEvidence: RetrievedEvidence[];
  topResults: SearchResult[];
  severity?: SeverityInfo;
  correction?: LockedCorrection;
  verification: MultiModelVerification;
}

function verifySingleClaim(
  claimText: string,
  index: InMemoryVectorIndex
): ClaimVerification {
  const results = index.search(claimText, 5);
  const topMatch = results[0];
  const topScore = topMatch?.score ?? 0;
  const topChunk = topMatch?.chunk;

  // Extract numbers from claim
  const claimNumbers = extractNumbers(claimText);

  // Extract numbers from top source match
  const sourceNumbers = topChunk ? extractNumbers(topChunk.text) : [];

  // Check for numeric discrepancy
  let hasNumericConflict = false;
  let numericDetail = "";
  let claimedNum: ExtractedNumber | undefined;
  let sourceNum: ExtractedNumber | undefined;

  if (claimNumbers.length > 0 && sourceNumbers.length > 0 && topScore > UNVERIFIABLE_THRESHOLD) {
    for (const cn of claimNumbers) {
      for (const sn of sourceNumbers) {
        const dev = numericDeviation(cn.value, sn.value);
        if (dev > NUMERIC_TOLERANCE) {
          hasNumericConflict = true;
          claimedNum = cn;
          sourceNum = sn;
          numericDetail = `Claimed "${cn.raw}" but source states "${sn.raw}" (deviation: ${(dev * 100).toFixed(1)}%)`;
          break;
        }
      }
      if (hasNumericConflict) break;
    }
  }

  // Check for source conflict (high similarity with different docs giving different numbers)
  let hasSourceConflict = false;
  if (results.length >= 2 && results[0].score > SUPPORTED_THRESHOLD && results[1].score > SUPPORTED_THRESHOLD) {
    if (results[0].chunk.documentId !== results[1].chunk.documentId) {
      const nums0 = extractNumbers(results[0].chunk.text);
      const nums1 = extractNumbers(results[1].chunk.text);
      if (nums0.length > 0 && nums1.length > 0) {
        for (const n0 of nums0) {
          for (const n1 of nums1) {
            if (numericDeviation(n0.value, n1.value) > NUMERIC_TOLERANCE) {
              hasSourceConflict = true;
              break;
            }
          }
          if (hasSourceConflict) break;
        }
      }
    }
  }

  // ═══ DETERMINE STATUS ═══

  let status: SentenceStatus;
  let confidence: number;
  let reasoning: string;

  if (topScore < UNVERIFIABLE_THRESHOLD) {
    // No relevant source found
    status = "unverifiable";
    confidence = 1 - topScore;
    reasoning = `No source document chunk has sufficient semantic similarity to verify this claim. Maximum similarity: ${(topScore * 100).toFixed(1)}%. This claim cannot be confirmed or denied with the uploaded documents.`;
  } else if (hasSourceConflict) {
    status = "source_conflict";
    confidence = 0.6;
    reasoning = `Two source documents provide conflicting information about this claim. "${results[0].chunk.documentName}" and "${results[1].chunk.documentName}" contain relevant but contradictory data. Human review required.`;
  } else if (hasNumericConflict && topScore > UNVERIFIABLE_THRESHOLD) {
    status = "contradicted";
    confidence = Math.min(0.99, topScore + 0.1);
    reasoning = `Semantic match found in "${topChunk!.documentName}" (similarity: ${(topScore * 100).toFixed(1)}%), but numeric discrepancy detected. ${numericDetail}. This constitutes a factual error.`;
  } else if (topScore >= SUPPORTED_THRESHOLD) {
    status = "supported";
    confidence = Math.min(0.99, topScore);
    reasoning = `Strong semantic match found in "${topChunk!.documentName}" (similarity: ${(topScore * 100).toFixed(1)}%). Key content from source chunk aligns with this claim.`;
  } else {
    // Between thresholds — not enough evidence
    status = "unverifiable";
    confidence = 0.5;
    reasoning = `Partial semantic match found (similarity: ${(topScore * 100).toFixed(1)}%), but insufficient evidence to confirm or deny this claim against the uploaded documents.`;
  }

  // ═══ EVIDENCE IDs + RETRIEVED EVIDENCE TRAIL ═══

  const evidenceIds = results
    .filter((r) => r.score > UNVERIFIABLE_THRESHOLD)
    .slice(0, 3)
    .map((r) => r.chunk.id);

  const retrievedEvidence: RetrievedEvidence[] = results
    .filter((r) => r.score > UNVERIFIABLE_THRESHOLD)
    .slice(0, 5)
    .map((r) => ({
      chunkId: r.chunk.id,
      documentName: r.chunk.documentName,
      chunkText: r.chunk.text,
      similarityScore: r.score,
      chunkIndex: r.chunk.chunkIndex,
    }));

  // ═══ SEVERITY (for contradicted claims) ═══

  let severity: SeverityInfo | undefined;
  if (status === "contradicted") {
    const level = detectSeverityDomain(claimText);
    const severityReasons: Record<HallucinationSeverity, string> = {
      critical: `This claim involves medical, financial, or regulatory subject matter where factual errors can cause direct harm. ${numericDetail}`,
      moderate: `This claim involves regulatory or legal context where inaccuracy could have compliance implications. ${numericDetail}`,
      minor: `Factual discrepancy detected but the domain is not classified as high-risk. ${numericDetail}`,
    };
    severity = { level, reasoning: severityReasons[level] };
  }

  // ═══ CORRECTION (for contradicted claims) ═══

  let correction: LockedCorrection | undefined;
  if (status === "contradicted" && topChunk && claimedNum && sourceNum) {
    correction = {
      segments: [
        { text: claimText.replace(claimedNum.raw, "") },
        {
          text: sourceNum.raw,
          citation: {
            documentName: topChunk.documentName,
            paragraphId: topChunk.id,
            excerpt: topChunk.text.slice(0, 200),
          },
        },
      ],
      sourceLockedNote: `Correction uses only data from "${topChunk.documentName}". The claimed value "${claimedNum.raw}" was replaced with the verified value "${sourceNum.raw}" found in the source.`,
      removedContent: `Original value "${claimedNum.raw}" removed — not supported by source documents.`,
    };
  }

  // ═══ MULTI-MODEL VERIFICATION ═══

  const entityScore = topChunk ? entityOverlap(claimText, topChunk.text) : 0;

  const nliResult: VerifierResult = {
    verifier: "nli",
    verdict:
      topScore >= SUPPORTED_THRESHOLD
        ? hasNumericConflict
          ? "contradicted"
          : "supported"
        : topScore < UNVERIFIABLE_THRESHOLD
          ? "unverifiable"
          : "unverifiable",
    confidence: Math.min(0.99, topScore + 0.05),
    reasoning: `TF-IDF semantic similarity: ${(topScore * 100).toFixed(1)}%. ${
      topScore >= SUPPORTED_THRESHOLD
        ? "High textual overlap with source content."
        : "Insufficient textual overlap to establish entailment."
    }`,
    modelName: "TF-IDF Semantic Matcher",
  };

  const llmJudgeResult: VerifierResult = {
    verifier: "llm_judge",
    verdict:
      entityScore > 0.4
        ? hasNumericConflict
          ? "contradicted"
          : "supported"
        : entityScore < 0.15
          ? "unverifiable"
          : "unverifiable",
    confidence: Math.min(0.99, entityScore + 0.1),
    reasoning: `Entity/keyword overlap ratio: ${(entityScore * 100).toFixed(1)}%. ${
      entityScore > 0.4
        ? "Strong entity alignment between claim and source."
        : "Insufficient entity overlap to confirm claim."
    }`,
    modelName: "Entity Overlap Analyzer",
  };

  const ruleResult: VerifierResult = {
    verifier: "rule_based",
    verdict:
      claimNumbers.length === 0
        ? "not_applicable"
        : hasNumericConflict
          ? "contradicted"
          : sourceNumbers.length > 0
            ? "supported"
            : "unverifiable",
    confidence: hasNumericConflict ? 0.95 : claimNumbers.length > 0 && sourceNumbers.length > 0 ? 0.9 : 0,
    reasoning:
      claimNumbers.length === 0
        ? "No numeric claims to verify."
        : hasNumericConflict
          ? `Numeric mismatch: ${numericDetail}`
          : sourceNumbers.length > 0
            ? "Numeric values are consistent between claim and source."
            : "Claim contains numbers but no matching numeric context found in sources.",
    modelName: "NumericChecker v2",
  };

  const applicableResults = [nliResult, llmJudgeResult, ruleResult].filter(
    (r) => r.verdict !== "not_applicable"
  );
  const verdicts = new Set(applicableResults.map((r) => r.verdict));
  const consensus = verdicts.size <= 1;

  const verification: MultiModelVerification = {
    results: [nliResult, llmJudgeResult, ruleResult],
    consensus,
    finalVerdict: status,
    disagreementNote: consensus
      ? undefined
      : `Models disagree on this claim. Verdicts: ${applicableResults
          .map((r) => `${r.modelName} → ${r.verdict}`)
          .join(", ")}. Human review recommended.`,
  };

  return {
    status,
    confidence,
    reasoning,
    evidenceIds,
    retrievedEvidence,
    topResults: results,
    severity,
    correction,
    verification,
  };
}

// ═══ BUILD SOURCE DOCUMENTS FROM INGESTED DATA ═══

function buildSourceDocuments(
  ingestedDocs: IngestedDocument[],
  sentenceEvidenceMap: Map<string, string[]> // chunkId → sentenceIds
): SourceDocument[] {
  return ingestedDocs.map((doc) => {
    const paragraphs: SourceParagraph[] = doc.chunks.map((chunk) => ({
      id: chunk.id,
      text: chunk.text,
      linkedSentenceIds: sentenceEvidenceMap.get(chunk.id) ?? [],
    }));

    const ext = doc.fileType as "pdf" | "txt" | "md";
    const validType = ["pdf", "txt", "md"].includes(ext) ? ext : "txt";

    return {
      id: doc.id,
      name: doc.name,
      type: validType as "pdf" | "txt" | "md",
      paragraphs,
    };
  });
}

// ═══ FULL VERIFICATION PIPELINE ═══

export function runVerification(
  llmText: string,
  index: InMemoryVectorIndex,
  ingestedDocs: IngestedDocument[]
): AuditResult {
  // ═══ HARD GUARD: Retrieval must be possible ═══
  if (index.size === 0) {
    throw new Error(
      "Retrieval-Augmented Verification failed: vector index is empty. No document chunks were indexed. Upload source documents and re-run the audit."
    );
  }

  const sentenceTexts = splitIntoSentences(llmText);

  if (sentenceTexts.length === 0) {
    return {
      sentences: [],
      documents: buildSourceDocuments(ingestedDocs, new Map()),
      trustScore: 100,
      verificationScope: "uploaded_documents_only",
    };
  }

  // Verify each sentence via retrieval
  const sentences: AuditSentence[] = [];
  const chunkToSentences = new Map<string, string[]>();

  for (let i = 0; i < sentenceTexts.length; i++) {
    const id = `s${i + 1}`;
    const text = sentenceTexts[i];
    const result = verifySingleClaim(text, index);

    // Track which chunks are linked to which sentences
    for (const evidenceId of result.evidenceIds) {
      const existing = chunkToSentences.get(evidenceId) ?? [];
      existing.push(id);
      chunkToSentences.set(evidenceId, existing);
    }

    sentences.push({
      id,
      text,
      status: result.status,
      confidence: result.confidence,
      reasoning: result.reasoning,
      evidenceIds: result.evidenceIds,
      retrievedEvidence: result.retrievedEvidence,
      severity: result.severity,
      correction: result.correction,
      verification: result.verification,
    });
  }

  const documents = buildSourceDocuments(ingestedDocs, chunkToSentences);

  return {
    sentences,
    documents,
    trustScore: 0, // computed dynamically via computeWeightedTrustScore
    verificationScope: "uploaded_documents_only",
  };
}
