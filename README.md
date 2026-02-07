# 🔪 GHOSTCUT  
### Cutting Hallucinations Out of AI

🚀 **Live Demo:** https://sriramdama.in  
👥 **Team:** AVENGERS  
🏆 **Built for:** IIT Roorkee E-Summit Hackathon

---

## 🧠 What is GHOSTCUT?

LLMs are smart.  
LLMs are confident.  
LLMs are also **sometimes confidently wrong**.

**GHOSTCUT** is an **AI Auditor for AI-generated content**.

It doesn’t *generate* text.  
It **verifies**, **cross-checks**, and **cuts hallucinations** before they reach humans.

Think of it as:
> 🔍 *A lie detector for AI outputs.*

---

## ❌ The Problem

Modern LLMs:
- Hallucinate subtle facts
- Mix correct and incorrect information
- Provide no source traceability
- Are dangerous in **healthcare, law, finance, and enterprise systems**

Manual verification:
- Is slow
- Is expensive
- Does not scale

👉 **Trust is the real bottleneck for AI adoption.**

---

## ✅ The Solution — GHOSTCUT

GHOSTCUT acts as a **verification layer** between AI outputs and users.

It:
- Breaks AI output into **atomic factual claims**
- Verifies each claim **only against uploaded documents**
- Classifies claims as:
  - 🟢 Supported
  - 🔴 Contradicted
  - 🟡 No Direct Evidence Found
- Explains **why**, **where**, and **how confident** each verdict is
- Computes a **real, auditable Trust Score**

No internet guessing.  
No black-box answers.  
No hallucination amplification.

---

## ⚙️ How It Works (High Level)

AI Output
↓
Claim Decomposition
↓
Evidence Retrieval (Document-Bounded)
↓
Claim Verification (NLI)
↓
Explainability + Trust Scoring


Every step is **deterministic**, **auditable**, and **explainable**.

---

## 🧩 Tech Stack (Verification-First Design)

### 🔍 NLP & ML Models
- **Sentence-BERT (SBERT)**  
  → Semantic retrieval of relevant document chunks
- **TF-IDF (Classical NLP)**  
  → Fast, deterministic first-pass filtering
- **RoBERTa / DeBERTa (NLI Models)**  
  → Claim–evidence entailment & contradiction detection

> ⚠️ No large generative models are used for verification.

---

### 🏗️ System Architecture
- Stateless verification APIs
- Modular pipeline:
  - Claim Decomposition
  - Retrieval
  - Verification
  - Explanation
- **Chunk-level & claim-level caching**
  → Faster re-audits, lower latency

---

## 📊 Key Features

- 🎯 **Claim-Level Fact Checking**
- 🔗 **Exact Evidence Citations**
- 🧠 **Logical & Cascade Hallucination Detection**
- 📉 **Math-Based Trust Score**
- ⚠️ **Risk Classification (Low / Medium / High)**
- 🧭 **Human-Readable Explainability**
- 📊 **Interactive Dependency Graph**
- 🌐 **Web App + WhatsApp Integration Ready**

---

## 💼 Real-World Use Cases

- 🏥 Medical report auditing
- ⚖️ Legal document verification
- 💰 Financial & compliance checks
- 🤖 AI copilots with guardrails
- 🏢 Enterprise AI deployments

If AI is used in **high-stakes decisions**, GHOSTCUT belongs there.

---

## 💰 Business & Scalability

### Who Pays?
- Enterprises using LLMs
- Legal & compliance teams
- Healthcare & FinTech companies
- AI platform providers

### Revenue Model
- SaaS subscriptions
- API-based usage pricing
- Enterprise licensing
- Messaging-platform (WhatsApp) integrations

### Why It Scales
- Low marginal compute cost
- High trust value
- Easy integration into existing AI pipelines

---

## 🌐 Live Demo

👉 **Try it live:** https://sriramdama.in  

Upload a document.  
Paste AI output.  
Watch hallucinations get **cut**.

---

## 🏁 Final Thought

AI is powerful.  
AI is fast.  
But **AI without verification is dangerous**.

> **If AI writes the future, GHOSTCUT verifies it.**

---

🔥 Built with logic, not vibes  
🔥 Audited, not assumed  
🔥 Hallucinations — terminated

— **Team AVENGERS**
