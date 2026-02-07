<p align="center">
  <img src="https://img.shields.io/badge/🔪-GHOSTCUT-ff0033?style=for-the-badge&labelColor=0a0a0a&color=ff0033" alt="GHOSTCUT" />
</p>

<h1 align="center">
  🔪 GHOSTCUT
</h1>

<h3 align="center">
  <em>Cutting Hallucinations Out of AI</em>
</h3>

<p align="center">
  <a href="https://sriramdama.in"><img src="https://img.shields.io/badge/🚀_LIVE_DEMO-sriramdama.in-00ff88?style=for-the-badge&labelColor=0d1117" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/TEAM-AVENGERS-ff6b35?style=for-the-badge&labelColor=0d1117" alt="Team" />
  <img src="https://img.shields.io/badge/🏆-IIT_ROORKEE_E--SUMMIT-7c3aed?style=for-the-badge&labelColor=0d1117" alt="Hackathon" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white" />
</p>

---

<br/>

## 🧠 `> What is GHOSTCUT?`

```
LLMs are smart.
LLMs are confident.
LLMs are also... sometimes confidently wrong.
```

**GHOSTCUT** is an **enterprise-grade AI Auditor** for AI-generated content.

It doesn't _generate_ text.
It **verifies**, **cross-checks**, and **cuts hallucinations** — before they reach humans.

> 🔍 _Think of it as a forensic lie detector for AI outputs._

<br/>

---

<br/>

## ❌ `> The Problem`

```diff
- Modern LLMs hallucinate subtle facts
- They mix correct and incorrect information seamlessly
- Zero source traceability on outputs
- Dangerous in healthcare, law, finance & enterprise systems
```

```diff
- Manual verification is slow
- Manual verification is expensive
- Manual verification does NOT scale
```

> 👉 **Trust is the real bottleneck for AI adoption.**

<br/>

---

<br/>

## ✅ `> The Solution — GHOSTCUT`

GHOSTCUT acts as a **forensic verification layer** between AI outputs and humans.

| Step | What It Does |
|------|-------------|
| 🔬 **Decompose** | Breaks AI output into **atomic factual claims** |
| 📄 **Retrieve** | Matches each claim **only against uploaded documents** |
| ⚖️ **Verify** | Classifies every claim with NLI models |
| 🧠 **Explain** | Shows **why**, **where**, and **how confident** |
| 📊 **Score** | Computes a **real, auditable Trust Score** |

### Verdict Classification

```
🟢 SUPPORTED        — Claim backed by document evidence
🔴 CONTRADICTED     — Claim conflicts with source material
🟡 UNVERIFIABLE     — No direct evidence found in documents
```

```
✅ No internet guessing
✅ No black-box answers
✅ No hallucination amplification
```

<br/>

---

<br/>

## ⚙️ `> How It Works`

```
                    ┌─────────────────┐
                    │   AI Output     │
                    │   (Raw Text)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Claim       │
                    │  Decomposition  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Evidence     │
                    │   Retrieval    │
                    │ (Doc-Bounded)  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Claim       │
                    │  Verification  │
                    │    (NLI)       │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐          ┌─────────────────┐
    │  Explainability │          │   Trust Score    │
    │     Engine      │          │   Computation    │
    └─────────────────┘          └─────────────────┘
```

> Every step is **deterministic**, **auditable**, and **explainable**.

<br/>

---

<br/>

## 🧩 `> Tech Stack`

### 🔍 NLP & ML Models

| Model | Purpose |
|-------|---------|
| **Sentence-BERT (SBERT)** | Semantic retrieval of relevant document chunks |
| **TF-IDF** | Fast, deterministic first-pass filtering |
| **RoBERTa / DeBERTa** | Claim–evidence entailment & contradiction detection |
| **Gemini 2.5 Flash** | Intelligent claim decomposition & reasoning |

> ⚠️ **No large generative models are used for verification.** Verification is deterministic.

### 🏗️ Frontend & Infrastructure

```
├── ⚡ React 18 + TypeScript      → Type-safe UI layer
├── 🎨 Tailwind CSS + shadcn/ui   → Design system
├── 📊 Recharts                   → Trust score visualizations
├── 🔥 Vite                       → Lightning-fast builds
├── ☁️ Supabase (Edge Functions)  → Serverless verification API
└── 📱 Responsive + Dark Mode     → Works everywhere
```

