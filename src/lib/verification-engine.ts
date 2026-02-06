// ═══════════════════════════════════════════════════════════════
// VERIFICATION ENGINE
// 1. Retrieves evidence via TF-IDF (local)
// 2. Sends claims + evidence to AI model for real NLI/judge verdict
// 3. Falls back gracefully on model failure
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
  ConfidenceRange,
} from "@/lib/audit-types";
import type { InMemoryVectorIndex, IngestedDocument, SearchResult } from "@/lib/document-pipeline";
import { supabase } from "@/integrations/supabase/client";

// ═══ SENTENCE SPLITTING ═══

export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

// ═══ NUMBER EXTRACTION ═══

interface ExtractedNumber {
  raw: string;
  value: number;
}

function extractNumbers(text: string): ExtractedNumber[] {
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

// ═══ THRESHOLDS ═══

const UNVERIFIABLE_THRESHOLD = 0.12;
const NUMERIC_TOLERANCE = 0.05;

// ═══ RETRIEVAL STEP (local, TF-IDF) ═══

interface RetrievalResult {
  evidenceIds: string[];
  retrievedEvidence: RetrievedEvidence[];
  topResults: SearchResult[];
  hasSourceConflict: boolean;
  sourceConflictDocs?: [string, string];
}

function retrieveEvidence(
  claimText: string,
  index: InMemoryVectorIndex
): RetrievalResult {
  const results = index.search(claimText, 5);

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

  // Check for source conflict
  let hasSourceConflict = false;
  let sourceConflictDocs: [string, string] | undefined;
  const SUPPORTED_THRESHOLD = 0.35;

  if (results.length >= 2 && results[0].score > SUPPORTED_THRESHOLD && results[1].score > SUPPORTED_THRESHOLD) {
    if (results[0].chunk.documentId !== results[1].chunk.documentId) {
      const nums0 = extractNumbers(results[0].chunk.text);
      const nums1 = extractNumbers(results[1].chunk.text);
      if (nums0.length > 0 && nums1.length > 0) {
        for (const n0 of nums0) {
          for (const n1 of nums1) {
            if (numericDeviation(n0.value, n1.value) > NUMERIC_TOLERANCE) {
              hasSourceConflict = true;
              sourceConflictDocs = [results[0].chunk.documentName, results[1].chunk.documentName];
              break;
            }
          }
          if (hasSourceConflict) break;
        }
      }
    }
  }

  return { evidenceIds, retrievedEvidence, topResults: results, hasSourceConflict, sourceConflictDocs };
}

// ═══ MODEL VERIFICATION RESPONSE ═══

interface ModelVerdict {
  verdict: SentenceStatus;
  confidence: ConfidenceRange;
  reasoning: string;
  nli: VerifierResult;
  judge: VerifierResult;
  modelError?: string;
}

// ═══ CALL AI MODEL VIA EDGE FUNCTION ═══

async function callVerificationModel(
  claims: { claim: string; evidenceChunks: { documentName: string; chunkText: string; chunkId: string }[] }[]
): Promise<(ModelVerdict | { error: string })[]> {
  const { data, error } = await supabase.functions.invoke("verify-claims", {
    body: { claims },
  });

  if (error) {
    console.error("Edge function error:", error);
    return claims.map(() => ({ error: "Verification model unavailable" }));
  }

  if (!data?.results || !Array.isArray(data.results)) {
    console.error("Invalid response from verify-claims:", data);
    return claims.map(() => ({ error: "Verification model returned invalid response" }));
  }

  return data.results.map((result: any) => {
    if (result.error) {
      return { error: result.error };
    }

    const nli: VerifierResult = {
      verifier: "nli",
      verdict: result.nli.verdict,
      confidence: result.nli.confidence as ConfidenceRange,
      reasoning: result.nli.reasoning,
      modelName: "Gemini NLI Classifier",
    };

    const judge: VerifierResult = {
      verifier: "llm_judge",
      verdict: result.judge.verdict,
      confidence: result.judge.confidence as ConfidenceRange,
      reasoning: result.judge.reasoning,
      modelName: "Gemini LLM Judge",
    };

    return {
      verdict: result.verdict as SentenceStatus,
      confidence: result.confidence as ConfidenceRange,
      reasoning: result.reasoning,
      nli,
      judge,
    };
  });
}

// ═══ BUILD CORRECTION (for contradicted claims with numeric mismatch) ═══

function buildCorrection(
  claimText: string,
  topResults: SearchResult[]
): LockedCorrection | undefined {
  if (topResults.length === 0) return undefined;

  const topChunk = topResults[0].chunk;
  const claimNumbers = extractNumbers(claimText);
  const sourceNumbers = extractNumbers(topChunk.text);

  if (claimNumbers.length === 0 || sourceNumbers.length === 0) return undefined;

  for (const cn of claimNumbers) {
    for (const sn of sourceNumbers) {
      if (numericDeviation(cn.value, sn.value) > NUMERIC_TOLERANCE) {
        return {
          segments: [
            { text: claimText.replace(cn.raw, "") },
            {
              text: sn.raw,
              citation: {
                documentName: topChunk.documentName,
                paragraphId: topChunk.id,
                excerpt: topChunk.text.slice(0, 200),
              },
            },
          ],
          sourceLockedNote: `Correction uses only data from "${topChunk.documentName}". The claimed value "${cn.raw}" was replaced with the verified value "${sn.raw}" found in the source.`,
          removedContent: `Original value "${cn.raw}" removed — not supported by source documents.`,
        };
      }
    }
  }

  return undefined;
}

// ═══ BUILD SOURCE DOCUMENTS FROM INGESTED DATA ═══

function buildSourceDocuments(
  ingestedDocs: IngestedDocument[],
  sentenceEvidenceMap: Map<string, string[]>
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

// ═══ FULL VERIFICATION PIPELINE (ASYNC) ═══

export async function runVerification(
  llmText: string,
  index: InMemoryVectorIndex,
  ingestedDocs: IngestedDocument[],
  onProgress?: (completed: number, total: number) => void
): Promise<AuditResult> {
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

  // 1. RETRIEVE evidence for all claims (local, fast)
  const retrievals = sentenceTexts.map((text) => ({
    text,
    retrieval: retrieveEvidence(text, index),
  }));

  // 2. Build model requests — send claims with their retrieved evidence
  const modelRequests = retrievals.map(({ text, retrieval }) => ({
    claim: text,
    evidenceChunks: retrieval.retrievedEvidence.map((e) => ({
      documentName: e.documentName,
      chunkText: e.chunkText,
      chunkId: e.chunkId,
    })),
  }));

  // 3. Call AI model for real verification (batched)
  const BATCH_SIZE = 5;
  const modelResults: (ModelVerdict | { error: string })[] = [];

  for (let i = 0; i < modelRequests.length; i += BATCH_SIZE) {
    const batch = modelRequests.slice(i, i + BATCH_SIZE);
    const batchResults = await callVerificationModel(batch);
    modelResults.push(...batchResults);
    onProgress?.(Math.min(modelResults.length, sentenceTexts.length), sentenceTexts.length);
  }

  // 4. Assemble sentences with model results
  const sentences: AuditSentence[] = [];
  const chunkToSentences = new Map<string, string[]>();
  let modelFailureCount = 0;

  for (let i = 0; i < sentenceTexts.length; i++) {
    const id = `s${i + 1}`;
    const text = sentenceTexts[i];
    const { retrieval } = retrievals[i];
    const modelResult = modelResults[i];

    // Track chunk → sentence links
    for (const evidenceId of retrieval.evidenceIds) {
      const existing = chunkToSentences.get(evidenceId) ?? [];
      existing.push(id);
      chunkToSentences.set(evidenceId, existing);
    }

    // Handle source conflict (overrides model verdict)
    if (retrieval.hasSourceConflict) {
      sentences.push({
        id,
        text,
        status: "source_conflict",
        confidence: { low: 0.35, high: 0.65, explanation: "Sources disagree — confidence reflects inherent ambiguity between conflicting documents." },
        reasoning: `Two source documents provide conflicting information: "${retrieval.sourceConflictDocs?.[0]}" and "${retrieval.sourceConflictDocs?.[1]}". Human review required.`,
        evidenceIds: retrieval.evidenceIds,
        retrievedEvidence: retrieval.retrievedEvidence,
        verification: buildSourceConflictVerification(retrieval),
      });
      continue;
    }

    // Handle model error — mark as verification failed
    if ("error" in modelResult) {
      modelFailureCount++;
      sentences.push({
        id,
        text,
        status: "unverifiable",
        confidence: { low: 0, high: 0, explanation: "Verification model was unavailable — no confidence could be computed. This is not a judgment on the claim itself." },
        reasoning: `Verification model unavailable: ${modelResult.error}. This claim has NOT been verified — no result was fabricated. The uploaded source documents were not consulted due to model failure.`,
        evidenceIds: retrieval.evidenceIds,
        retrievedEvidence: retrieval.retrievedEvidence,
        verification: {
          results: [],
          consensus: false,
          finalVerdict: "unverifiable",
          disagreementNote: `Model error: ${modelResult.error}. No verdict was fabricated.`,
        },
      });
      continue;
    }

    // Use real model verdict
    const status = modelResult.verdict;
    const confidence = modelResult.confidence;
    const reasoning = modelResult.reasoning;

    // Build severity for contradicted claims
    let severity: SeverityInfo | undefined;
    if (status === "contradicted") {
      const level = detectSeverityDomain(text);
      severity = {
        level,
        reasoning: `${level === "critical" ? "High-risk domain (medical/financial/regulatory)" : level === "moderate" ? "Regulatory/legal context" : "General factual claim"}. ${reasoning}`,
      };
    }

    // Build correction for contradicted claims
    const correction = status === "contradicted" ? buildCorrection(text, retrieval.topResults) : undefined;

    // Build rule-based result for numeric check
    const claimNumbers = extractNumbers(text);
    const topChunk = retrieval.topResults[0]?.chunk;
    const sourceNumbers = topChunk ? extractNumbers(topChunk.text) : [];
    let numericDetail = "";
    let hasNumericConflict = false;

    if (claimNumbers.length > 0 && sourceNumbers.length > 0) {
      for (const cn of claimNumbers) {
        for (const sn of sourceNumbers) {
          const dev = numericDeviation(cn.value, sn.value);
          if (dev > NUMERIC_TOLERANCE) {
            hasNumericConflict = true;
            numericDetail = `Claimed "${cn.raw}" vs source "${sn.raw}" (deviation: ${(dev * 100).toFixed(1)}%)`;
            break;
          }
        }
        if (hasNumericConflict) break;
      }
    }

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
      confidence: hasNumericConflict
        ? { low: 0.90, high: 0.98, explanation: `Numeric mismatch detected: ${numericDetail}` }
        : claimNumbers.length > 0 && sourceNumbers.length > 0
          ? { low: 0.85, high: 0.95, explanation: "Numeric values are consistent between claim and source." }
          : { low: 0, high: 0, explanation: "No numeric data found in source documents to compare against." },
      reasoning:
        claimNumbers.length === 0
          ? "No numeric claims to verify."
          : hasNumericConflict
            ? `Numeric mismatch: ${numericDetail}`
            : sourceNumbers.length > 0
              ? "Numeric values are consistent between claim and source."
              : "Claim contains numbers but the uploaded source documents do not contain any matching numeric context. No evidence was fabricated.",
      modelName: "NumericChecker v2",
    };

    const allResults = [modelResult.nli, modelResult.judge, ruleResult];
    const applicableResults = allResults.filter((r) => r.verdict !== "not_applicable");
    const verdicts = new Set(applicableResults.map((r) => r.verdict));
    const consensus = verdicts.size <= 1;

    const verification: MultiModelVerification = {
      results: allResults,
      consensus,
      finalVerdict: status,
      disagreementNote: consensus
        ? undefined
        : `Models disagree. Verdicts: ${applicableResults
            .map((r) => `${r.modelName} → ${r.verdict}`)
            .join(", ")}. Human review recommended.`,
    };

    sentences.push({
      id,
      text,
      status,
      confidence,
      reasoning,
      evidenceIds: retrieval.evidenceIds,
      retrievedEvidence: retrieval.retrievedEvidence,
      severity,
      correction,
      verification,
    });
  }

  // If ALL model calls failed, throw to make the audit visibly fail
  if (modelFailureCount === sentenceTexts.length && sentenceTexts.length > 0) {
    throw new Error(
      "Verification model unavailable — all model calls failed. No results were fabricated. Please try again later."
    );
  }

  const documents = buildSourceDocuments(ingestedDocs, chunkToSentences);

  return {
    sentences,
    documents,
    trustScore: 0,
    verificationScope: "uploaded_documents_only",
  };
}

// ═══ HELPER: build verification for source conflicts ═══

function buildSourceConflictVerification(retrieval: RetrievalResult): MultiModelVerification {
  return {
    results: [
      {
        verifier: "nli",
        verdict: "unverifiable",
        confidence: { low: 0.40, high: 0.65, explanation: "Source documents contain conflicting information — NLI cannot resolve inter-document disagreement." },
        reasoning: "Source documents contain conflicting information — cannot determine entailment.",
        modelName: "Source Conflict Detector",
      },
    ],
    consensus: false,
    finalVerdict: "source_conflict",
    disagreementNote: `Sources "${retrieval.sourceConflictDocs?.[0]}" and "${retrieval.sourceConflictDocs?.[1]}" provide contradictory data. Human review required.`,
  };
}
