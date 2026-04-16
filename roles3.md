<p align="center">
  <img src="https://img.shields.io/badge/🔪_GHOSTCUT-Team_BYTEFORCES-ff0033?style=for-the-badge&labelColor=0a0a0a" />
</p>

<h1 align="center">🛡️ Team BYTEFORCES — Roles & Contributions</h1>

<h3 align="center">
  <code>IIT Delhi Hackathon 2025 · 3-Member Configuration</code>
</h3>

<p align="center">
  <strong>Three engineers. Fifteen algorithms. One forensic AI auditor.<br/>Every contribution mapped, measured, and documented.</strong>
</p>

---

<br/>

## 👥 Team Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   🔪 GHOSTCUT — Forensic AI Auditor                                 │
│                                                                      │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│   │  ⭐ DAMA          │  │  RATAKONDA       │  │  KOLLIPAKULA     │  │
│   │  SRI RAM          │  │  DHEERAJ         │  │  NIKHIL          │  │
│   │                   │  │                  │  │                  │  │
│   │  Team Leader      │  │  Core Developer  │  │  Core Developer  │  │
│   │  Architect        │  │  Backend Engine  │  │  Algorithm Eng.  │  │
│   │  40% Ownership    │  │  30% Ownership   │  │  30% Ownership   │  │
│   └────────┬──────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│            │                      │                      │           │
│            └──────────────────────┼──────────────────────┘           │
│                                   │                                  │
│                         ┌─────────▼─────────┐                       │
│                         │   GHOSTCUT v1.0   │                       │
│                         │   Shipped ✅       │                       │
│                         └───────────────────┘                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

<br/>

---

## 📊 Contribution Breakdown at a Glance

| Member | Role | Ownership | Focus Areas |
|:-------|:-----|:---------:|:------------|
| ⭐ **Dama Sri Ram** | Team Leader & Architect | **40%** | System design, pipeline orchestration, UI/UX, deployment |
| 🔧 **Ratakonda Dheeraj** | Core Developer — Backend Engine | **30%** | Verification engine, AI integration, evidence retrieval |
| ⚙️ **Kollipakula Nikhil** | Core Developer — Algorithm Engineer | **30%** | Graph algorithms, mathematical models, data structures |

---

## 📐 Algorithm & Data Structure Ownership

