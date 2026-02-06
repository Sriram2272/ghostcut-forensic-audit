// ═══════════════════════════════════════════════════════════════
// DOCUMENT INGESTION PIPELINE
// Reads files → chunks text → builds TF-IDF vectors → in-memory index
// ═══════════════════════════════════════════════════════════════

export interface TextChunk {
  id: string;
  text: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  tokenEstimate: number;
}

export interface SearchResult {
  chunk: TextChunk;
  score: number;
}

// ═══ STOP WORDS ═══
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "have", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "this", "that", "these", "those",
  "it", "its", "as", "if", "not", "no", "so", "up", "out", "about",
  "into", "than", "then", "he", "she", "we", "they", "their", "our",
  "your", "my", "his", "her", "which", "what", "who", "whom", "how",
  "when", "where", "why", "all", "each", "every", "both", "few", "more",
  "most", "other", "some", "such", "only", "own", "same", "very",
  "also", "just", "over", "after", "before", "between", "through",
  "during", "without", "again", "further", "once", "here", "there",
  "any", "much", "many", "well", "back", "even", "still", "already",
]);

// ═══ FILE READING ═══

export async function readFileContent(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const textExtensions = ["txt", "md", "csv", "json", "text", "log", "xml", "html", "htm"];

  if (textExtensions.includes(ext)) {
    return file.text();
  }

  if (ext === "pdf" || ext === "doc" || ext === "docx") {
    // Attempt text extraction — binary formats will produce garbled output
    // For production, server-side extraction (pdfjs, mammoth) is recommended
    const text = await file.text();
    // Filter out non-printable characters common in binary files
    const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n");
    if (cleaned.trim().length < 50) {
      throw new Error(
        `Could not extract text from "${file.name}". Binary formats (PDF/DOC) should be converted to .txt or .md for accurate processing.`
      );
    }
    return cleaned;
  }

  // Fallback: try reading as text
  return file.text();
}

// ═══ TEXT CHUNKING (300–500 tokens) ═══

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters (GPT-style tokenization)
  return Math.ceil(text.length / 4);
}

export function chunkText(
  text: string,
  documentId: string,
  documentName: string,
  targetTokens: number = 400,
  overlapSentences: number = 2
): TextChunk[] {
  // Split into sentences
  const sentences = text
    .split(/(?<=[.!?:;])\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length === 0) {
    // Fallback: split by character count
    const chunks: TextChunk[] = [];
    const charTarget = targetTokens * 4;
    for (let i = 0; i < text.length; i += charTarget) {
      const segment = text.slice(i, i + charTarget).trim();
      if (segment) {
        chunks.push({
          id: `${documentId}-c${chunks.length}`,
          text: segment,
          documentId,
          documentName,
          chunkIndex: chunks.length,
          tokenEstimate: estimateTokens(segment),
        });
      }
    }
    return chunks;
  }

  const chunks: TextChunk[] = [];
  let currentSentences: string[] = [];
  let currentTokens = 0;
  const maxTokens = 500;
  const minTokens = 200;

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentTokens >= minTokens) {
      // Flush current chunk
      const chunkText = currentSentences.join(" ").trim();
      chunks.push({
        id: `${documentId}-c${chunks.length}`,
        text: chunkText,
        documentId,
        documentName,
        chunkIndex: chunks.length,
        tokenEstimate: estimateTokens(chunkText),
      });

      // Keep overlap
      const overlap = currentSentences.slice(-overlapSentences);
      currentSentences = [...overlap];
      currentTokens = overlap.reduce((sum, s) => sum + estimateTokens(s), 0);
    }

    currentSentences.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Flush remaining
  if (currentSentences.length > 0) {
    const chunkText = currentSentences.join(" ").trim();
    if (chunkText) {
      chunks.push({
        id: `${documentId}-c${chunks.length}`,
        text: chunkText,
        documentId,
        documentName,
        chunkIndex: chunks.length,
        tokenEstimate: estimateTokens(chunkText),
      });
    }
  }

  return chunks;
}

// ═══ TOKENIZATION ═══

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.%$]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ═══ TF-IDF VECTORIZATION ═══