### 🔒 Architecture Principles

```
✦ Stateless verification APIs
✦ Modular pipeline (Decompose → Retrieve → Verify → Explain)
✦ Chunk-level & claim-level caching
✦ Zero-trust: every claim verified independently
```

<br/>

---

<br/>

## 📊 `> Key Features`

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  🎯 Claim-Level Fact Checking                             │
│  🔗 Exact Evidence Citations with Source Highlighting     │
│  🧠 Logical & Cascade Hallucination Detection             │
│  📉 Math-Based Trust Score (Weighted Formula)             │
│  ⚠️  Risk Classification (LOW / MEDIUM / HIGH)            │
│  🧭 Human-Readable Explainability per Claim               │
│  📊 Interactive Claim Dependency Graph                     │
│  📤 Multi-Format Export (PDF / JSON / CSV / Markdown)     │
│  ⚙️  Configurable Verification Engine                      │
│  🌗 Dark Mode + Responsive Design                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Trust Score Formula

```math
Trust Score = 100 − (Contradicted% × 1.5) − (Unverifiable% × 0.5)
```

| Risk Level | Condition |
|-----------|-----------|
| 🟢 **LOW** | Contradicted < 10% |
| 🟡 **MEDIUM** | Contradicted 10%–29% |
| 🔴 **HIGH** | Any critical contradiction OR Contradicted ≥ 30% |

<br/>

---

<br/>

## 💼 `> Real-World Use Cases`

```
🏥 Medical report auditing         — Verify clinical AI summaries
⚖️  Legal document verification     — Cross-check contract analysis
💰 Financial & compliance checks   — Audit AI-generated reports
🤖 AI copilots with guardrails     — Prevent hallucination propagation
🏢 Enterprise AI deployments       — Trust layer for production LLMs
```

> If AI is used in **high-stakes decisions**, GHOSTCUT belongs there.

<br/>

---

<br/>

## 💰 `> Business & Scalability`

### Revenue Model

| Channel | Description |
|---------|-------------|
| 💳 **SaaS** | Subscription-based access |
| 🔌 **API** | Usage-based pricing per verification |
| 🏢 **Enterprise** | Custom licensing & on-prem deployment |
| 💬 **Integrations** | WhatsApp & messaging platform add-ons |

### Why It Scales

```diff
+ Low marginal compute cost (no GPT-scale inference)
+ High trust value (compliance & risk reduction)
+ Easy integration into existing AI pipelines
+ Modular — swap models without breaking the system
```

<br/>

---

<br/>

## 🚀 `> Quick Start`

```bash
# Clone the repository
git clone https://github.com/your-repo/ghostcut.git

# Install dependencies
cd ghostcut && npm install

# Start development server
npm run dev
```

```
→ Open http://localhost:5173
→ Upload a document
→ Paste AI-generated text
→ Watch hallucinations get CUT 🔪
```

<br/>

---

<br/>

## 🌐 `> Live Demo`

<p align="center">
  <a href="https://sriramdama.in">
    <img src="https://img.shields.io/badge/👉_TRY_IT_LIVE-sriramdama.in-00ff88?style=for-the-badge&labelColor=0d1117&color=00ff88" alt="Try Live" />
  </a>
</p>

<p align="center">
  Upload a document → Paste AI output → Watch hallucinations get <strong>cut</strong>.
</p>

<br/>

---

<br/>

## 🏁 `> Final Thought`

```
AI is powerful.
AI is fast.
But AI without verification is dangerous.
```

> **_"If AI writes the future, GHOSTCUT verifies it."_**

<br/>

---

<p align="center">
  <img src="https://img.shields.io/badge/🔥_Built_with_logic-not_vibes-ff0033?style=flat-square&labelColor=0d1117" />
  <img src="https://img.shields.io/badge/🔥_Audited-not_assumed-ff6b35?style=flat-square&labelColor=0d1117" />
  <img src="https://img.shields.io/badge/🔥_Hallucinations-TERMINATED-7c3aed?style=flat-square&labelColor=0d1117" />
</p>

<h3 align="center">— Team AVENGERS 🛡️</h3>

<p align="center">
  <sub>Built for IIT Roorkee E-Summit Hackathon 2025</sub>
</p>