| # | Algorithm / Technique | Owner | File Location | Complexity |
|:--|:---------------------|:------|:-------------|:-----------|
| 1 | Sentence Boundary Detection (Regex FSM) | ⭐ Sri Ram | `verification-engine.ts` | O(n) |
| 2 | Text Chunking with Sliding Window + Overlap | ⭐ Sri Ram | `document-pipeline.ts` | O(n) |
| 3 | Stop Word Filtering (HashSet Lookup) | ⭐ Sri Ram | `document-pipeline.ts` | O(1)/word |
| 4 | Multi-Model Consensus (Ensemble Voting) | ⭐ Sri Ram | `verification-engine.ts` | O(k) |
| 5 | Domain-Sensitive Severity Classification | ⭐ Sri Ram | `verification-engine.ts` | O(n) |
| 6 | TF-IDF Vectorization | 🔧 Dheeraj | `document-pipeline.ts` | O(V × D) |
| 7 | Cosine Similarity (Vector Space Model) | 🔧 Dheeraj | `document-pipeline.ts` | O(V) |
| 8 | Top-K Selection (Partial Sort) | 🔧 Dheeraj | `document-pipeline.ts` | O(D log D) |
| 9 | Numeric Extraction & Deviation Analysis | 🔧 Dheeraj | `verification-engine.ts` | O(n) |
| 10 | BFS Cascade Propagation on DAG | ⚙️ Nikhil | `claim-graph-utils.ts` | O(V + E) |
| 11 | Topological Sort (Kahn's Algorithm) | ⚙️ Nikhil | `claim-graph-utils.ts` | O(V + E) |
| 12 | Hierarchical Graph Layout (Layered Positioning) | ⚙️ Nikhil | `claim-graph-utils.ts` | O(V) |
| 13 | Weighted Trust Score Formula | ⚙️ Nikhil | `audit-types.ts` | O(n) |
| 14 | Largest Remainder Method (Fair Rounding) | ⚙️ Nikhil | `audit-types.ts` | O(k log k) |
| 15 | Bézier Curve Edge Rendering | ⚙️ Nikhil | `ClaimGraphView.tsx` | O(E) |

---

<br/>

## ⭐ Dama Sri Ram — `Team Leader & Architect` (40%)

<br/>

### 🏗️ What Sri Ram Built

Sri Ram designed the **entire system architecture** — how documents flow from upload → chunking → indexing → claim verification → results display. He also built the complete user interface, deployment pipeline, and the core text processing layer that everything else depends on.

<br/>

### 🔬 Algorithm 1: Sentence Boundary Detection (Regex FSM)

**📍 File:** `src/lib/verification-engine.ts → splitIntoSentences()`

**🧩 What it does:** Takes a wall of LLM-generated text and splits it into individual claims that can be verified one by one.

**🔧 How Sri Ram coded it:**

```typescript
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)   // Split AFTER sentence-ending punctuation
    .map((s) => s.trim())      // Clean whitespace
    .filter((s) => s.length > 15);  // Remove tiny fragments
}
```

**🎯 Example — Step by Step:**

```
INPUT:  "All engineers are doctors. All doctors are engineers. Therefore everyone is both."

Step 1 — Regex scans character by character:
  Position 27: '.' followed by ' ' → SPLIT HERE ✂️
  Position 55: '.' followed by ' ' → SPLIT HERE ✂️
  Position 82: '.' at end         → No split (no space after)

Step 2 — Result:
  ┌─────────────────────────────────────┐
  │ Sentence 1: "All engineers are      │
  │              doctors."               │
  ├─────────────────────────────────────┤
  │ Sentence 2: "All doctors are        │
  │              engineers."             │
  ├─────────────────────────────────────┤
  │ Sentence 3: "Therefore everyone     │
  │              is both."               │
  └─────────────────────────────────────┘

Step 3 — Filter (length > 15):
  All three pass ✓ → 3 claims ready for verification
```

**💡 Why this approach?**

| Approach | Speed | Dependencies | Browser-safe? |
|:---------|:------|:------------|:-------------|
| ✅ Lookbehind Regex (Sri Ram's choice) | ⚡ O(n) | Zero | ✅ Yes |
| NLP Tokenizer (spaCy) | Slow | Python backend | ❌ No |
| ML-based (Punkt) | Medium | Heavy model | ❌ No |

> Sri Ram chose regex for **zero-dependency, O(n) performance** that runs entirely in the browser.

<br/>

---

### 🔬 Algorithm 2: Text Chunking with Sliding Window + Overlap

**📍 File:** `src/lib/document-pipeline.ts → chunkText()`

**🧩 What it does:** Breaks large source documents into semantically meaningful chunks of ~400 tokens, with 2-sentence overlap so no information falls through the cracks.

**🔧 How Sri Ram coded it:**

```typescript
export function chunkText(
  text: string,
  documentId: string,
  documentName: string,
  targetTokens: number = 400,
  overlapSentences: number = 2
): TextChunk[]
```

**🎯 Example — Visualizing the Sliding Window:**

```
Document about a hospital:

  [S1] "Apollo Hospitals was founded in 1983."
  [S2] "It has 10,000+ beds across 73 hospitals."
  [S3] "The cardiac surgery success rate is 99.6%."
  [S4] "Annual revenue crossed ₹16,000 crore in 2024."
  [S5] "They use IBM Watson for oncology diagnostics."
  [S6] "Patient satisfaction scores average 4.8/5."

Without overlap (BAD ❌):
  Chunk 1: [S1, S2, S3]     Chunk 2: [S4, S5, S6]
  
  Problem: If a claim says "Apollo's cardiac surgery with ₹16,000 crore revenue"
  it references S3 (Chunk 1) AND S4 (Chunk 2). Neither chunk alone has both facts!

With overlap (Sri Ram's approach ✅):
  Chunk 1: [S1, S2, S3, S4]
  Chunk 2: [S3, S4, S5, S6]   ← S3 and S4 appear in BOTH chunks!
  
  Now ANY cross-boundary claim is captured completely in at least one chunk.
```

<br/>

---

### 🔬 Algorithm 3: Stop Word Filtering (HashSet Lookup)

**📍 File:** `src/lib/document-pipeline.ts → tokenize() + STOP_WORDS`

**🧩 What it does:** Removes noise words ("the", "is", "and") that appear everywhere and carry zero discriminative signal, using a HashSet for O(1) per-word lookup.

**🔧 How Sri Ram coded it:**

```typescript
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", ...
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s.%$]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));  // O(1) lookup!
}
```

**🎯 Example — Why HashSet Matters:**

```
Sentence: "The hospital has the best cardiac surgery in the country"

Words to check: ["the", "hospital", "has", "the", "best", "cardiac", "surgery", "in", "the", "country"]

Using Array (slow ❌):
  "the" → scan 90 words... found at index 0. (90 comparisons worst case)
  "hospital" → scan 90 words... not found. (90 comparisons)
  Total: 10 words × 90 stop words = 900 comparisons 😱

Using HashSet (Sri Ram's approach ✅):
  "the" → hash("the") → bucket 7 → found! (1 operation)
  "hospital" → hash("hospital") → bucket 23 → not found! (1 operation)
  Total: 10 words × 1 lookup = 10 operations ⚡

  Result after filtering: ["hospital", "best", "cardiac", "surgery", "country"]
  → Only meaningful words survive. Ready for TF-IDF vectorization.
```

<br/>

---

### 🔬 Algorithm 4: Multi-Model Consensus (Ensemble Voting)

**📍 File:** `src/lib/verification-engine.ts`

**🧩 What it does:** Combines verdicts from 3 independent verifiers (NLI Classifier, LLM Judge, Numeric Checker) and checks if they agree. When they disagree, it flags the claim for human review.

**🔧 How Sri Ram coded it:**

```typescript
const allResults = [modelResult.nli, modelResult.judge, ruleResult];
const applicableResults = allResults.filter((r) => r.verdict !== "not_applicable");
const verdicts = new Set(applicableResults.map((r) => r.verdict));
const consensus = verdicts.size <= 1;  // Do all verifiers agree?
```

**🎯 Example — Three verifiers judging "Apollo Hospitals has 10,000 beds":**

```
┌─────────────────────────────────────────────────────────────┐
│  Claim: "Apollo Hospitals has 10,000 beds"                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🧠 NLI Classifier:                                        │
│    Verdict: SUPPORTED ✅                                    │
│    Confidence: [0.88 — 0.95]                                │
│    Reasoning: "Source states 10,000+ beds"                  │
│                                                             │
│  ⚖️ LLM Judge:                                             │
│    Verdict: SUPPORTED ✅                                    │
│    Confidence: [0.85 — 0.92]                                │
│    Reasoning: "Consistent with uploaded annual report"      │
│                                                             │
│  🔢 Numeric Checker:                                       │
│    Verdict: SUPPORTED ✅                                    │
│    Confidence: [0.90 — 0.98]                                │
│    Reasoning: "10,000 matches source value 10,000+"         │
│                                                             │
│  📊 Consensus: YES (all 3 agree) → Final: SUPPORTED ✅     │
└─────────────────────────────────────────────────────────────┘

But what if they disagree?

  Claim: "Revenue was $500 million"
  
  🧠 NLI: SUPPORTED (text says "revenue exceeded $490M")
  ⚖️ Judge: CONTRADICTED ("$500M is overstated, actual is $490M")
  🔢 Numeric: CONTRADICTED (deviation: $500M vs $490M = 2.04%)

  Verdicts = {"supported", "contradicted"} → size = 2 → NO CONSENSUS ⚠️
  → Flag for human review with disagreement note
```

<br/>

---

### 🔬 Algorithm 5: Domain-Sensitive Severity Classification

**📍 File:** `src/lib/verification-engine.ts → detectSeverityDomain()`

**🧩 What it does:** When a claim is contradicted, determines how dangerous the hallucination is based on the domain — medical/financial errors are CRITICAL, legal issues are MODERATE, and general facts are MINOR.

**🔧 How Sri Ram coded it:**

```typescript
function detectSeverityDomain(text: string): HallucinationSeverity {
  const lower = text.toLowerCase();
  const medicalTerms = /\b(fda|clinical|medical|drug|patient|diagnosis|treatment|disease)\b/;
  const financialTerms = /\b(revenue|profit|valuation|investor|sec|stock|earnings|funding)\b/;
  const legalTerms = /\b(law|legal|regulation|compliance|court|statute|liability)\b/;

  if (medicalTerms.test(lower)) return "critical";
  if (financialTerms.test(lower)) return "critical";
  if (legalTerms.test(lower)) return "moderate";
  return "minor";
}
```

**🎯 Example — Same error, different severity:**

```
Claim: "The drug dosage is 500mg twice daily"
Source: "The approved dosage is 250mg once daily"
→ Severity: 🔴 CRITICAL (medical domain — wrong dosage could kill patients)

Claim: "The company's revenue was $12 billion"  
Source: "Revenue was $8.5 billion"
→ Severity: 🔴 CRITICAL (financial domain — misleading investors)

Claim: "The contract requires 30-day notice"
Source: "Contract specifies 60-day notice"
→ Severity: 🟡 MODERATE (legal domain — could cause compliance issues)

Claim: "The office has 500 employees"
Source: "The office has 480 employees"
→ Severity: 🟢 MINOR (general fact — low-risk inaccuracy)
```

<br/>

---

### 📦 Other Contributions by Sri Ram

| Area | What He Built |
|:-----|:-------------|
| **System Architecture** | Designed the full data flow: Upload → Chunk → Index → Retrieve → Verify → Display |
| **UI/UX Design** | Built all React components: `AuditInput`, `AuditResults`, `TrustDashboard`, `Layout` |
| **Edge Function** | Created the `verify-claims` backend function that routes to AI models |
| **Export System** | Built PDF and JSON export pipelines (`pdf-export.ts`, `json-export.ts`) |
| **Deployment** | Configured Lovable Cloud, custom domain (`sriramdama.in`), and CI/CD |
| **Theme System** | Implemented dark/light mode with semantic design tokens |
| **Batch Audit** | Built `BatchAuditPanel` for auditing multiple texts at once |
| **Settings** | Created `SettingsDialog` for configuring verification parameters |

<br/>

---

<br/>

## 🔧 Ratakonda Dheeraj — `Core Developer — Backend Engine` (30%)

<br/>

### 🏗️ What Dheeraj Built

Dheeraj built the **evidence retrieval engine** — the system that takes a claim and finds the most relevant evidence from uploaded source documents. This includes the TF-IDF vectorization, cosine similarity matching, and the numeric verification layer.

<br/>

### 🔬 Algorithm 6: TF-IDF Vectorization

**📍 File:** `src/lib/document-pipeline.ts → buildVocabulary(), computeIdf(), computeTfIdf()`

**🧩 What it does:** Converts text into mathematical vectors so we can compute "how similar is this claim to this document chunk?" using numbers instead of guessing.

**🔧 How Dheeraj coded it:**

```
TF-IDF = Term Frequency × Inverse Document Frequency

TF(word, chunk)  = (count of word in chunk) / (max word count in chunk)
IDF(word)        = log((N + 1) / (df + 1)) + 1
                   where N = total chunks, df = chunks containing this word
```

**🎯 Example — Vectorizing a medical claim:**

```
We have 3 document chunks indexed:
  Chunk A: "Apollo cardiac surgery success rate is 99.6 percent"
  Chunk B: "Revenue crossed 16000 crore in fiscal year 2024"
  Chunk C: "Apollo cardiac department uses robotic surgery systems"

Now a CLAIM arrives: "Apollo's cardiac surgery has a 99.6% success rate"

Step 1 — Tokenize the claim:
  ["apollo", "cardiac", "surgery", "99.6", "success", "rate"]

Step 2 — Compute TF (how often each word appears in the claim):
  apollo: 1/1 = 1.0    cardiac: 1/1 = 1.0    surgery: 1/1 = 1.0
  99.6: 1/1 = 1.0       success: 1/1 = 1.0    rate: 1/1 = 1.0

Step 3 — Compute IDF (how rare each word is across all chunks):
  "apollo"  → appears in Chunk A, C (2 of 3) → IDF = log(4/3) + 1 = 1.29 (common)
  "cardiac" → appears in Chunk A, C (2 of 3) → IDF = log(4/3) + 1 = 1.29
  "surgery" → appears in Chunk A, C (2 of 3) → IDF = log(4/3) + 1 = 1.29
  "99.6"    → appears in Chunk A only (1 of 3) → IDF = log(4/2) + 1 = 1.69 (RARE! ⭐)
  "success" → appears in Chunk A only (1 of 3) → IDF = log(4/2) + 1 = 1.69 (RARE! ⭐)
  "rate"    → appears in Chunk A only (1 of 3) → IDF = log(4/2) + 1 = 1.69 (RARE! ⭐)

Step 4 — TF-IDF vector for the claim:
  [1.29, 1.29, 1.29, 1.69, 1.69, 1.69]
   ↑                  ↑
   Common words       Rare words get HIGHER weight!
   get lower weight   This is the magic of TF-IDF!
```

<br/>

---

### 🔬 Algorithm 7: Cosine Similarity (Vector Space Model)

**📍 File:** `src/lib/document-pipeline.ts → cosineSimilarity()`

**🧩 What it does:** Measures the angle between two TF-IDF vectors to determine how semantically similar a claim is to a document chunk. Score ranges from 0 (completely different) to 1 (identical).

**🔧 How Dheeraj coded it:**

```typescript
function cosineSimilarity(a: Float64Array, b: Float64Array): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
```

**🎯 Example — Finding the best evidence for a claim:**

```
Claim: "Apollo's cardiac surgery has a 99.6% success rate"

                    ↑ "99.6"
                    │
                    │   📄 Chunk A (about cardiac surgery + 99.6%)
                    │  ╱  θ = 12° → cos(12°) = 0.978  VERY HIGH! ✅
                    │ ╱
                    │╱─────────→ "revenue"
                    │╲
                    │ ╲  📄 Chunk B (about revenue + ₹16,000 crore)
                    │  ╲  θ = 82° → cos(82°) = 0.139  LOW ❌
                    │
                    │   📄 Chunk C (about cardiac + robotic surgery)
                    │  ╱  θ = 35° → cos(35°) = 0.819  MODERATE ⚠️
                    │ ╱

Results ranked:
  1. Chunk A → 0.978 (best match! Contains "99.6%" and "cardiac surgery")
  2. Chunk C → 0.819 (partial match — has "cardiac" but not "99.6%")
  3. Chunk B → 0.139 (irrelevant — about revenue, not surgery)

Dheeraj's threshold: score > 0.12 → include as evidence
  → Chunk A ✅, Chunk C ✅, Chunk B ✅ (barely passes, low-confidence)
```

**💡 Why Cosine, not Euclidean Distance?**

```
Euclidean distance (BAD ❌):
  A long 2000-word chunk and a short 50-word claim would have VERY different
  vector magnitudes, making them seem "far apart" even if they discuss
  the exact same topic.

Cosine similarity (Dheeraj's choice ✅):
  Measures the ANGLE between vectors, not the distance.
  A 2000-word chunk about "cardiac surgery" and a 50-word claim about
  "cardiac surgery" point in the SAME DIRECTION → high similarity.
```

<br/>

---

### 🔬 Algorithm 8: Top-K Selection (Partial Sort)

**📍 File:** `src/lib/document-pipeline.ts → search()`

**🧩 What it does:** After computing cosine similarity against ALL chunks, we only need the top K most relevant ones. Instead of sorting all N chunks, we use a partial sort to extract just the top K efficiently.

**🔧 How Dheeraj coded it:**

```typescript
search(query: string, topK: number = 5): SearchResult[] {
  const queryVector = computeTfIdf(query, this.vocab, this.idf);
  
  const results = this.chunks.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(queryVector, this.vectors[i]),
  }));

  // Sort descending by score, take top K
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}
```

**🎯 Example — Selecting Top-3 from 1000 chunks:**

```
Claim: "IBM Watson achieved 96% accuracy in cancer diagnosis"

Computing similarity against all 1000 indexed chunks...

  Chunk 42:  0.891  ← about IBM Watson oncology
  Chunk 187: 0.234  ← about Watson general AI
  Chunk 651: 0.923  ← about Watson cancer study with 96% figure
  Chunk 7:   0.045  ← about Apollo revenue (irrelevant)
  Chunk 899: 0.867  ← about AI diagnostics accuracy
  ... 995 more chunks ...

After sort + slice(0, 3):
  ┌────────────────────────────────────────────────────┐
  │ Rank 1: Chunk 651 → 0.923 (IBM Watson + 96% + cancer) │
  │ Rank 2: Chunk 42  → 0.891 (IBM Watson + oncology)     │
  │ Rank 3: Chunk 899 → 0.867 (AI diagnostics + accuracy) │
  └────────────────────────────────────────────────────┘

These 3 chunks become the EVIDENCE sent to AI models for verification.
```

<br/>

---

### 🔬 Algorithm 9: Numeric Extraction & Deviation Analysis

**📍 File:** `src/lib/verification-engine.ts → extractNumbers(), numericDeviation()`

**🧩 What it does:** Extracts all numeric values from claims and source text, normalizes them (handling "million", "billion", "%", "$"), and computes deviation to detect mismatches.

**🔧 How Dheeraj coded it:**

```typescript
function extractNumbers(text: string): ExtractedNumber[] {
  const patterns = /\$?\d[\d,]*\.?\d*\s*(?:million|billion|thousand|%|M|B|K)?/gi;
  const matches = text.match(patterns) || [];

  return matches.map((raw) => {
    let clean = raw.replace(/[$,\s]/g, "").toLowerCase();
    let multiplier = 1;
    if (clean.endsWith("million") || clean.endsWith("m")) multiplier = 1e6;
    else if (clean.endsWith("billion") || clean.endsWith("b")) multiplier = 1e9;
    // ... more normalizations
    return { raw: raw.trim(), value: parseFloat(clean) * multiplier };
  });
}

function numericDeviation(claimed: number, source: number): number {
  if (source === 0) return claimed === 0 ? 0 : 1;
  return Math.abs(claimed - source) / Math.abs(source);
}
```

**🎯 Example — Catching a dangerous numeric hallucination:**

```
Claim:  "IBM Watson's healthcare division generated $4.2 billion in revenue"
Source: "Watson Health revenue was approximately $1.1 billion in 2023"

Step 1 — Extract numbers:
  Claim numbers:  [{ raw: "$4.2 billion", value: 4,200,000,000 }]
  Source numbers: [{ raw: "$1.1 billion", value: 1,100,000,000 }]

Step 2 — Compute deviation:
  deviation = |4.2B - 1.1B| / |1.1B|
            = 3.1B / 1.1B
            = 2.818  (281.8% deviation!)

Step 3 — Compare against tolerance (5%):
  281.8% >> 5%  → 🔴 NUMERIC MISMATCH DETECTED!

Step 4 — Generate correction:
  ┌─────────────────────────────────────────────────────┐
  │ ❌ Original: "$4.2 billion"                         │
  │ ✅ Corrected: "$1.1 billion"                        │
  │ 📄 Source: Watson Health Annual Report 2023         │
  │ ⚠️ Deviation: 281.8% — this was a 4x exaggeration │
  └─────────────────────────────────────────────────────┘
```

**More examples of number normalization:**

```
"$4.2M"        → 4,200,000      (M = million)
"$4.2 million" → 4,200,000      (same!)
"4,200,000"    → 4,200,000      (commas stripped)
"$12.5B"       → 12,500,000,000 (B = billion)
"99.7%"        → 99.7           (percentage preserved)
"15K"          → 15,000         (K = thousand)
```

<br/>

---

### 📦 Other Contributions by Dheeraj

| Area | What He Built |
|:-----|:-------------|
| **Evidence Retrieval Pipeline** | Built the full retrieve → rank → filter pipeline in `verification-engine.ts` |
| **Source Conflict Detection** | Implemented cross-document conflict detection when two sources disagree |
| **Correction Engine** | Built `CorrectionEngine` component for displaying auto-corrections |
| **Document Upload** | Developed `DocumentUpload` component with PDF/TXT/MD support |
| **Verification Panel** | Created `VerificationPanel` showing multi-model results per claim |
| **Edge Function Integration** | Integrated the frontend with the `verify-claims` backend function |

<br/>

---

<br/>

## ⚙️ Kollipakula Nikhil — `Core Developer — Algorithm Engineer` (30%)

<br/>

### 🏗️ What Nikhil Built

Nikhil built the **graph-based analysis layer** and the **mathematical scoring system**. His work powers the claim dependency graph, the trust score computation, and the visual rendering of relationships between claims. He also engineered the statistical fairness algorithms that ensure percentage breakdowns always sum to exactly 100%.

<br/>

### 🔬 Algorithm 10: BFS Cascade Propagation on Directed Acyclic Graph (DAG)

**📍 File:** `src/lib/claim-graph-utils.ts`

**🧩 What it does:** When one claim is contradicted, other claims that depend on it might also be unreliable. BFS (Breadth-First Search) propagates the "doubt signal" through the dependency graph, visiting all downstream claims level by level.

**🔧 How Nikhil coded it:**

```typescript
function cascadePropagate(
  startNodeId: string,
  adjacencyList: Map<string, string[]>,
  nodes: Map<string, GraphNode>
): Set<string> {
  const affected = new Set<string>();
  const queue: string[] = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (affected.has(current)) continue;  // Already visited
    affected.add(current);

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      if (!affected.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return affected;
}
```

**🎯 Example — How doubt cascades through claims:**

```
Imagine an IBM Watson case study with these claims:

  S1: "IBM Watson can diagnose cancer" ← SOURCE DOCUMENT CONFIRMS ✅
  S2: "Watson achieved 96% accuracy"  ← SOURCE SAYS 85% → CONTRADICTED 🔴
  S3: "Hospitals adopted Watson because of 96% accuracy" ← DEPENDS ON S2
  S4: "Watson saved $2M per hospital" ← DEPENDS ON S3
  S5: "1000 hospitals use Watson" ← INDEPENDENT CLAIM

Dependency Graph:
  S1 ──→ S2 ──→ S3 ──→ S4
                          
  S5 (no dependencies)

BFS Cascade starting from S2 (contradicted):

  Queue: [S2]                          Affected: {}
  
  Step 1: Pop S2, mark affected
  Queue: [S3]                          Affected: {S2}
  
  Step 2: Pop S3, mark affected
  Queue: [S4]                          Affected: {S2, S3}
  
  Step 3: Pop S4, mark affected
  Queue: []                            Affected: {S2, S3, S4}
  
  Done! S5 was never reached (independent) → stays unaffected ✅

Result:
  S1: SUPPORTED ✅ (upstream, not affected)
  S2: CONTRADICTED 🔴 (original error)
  S3: CASCADED DOUBT ⚠️ (depends on S2's false 96% claim)
  S4: CASCADED DOUBT ⚠️ (depends on S3)
  S5: SUPPORTED ✅ (independent, not in cascade path)
```

**⏱ Complexity:** O(V + E) — visits each node and edge exactly once.

<br/>

---

### 🔬 Algorithm 11: Topological Sort (Kahn's Algorithm)

**📍 File:** `src/lib/claim-graph-utils.ts`

**🧩 What it does:** Arranges claims in a hierarchical order such that every claim appears AFTER the claims it depends on. This is essential for the layered graph layout — you can't position a node before you know where its parents are.

**🔧 How Nikhil coded it:**

```typescript
function topologicalSort(
  nodes: string[],
  edges: { from: string; to: string }[]
): string[][] {
  // Step 1: Compute in-degree for each node
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  
  for (const node of nodes) {
    inDegree.set(node, 0);
    adjacency.set(node, []);
  }
  
  for (const edge of edges) {
    adjacency.get(edge.from)!.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  }

  // Step 2: Start with nodes that have no dependencies (in-degree = 0)
  const layers: string[][] = [];
  let currentLayer = nodes.filter(n => inDegree.get(n) === 0);

  while (currentLayer.length > 0) {
    layers.push(currentLayer);
    const nextLayer: string[] = [];
    
    for (const node of currentLayer) {
      for (const neighbor of adjacency.get(node) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          nextLayer.push(neighbor);
        }
      }
    }
    currentLayer = nextLayer;
  }

  return layers;
}
```

**🎯 Example — Sorting 6 claims into layers:**

```
Claims and their dependencies:
  S1: "IBM was founded in 1911" (no dependencies)
  S2: "IBM pioneered mainframe computing" (depends on S1)
  S3: "Watson is IBM's AI platform" (depends on S1)
  S4: "Watson won Jeopardy in 2011" (depends on S3)
  S5: "Watson Health was launched in 2015" (depends on S3, S4)
  S6: "Revenue from Watson Health is $1B" (depends on S5)

Edges: S1→S2, S1→S3, S3→S4, S3→S5, S4→S5, S5→S6

Step-by-step Kahn's Algorithm:

  In-degrees: S1:0, S2:1, S3:1, S4:1, S5:2, S6:1

  Layer 0: [S1]  (in-degree = 0, no dependencies)
    Remove S1 → decrement S2 (→0), S3 (→0)

  Layer 1: [S2, S3]  (both now have in-degree 0)
    Remove S2 → nothing depends on it
    Remove S3 → decrement S4 (→0), S5 (→1)

  Layer 2: [S4]  (in-degree = 0)
    Remove S4 → decrement S5 (→0)

  Layer 3: [S5]  (in-degree = 0)
    Remove S5 → decrement S6 (→0)

  Layer 4: [S6]  (in-degree = 0)

Result:
  ┌─────────────────────────────────────────────┐
  │ Layer 0:     [S1]                           │
  │ Layer 1:     [S2]  [S3]                     │
  │ Layer 2:           [S4]                     │
  │ Layer 3:           [S5]                     │
  │ Layer 4:           [S6]                     │
  └─────────────────────────────────────────────┘

This layered ordering is then used for the visual graph layout.
```

<br/>

---

### 🔬 Algorithm 12: Hierarchical Graph Layout (Layered Positioning)

**📍 File:** `src/lib/claim-graph-utils.ts`

**🧩 What it does:** Takes the topological layers from Kahn's Algorithm and assigns (x, y) coordinates to each node for visual rendering. Nodes in the same layer share the same Y position and are evenly distributed horizontally.

**🔧 How Nikhil coded it:**

```typescript
function assignPositions(
  layers: string[][],
  canvasWidth: number,
  layerHeight: number = 120
): Map<string, { x: number; y: number }> {
  const positions = new Map();
  
  for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
    const layer = layers[layerIdx];
    const y = layerIdx * layerHeight + 60;  // Vertical position
    
    for (let nodeIdx = 0; nodeIdx < layer.length; nodeIdx++) {
      const x = (canvasWidth / (layer.length + 1)) * (nodeIdx + 1);  // Even horizontal spread
      positions.set(layer[nodeIdx], { x, y });
    }
  }
  
  return positions;
}
```

**🎯 Example — Turning layers into visual positions:**

```
Input layers (from Kahn's Algorithm):
  Layer 0: [S1]
  Layer 1: [S2, S3]
  Layer 2: [S4]
  Layer 3: [S5]

Canvas: 800px wide, 120px between layers

Positions calculated:
  S1: x = 800/2 = 400, y = 60      ← centered (only node in layer)
  S2: x = 800/3 = 267, y = 180     ← left third
  S3: x = 2×800/3 = 533, y = 180   ← right third
  S4: x = 400, y = 300              ← centered
  S5: x = 400, y = 420              ← centered

Visual result:
              [S1] ← y=60
             ╱    ╲
          [S2]    [S3] ← y=180
                   │
                  [S4] ← y=300
                   │
                  [S5] ← y=420
```

<br/>

---

### 🔬 Algorithm 13: Weighted Trust Score Formula

**📍 File:** `src/lib/audit-types.ts → computeWeightedTrustScore()`

**🧩 What it does:** Computes a single 0-100 trust score from all sentence verdicts, weighting contradictions more heavily than unverifiable claims because active misinformation is worse than missing evidence.

**🔧 How Nikhil coded it:**

```typescript
export function computeWeightedTrustScore(sentences: AuditSentence[]): number {
  if (sentences.length === 0) return 100;

  const weights = {
    supported: 1.0,       // Full credit
    unverifiable: 0.5,    // Half credit (uncertain, not wrong)
    contradicted: 0.0,    // Zero credit (actively wrong)
    source_conflict: 0.3, // Low credit (sources disagree)
  };

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const sentence of sentences) {
    totalWeight += 1;
    earnedWeight += weights[sentence.status] ?? 0;
  }

  return Math.round((earnedWeight / totalWeight) * 100);
}
```

**🎯 Example — Scoring an IBM Watson audit:**

```
Audit results for a Watson case study (8 claims):

  S1: "IBM founded 1911"              → SUPPORTED      → weight: 1.0
  S2: "Watson won Jeopardy"           → SUPPORTED      → weight: 1.0
  S3: "Watson accuracy is 96%"        → CONTRADICTED   → weight: 0.0 ← penalized!
  S4: "Watson processes 200M pages"   → SUPPORTED      → weight: 1.0
  S5: "Watson Health revenue $4.2B"   → CONTRADICTED   → weight: 0.0 ← penalized!
  S6: "1000 hospitals use Watson"     → UNVERIFIABLE   → weight: 0.5
  S7: "Watson reduces costs by 30%"   → UNVERIFIABLE   → weight: 0.5
  S8: "Sources conflict on accuracy"  → SOURCE_CONFLICT → weight: 0.3

Calculation:
  earnedWeight = 1.0 + 1.0 + 0.0 + 1.0 + 0.0 + 0.5 + 0.5 + 0.3 = 4.3
  totalWeight  = 8

  Trust Score = (4.3 / 8) × 100 = 53.75 → rounded to 54%

  ┌─────────────────────────────────────┐
  │         TRUST SCORE: 54/100         │
  │   ████████████░░░░░░░░░░░░░░░░░░   │
  │         ⚠️ NEEDS REVIEW            │
  │                                     │
  │   3 supported, 2 contradicted,     │
  │   2 unverifiable, 1 conflict        │
  └─────────────────────────────────────┘
```

<br/>

---

### 🔬 Algorithm 14: Largest Remainder Method (Fair Rounding)

**📍 File:** `src/lib/audit-types.ts`

**🧩 What it does:** When showing percentage breakdowns (e.g., "37.5% supported, 25% contradicted, 25% unverifiable, 12.5% conflict"), naive rounding can produce totals like 99% or 101%. The Largest Remainder Method guarantees the total is EXACTLY 100%.

**🔧 How Nikhil coded it:**

```typescript
function largestRemainderRound(values: number[], total: number = 100): number[] {
  const floored = values.map(v => Math.floor(v));
  let remainder = total - floored.reduce((a, b) => a + b, 0);

  // Sort indices by fractional part (descending)
  const fractionals = values.map((v, i) => ({ index: i, fraction: v - Math.floor(v) }));
  fractionals.sort((a, b) => b.fraction - a.fraction);

  // Distribute remaining units to largest fractional parts
  for (let i = 0; i < remainder; i++) {
    floored[fractionals[i].index]++;
  }

  return floored;
}
```

**🎯 Example — Why naive rounding fails:**

```
Raw percentages for 8 claims:
  Supported (3):      37.5%
  Contradicted (2):   25.0%
  Unverifiable (2):   25.0%
  Source Conflict (1): 12.5%

Naive Math.round():
  37.5% → 38%
  25.0% → 25%
  25.0% → 25%
  12.5% → 13%
  Total: 38 + 25 + 25 + 13 = 101% ❌ WRONG!

Nikhil's Largest Remainder Method:
  Step 1 — Floor all values:
    37.5 → 37,  25.0 → 25,  25.0 → 25,  12.5 → 12
    Sum = 99. Need 1 more to reach 100.

  Step 2 — Sort by fractional part:
    37.5 → fraction 0.5  ⭐ (highest)
    12.5 → fraction 0.5  ⭐ (tied, but first gets it)
    25.0 → fraction 0.0
    25.0 → fraction 0.0

  Step 3 — Give +1 to the largest fractional (37 → 38):
    Result: 38% + 25% + 25% + 12% = 100% ✅ EXACT!
```

<br/>

---

### 🔬 Algorithm 15: Bézier Curve Edge Rendering

**📍 File:** `src/components/ClaimGraphView.tsx`

**🧩 What it does:** Draws smooth, curved lines between graph nodes using cubic Bézier curves instead of straight lines. This makes the graph visually clear even when edges would otherwise cross or overlap.

**🔧 How Nikhil coded it:**

```typescript
// SVG cubic Bézier path
const path = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
```

**🎯 Example — Why Bézier curves matter:**

```
Straight lines (ugly ❌):          Bézier curves (Nikhil's approach ✅):

    [S1]─────────[S3]                  [S1]╶─────╮    [S3]
      │  ╲      ╱  │                     │        ╰──╮  │
      │   ╲    ╱   │                     │            ╰─│
      │    ╲  ╱    │                     ╰──╮          ╭╯
      │     ╳     │                         ╰─╮    ╭──╯
      │    ╱ ╲    │                           ╰──╮╭╯
    [S2]─────────[S4]                  [S2]     [S4]

Lines cross in the middle!           Curves flow around each other!
Can't tell which connects to which.  Every connection is clearly visible.
```

**The Math — Cubic Bézier Control Points:**

```
For an edge from Node A (x1, y1) to Node B (x2, y2):

  Start point:    P0 = (x1, y1)
  Control point 1: P1 = (x1, (y1+y2)/2)  ← drops straight down from A
  Control point 2: P2 = (x2, (y1+y2)/2)  ← rises straight up to B
  End point:       P3 = (x2, y2)

  SVG Path: "M x1 y1 C x1 midY, x2 midY, x2 y2"

This creates an S-shaped curve that:
  1. Leaves Node A going downward
  2. Smoothly transitions horizontally
  3. Arrives at Node B from above
```

<br/>

---

### 📦 Other Contributions by Nikhil

| Area | What He Built |
|:-----|:-------------|
| **Claim Graph Visualization** | Built the entire `ClaimGraphView.tsx` with animated nodes and edges |
| **Trust Score Display** | Created `TrustScore.tsx` with animated gauge and color-coded display |
| **Trust Dashboard** | Built `TrustDashboard.tsx` showing distribution charts and statistics |
| **Graph Animations** | Implemented staggered fade-in animations for graph nodes and edges |
| **Highlighted Text** | Created `HighlightedText.tsx` for color-coding sentences by status |
| **Sentence Viewer** | Built `SentenceViewer.tsx` for detailed claim-level inspection |

<br/>

---

<br/>

## 🔗 How the Three Members' Work Connects

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  📄 User uploads document                                            │
│        │                                                             │
│        ▼                                                             │
│  ┌─────────────────┐  SRI RAM's LAYER                               │
│  │ Sentence Split   │  Algorithm 1: Regex FSM                       │
│  │ Text Chunking    │  Algorithm 2: Sliding Window                  │
│  │ Stop Word Filter │  Algorithm 3: HashSet Lookup                  │
│  └────────┬─────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐  DHEERAJ's LAYER                               │
│  │ TF-IDF Vectors  │  Algorithm 6: TF-IDF Vectorization            │
│  │ Find Evidence   │  Algorithm 7: Cosine Similarity               │
│  │ Rank Results    │  Algorithm 8: Top-K Selection                  │
│  │ Check Numbers   │  Algorithm 9: Numeric Deviation               │
│  └────────┬─────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐  SRI RAM's LAYER (AI Integration)              │
│  │ Multi-Model AI  │  Algorithm 4: Ensemble Voting                  │
│  │ Severity Check  │  Algorithm 5: Domain Classification            │
│  └────────┬─────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐  NIKHIL's LAYER                                │
│  │ Trust Score     │  Algorithm 13: Weighted Score                   │
│  │ % Rounding      │  Algorithm 14: Largest Remainder               │
│  │ Graph Layout    │  Algorithms 10-12: BFS + Kahn's + Layout       │
│  │ Edge Rendering  │  Algorithm 15: Bézier Curves                   │
│  └────────┬─────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                 │
│  │ FINAL RESULT:   │                                                 │
│  │ Trust Score +   │                                                 │
│  │ Claim Graph +   │                                                 │
│  │ Evidence Trail  │                                                 │
│  └─────────────────┘                                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

<br/>

---

## 📊 Data Structures Used (by Member)

| # | Data Structure | Owner | Where Used | Why Chosen |
|:--|:-------------- |:------|:-----------|:-----------|
| 1 | **HashSet** (Set) | ⭐ Sri Ram | Stop word filtering | O(1) lookup vs O(n) array scan |
| 2 | **HashMap** (Map) | ⭐ Sri Ram | Vocabulary indexing | O(1) word → index mapping |
| 3 | **Float64Array** | 🔧 Dheeraj | TF-IDF vectors | 8-byte precision, cache-friendly |
| 4 | **Array of Objects** | 🔧 Dheeraj | Search results | Sortable, serializable |
| 5 | **Queue** (Array as FIFO) | ⚙️ Nikhil | BFS traversal | O(1) dequeue with shift() |
| 6 | **Adjacency List** (Map) | ⚙️ Nikhil | Graph representation | O(V+E) space, fast neighbor access |
| 7 | **2D Layer Array** | ⚙️ Nikhil | Topological layers | Natural representation for Kahn's |
| 8 | **Position Map** | ⚙️ Nikhil | Node coordinates | O(1) position lookup for rendering |

<br/>

---

## ⏱ Complete Complexity Summary

| Algorithm | Owner | Time | Space | Critical Path? |
|:----------|:------|:-----|:------|:--------------|
| Sentence Splitting | ⭐ Sri Ram | O(n) | O(k) | ✅ Yes — first step |
| Sliding Window Chunking | ⭐ Sri Ram | O(n) | O(C×T) | ✅ Yes — indexing |
| Stop Word Filtering | ⭐ Sri Ram | O(1)/word | O(S) | ✅ Yes — tokenization |
| Multi-Model Consensus | ⭐ Sri Ram | O(k) | O(k) | ✅ Yes — final verdict |
| Severity Classification | ⭐ Sri Ram | O(n) | O(1) | Only for contradictions |
| TF-IDF Vectorization | 🔧 Dheeraj | O(D×V) | O(D×V) | ✅ Yes — index build |
| Cosine Similarity | 🔧 Dheeraj | O(V) | O(1) | ✅ Yes — every search |
| Top-K Selection | 🔧 Dheeraj | O(D log D) | O(D) | ✅ Yes — evidence ranking |
| Numeric Deviation | 🔧 Dheeraj | O(n) | O(m) | Only for numeric claims |
| BFS Cascade | ⚙️ Nikhil | O(V+E) | O(V) | Only for graph view |
| Kahn's Topological Sort | ⚙️ Nikhil | O(V+E) | O(V+E) | Only for graph layout |
| Hierarchical Layout | ⚙️ Nikhil | O(V) | O(V) | Only for graph rendering |
| Weighted Trust Score | ⚙️ Nikhil | O(n) | O(1) | ✅ Yes — final score |
| Largest Remainder | ⚙️ Nikhil | O(k log k) | O(k) | Only for UI display |
| Bézier Curve Rendering | ⚙️ Nikhil | O(E) | O(E) | Only for graph view |

<br/>

---

<br/>

<p align="center">
  <strong>Built with 🔥 by Team BYTEFORCES</strong><br/>
  <sub>Dama Sri Ram · Ratakonda Dheeraj · Kollipakula Nikhil</sub><br/>
  <sub>IIT Delhi Hackathon 2025</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Algorithms-15-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Data_Structures-8-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Team_Size-3-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Built_With-TypeScript-3178C6?style=for-the-badge" />
</p>