function buildVocabulary(chunks: TextChunk[]): Map<string, number> {
  const vocab = new Map<string, number>();
  let idx = 0;
  for (const chunk of chunks) {
    for (const word of tokenize(chunk.text)) {
      if (!vocab.has(word)) {
        vocab.set(word, idx++);
      }
    }
  }
  return vocab;
}

function computeIdf(chunks: TextChunk[], vocab: Map<string, number>): Float64Array {
  const n = chunks.length;
  const df = new Float64Array(vocab.size);

  for (const chunk of chunks) {
    const seen = new Set<number>();
    for (const word of tokenize(chunk.text)) {
      const idx = vocab.get(word);
      if (idx !== undefined && !seen.has(idx)) {
        df[idx]++;
        seen.add(idx);
      }
    }
  }

  const idf = new Float64Array(vocab.size);
  for (let i = 0; i < vocab.size; i++) {
    idf[i] = Math.log((n + 1) / (df[i] + 1)) + 1;
  }
  return idf;
}

function computeTfIdf(
  text: string,
  vocab: Map<string, number>,
  idf: Float64Array
): Float64Array {
  const words = tokenize(text);
  const tf = new Float64Array(vocab.size);

  for (const word of words) {
    const idx = vocab.get(word);
    if (idx !== undefined) tf[idx]++;
  }

  // Normalize TF by max frequency
  let maxTf = 0;
  for (let i = 0; i < tf.length; i++) {
    if (tf[i] > maxTf) maxTf = tf[i];
  }
  if (maxTf === 0) maxTf = 1;

  const vector = new Float64Array(vocab.size);
  for (let i = 0; i < vocab.size; i++) {
    vector[i] = (tf[i] / maxTf) * idf[i];
  }
  return vector;
}

function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ═══ IN-MEMORY VECTOR INDEX ═══

interface VectorEntry {
  chunk: TextChunk;
  vector: Float64Array;
}

export class InMemoryVectorIndex {
  private entries: VectorEntry[] = [];
  private vocab: Map<string, number> = new Map();
  private idf: Float64Array = new Float64Array(0);

  /** Build the TF-IDF index from document chunks */
  buildIndex(chunks: TextChunk[]): void {
    this.vocab = buildVocabulary(chunks);
    this.idf = computeIdf(chunks, this.vocab);
    this.entries = chunks.map((chunk) => ({
      chunk,
      vector: computeTfIdf(chunk.text, this.vocab, this.idf),
    }));
  }

  /** Search for the most relevant chunks given a query string */
  search(query: string, topK: number = 5): SearchResult[] {
    if (this.entries.length === 0) return [];

    const queryVector = computeTfIdf(query, this.vocab, this.idf);

    const scored: SearchResult[] = this.entries.map((entry) => ({
      chunk: entry.chunk,
      score: cosineSimilarity(queryVector, entry.vector),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /** Clear all indexed data */
  clear(): void {
    this.entries = [];
    this.vocab = new Map();
    this.idf = new Float64Array(0);
  }

  get size(): number {
    return this.entries.length;
  }

  get allChunks(): TextChunk[] {
    return this.entries.map((e) => e.chunk);
  }
}

// ═══ FULL INGESTION PIPELINE ═══

export interface IngestedDocument {
  id: string;
  name: string;
  fileType: string;
  rawText: string;
  chunks: TextChunk[];
}

export async function ingestDocuments(files: File[]): Promise<{
  documents: IngestedDocument[];
  index: InMemoryVectorIndex;
  totalChunks: number;
}> {
  const documents: IngestedDocument[] = [];
  const allChunks: TextChunk[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docId = `doc-${i}`;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "txt";

    const rawText = await readFileContent(file);
    const chunks = chunkText(rawText, docId, file.name, 400, 2);

    documents.push({
      id: docId,
      name: file.name,
      fileType: ext,
      rawText,
      chunks,
    });

    allChunks.push(...chunks);
  }

  const index = new InMemoryVectorIndex();
  index.buildIndex(allChunks);

  return { documents, index, totalChunks: allChunks.length };
}
