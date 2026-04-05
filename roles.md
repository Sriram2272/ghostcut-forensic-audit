<p align="center">
  <img src="https://img.shields.io/badge/🔪_GHOSTCUT-Team_AVENGERS-ff0033?style=for-the-badge&labelColor=0a0a0a" />
</p>

<h1 align="center">🛡️ Team AVENGERS — Roles & Contributions</h1>

<h3 align="center">
  <code>IIT Delhi Hackathon 2025</code>
</h3>

<p align="center">
  <strong>Every line of code. Every algorithm. Every pixel.<br/>Built together, owned together.</strong>
</p>

---

<br/>

## 👥 Team Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🔪 GHOSTCUT — Forensic AI Auditor                        │
│                                                             │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│   │  ⭐ DAMA      │  │  PRAJITHAA    │  │  AMITH        │  │
│   │  SRI RAM      │  │  PARANI       │  │  GEORGE       │  │
│   │               │  │               │  │               │  │
│   │  Team Leader  │  │  Core Dev     │  │  Core Dev     │  │
│   │  Full-Stack   │  │  Full-Stack   │  │  Full-Stack   │  │
│   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
│           │                  │                   │          │
│           └──────────────────┼───────────────────┘          │
│                              │                              │
│                    ┌─────────▼─────────┐                    │
│                    │   GHOSTCUT v1.0   │                    │
│                    │   Shipped ✅       │                    │
│                    └───────────────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## ⭐ Dama Sri Ram — `Team Leader & Architect`

<table>
<tr>
<td width="60%">

### 🎯 Primary Responsibilities

| Area | Contribution |
|------|-------------|
| 🏗️ **System Architecture** | Designed the entire GHOSTCUT verification pipeline — from document ingestion to final trust scoring |
| 🧠 **AI/NLP Engine** | Built the claim decomposition system using Gemini AI, implemented TF-IDF vectorization & cosine similarity retrieval |
| 📊 **Verification Core** | Engineered the NLI-based verdict engine (Supported / Contradicted / Unverifiable) with confidence scoring |
| 🔗 **Cascade Detection** | Implemented BFS-based cascade hallucination propagation — if one claim falls, dependent claims are flagged |
| ☁️ **Backend & Edge Functions** | Set up Lovable Cloud infrastructure, designed the `verify-claims` edge function for serverless AI processing |
| 🎨 **Frontend Architecture** | Structured the React component tree, routing, state management with TanStack Query |
| 📈 **Trust Score Algorithm** | Designed the weighted mathematical formula: `Score = 100 − (Contradicted% × 1.5) − (Unverifiable% × 0.5)` |
| 🚀 **Deployment & DevOps** | Managed builds, CI pipeline, domain setup at `sriramdama.in` |

### 🛠️ Technologies Owned

```
React 18 · TypeScript · Vite · Tailwind CSS · Supabase Edge Functions
Gemini 2.5 Flash · TF-IDF · Cosine Similarity · BFS Graph Traversal
Recharts · shadcn/ui · Framer Motion · jsPDF
```

### 📁 Key Files Authored

```
src/lib/verification-engine.ts    → Core verification pipeline
src/lib/claim-graph-utils.ts      → BFS cascade + topological sort
src/lib/document-pipeline.ts      → Document chunking & TF-IDF
supabase/functions/verify-claims/ → Edge function for AI verification
src/components/ClaimGraphView.tsx  → Interactive dependency graph
src/components/TrustDashboard.tsx  → Trust score visualization
src/pages/Index.tsx                → Main application page
```

</td>
<td width="40%" valign="top">

### 💡 Leadership Highlights

- ✅ Defined project vision & scope
- ✅ Assigned tasks & coordinated sprints
- ✅ Resolved cross-module integration conflicts
- ✅ Final code review authority
- ✅ Presentation & demo strategy
- ✅ Architecture decision records

### 🧩 Algorithm Contributions

| Algorithm | Purpose |
|-----------|---------|
| **BFS Cascade** | Error propagation in claim graphs |
| **TF-IDF + Cosine** | Document-claim similarity matching |
| **Sliding Window** | Overlapping chunk generation |
| **Weighted Scoring** | Trust score computation |
| **Topological Sort** | Graph layout ordering |

</td>
</tr>
</table>

<br/>

---

<br/>

## 🔬 Prajithaa Parani — `Core Developer & Backend Engineer`

<table>
<tr>
<td width="60%">

### 🎯 Primary Responsibilities

| Area | Contribution |
|------|-------------|
| ☁️ **Backend Architecture** | Co-designed the Lovable Cloud infrastructure — database schema, edge functions, API layer |
| 🔗 **API Integration** | Integrated Gemini AI for claim decomposition, structured prompt engineering for reliable JSON outputs |
| 📊 **Batch Audit System** | Built the batch audit panel — queue multiple LLM outputs against same source docs with comparison view |
| 🕸️ **Dependency Graph Engine** | Implemented the interactive claim dependency graph with D3-style force layout and focus-on-cascade toggle |
| 🔐 **Verification Policy Engine** | Built configurable verification policies — strict mode, depth levels, threshold controls |
| 📋 **Audit History & Comparison** | Designed the audit history system with side-by-side comparison of previous audit results |
| 🧠 **Evidence Trail System** | Built the retrieved evidence trail component — showing exact source passages with relevance scores |
| 🛡️ **Error Handling & Edge Cases** | Implemented graceful error recovery, loading states, empty states, and fallback mechanisms |

### 🛠️ Technologies Owned

```
TypeScript · Supabase Edge Functions · Deno · PostgreSQL
Gemini AI API · TanStack React Query · React Router
State Management · Error Boundaries · Performance Optimization
```

### 📁 Key Files Authored

```
src/components/BatchAuditPanel.tsx       → Multi-audit queue system
src/components/AuditComparison.tsx       → Side-by-side audit comparison
src/components/VerificationPanel.tsx     → Main verification interface
src/components/VerificationPolicy.tsx    → Policy configuration engine
src/components/RetrievedEvidenceTrail.tsx → Source evidence display
src/components/CorrectionEngine.tsx      → Suggested corrections
src/hooks/use-audit-history.ts           → Audit history state management
src/lib/audit-types.ts                   → Type definitions & interfaces
```

</td>
<td width="40%" valign="top">

### 💡 Backend Contributions

- ✅ Edge function architecture
- ✅ Prompt engineering for Gemini
- ✅ Batch processing pipeline
- ✅ Audit data persistence
- ✅ API error handling strategy
- ✅ Performance optimization

### 🧩 Algorithm Contributions

| Algorithm | Purpose |
|-----------|---------|
| **Queue Processing** | Batch audit sequential execution |
| **HashSet Lookups** | O(1) stop word filtering |
| **Float64Array** | Memory-efficient vector math |
| **Bézier Curves** | Smooth graph edge rendering |

</td>
</tr>
</table>

<br/>

---

<br/>

## ⚡ Amith George — `Core Developer & UI/UX Engineer`

<table>
<tr>
<td width="60%">

### 🎯 Primary Responsibilities

| Area | Contribution |
|------|-------------|
| 🎨 **UI/UX Design System** | Crafted the dark forensic theme — color tokens, typography, glassmorphism effects, responsive layouts |
| 📄 **Document Upload Pipeline** | Built the multi-format document processor (PDF, TXT, DOCX) with drag-and-drop interface |
| 🔍 **Sentence Viewer & Highlighting** | Implemented inline verdict highlighting — green/red/amber sentence-level visual feedback |
| 📊 **Data Visualization** | Designed the Trust Dashboard with Recharts — pie charts, bar graphs, risk indicators |
| ⚙️ **Settings & Configuration** | Built the configurable settings dialog — verification depth, confidence thresholds, chunk size tuning |
| 📤 **Export System** | Engineered multi-format export (PDF, JSON, CSV, Markdown) with professional report formatting |
| 🧪 **Testing & QA** | Wrote test suites, performed cross-browser testing, accessibility audits |
| 📱 **Responsive Design** | Ensured mobile-first layouts across all components |

### 🛠️ Technologies Owned

```
React 18 · TypeScript · Tailwind CSS · shadcn/ui · Radix UI
Recharts · jsPDF · jspdf-autotable · Framer Motion
CSS Custom Properties · Responsive Design · Dark Mode
```

### 📁 Key Files Authored

```
src/components/DocumentUpload.tsx     → File upload with format detection
src/components/SentenceViewer.tsx     → Inline verdict highlighting
src/components/HighlightedText.tsx    → Color-coded claim display
src/components/SettingsDialog.tsx     → Configuration panel
src/components/ExportDropdown.tsx     → Multi-format export menu
src/components/TrustScore.tsx         → Animated score display
src/lib/pdf-export.ts                → PDF report generation
src/lib/json-export.ts               → JSON/CSV/MD export logic
src/index.css                        → Design system tokens
```

</td>
<td width="40%" valign="top">

### 💡 Design Contributions

- ✅ Forensic dark theme with red accents
- ✅ Glassmorphism card effects
- ✅ Animated trust score gauge
- ✅ Verdict color system (🟢🔴🟡)
- ✅ Responsive breakpoint strategy
- ✅ Accessibility (WCAG compliance)

### 🧩 Algorithm Contributions

| Algorithm | Purpose |
|-----------|---------|
| **Regex Tokenizer** | Sentence boundary detection |
| **Largest Remainder** | Fair percentage rounding |
| **Color Interpolation** | Trust score → color mapping |
| **Debounce/Throttle** | UI performance optimization |

</td>
</tr>
</table>

<br/>

---

<br/>

## 🔄 Collaboration Matrix

> **Every member contributed across the full stack.** The table below shows the primary ownership distribution.

```
┌──────────────────────────┬───────────┬───────────┬───────────┐
│        MODULE            │  SRI RAM  │ PRAJITHAA │   AMITH   │
│                          │  ⭐ Lead  │           │           │
├──────────────────────────┼───────────┼───────────┼───────────┤
│ System Architecture      │  ████████ │  ██████   │  ██████   │
│ AI/NLP Pipeline          │  ████████ │  ████     │  ██████   │
│ Frontend Components      │  ██████   │  ████████ │  ██████   │
│ UI/UX Design System      │  ████     │  ████████ │  ████     │
│ Backend / Edge Functions  │  ████████ │  ████     │  ████████ │
│ Data Visualization       │  ██████   │  ████████ │  ████     │
│ Export & Reports          │  ████     │  ████████ │  ██████   │
│ Testing & QA             │  ██████   │  ██████   │  ██████   │
│ Deployment & DevOps      │  ████████ │  ████     │  ██████   │
│ Documentation            │  ████████ │  ██████   │  ██████   │
├──────────────────────────┼───────────┼───────────┼───────────┤
│ OVERALL CONTRIBUTION     │  ~38%     │  ~31%     │  ~31%     │
└──────────────────────────┴───────────┴───────────┴───────────┘

Legend: ████████ = Primary Owner   ██████ = Major Contributor   ████ = Contributor
```

<br/>

---

<br/>

## 🛠️ Shared Technology Expertise

All three members are proficient in the **entire stack**:

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED TECH STACK                         │
│                                                             │
│  Frontend        Backend          AI/NLP        DevOps      │
│  ─────────       ───────          ──────        ──────      │
│  React 18        Edge Functions   Gemini AI     Vite        │
│  TypeScript      PostgreSQL       TF-IDF        Git/GitHub  │
│  Tailwind CSS    REST APIs        Cosine Sim    CI/CD       │
│  shadcn/ui       Auth System      BFS/DFS       Deployment  │
│  Recharts        Cloud Infra      NLI Models    Monitoring  │
│  Framer Motion   Data Layer       Tokenizers    Domain DNS  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 📅 Development Timeline

```
Week 1                    Week 2                    Week 3
─────────────────────     ─────────────────────     ─────────────────────
🏗️ Architecture Design    🔬 NLP Pipeline Built      📊 Dashboards & Charts
📄 Document Pipeline      ⚖️ NLI Verification        📤 Export System
🎨 Design System Setup    🔗 Cascade Detection       🧪 Testing & QA
☁️ Cloud Infrastructure   ⚙️ Settings Engine          🚀 Deploy & Polish
         │                         │                         │
    All 3 members             All 3 members            All 3 members
    collaborated              collaborated             collaborated
```

<br/>

---

<br/>

## 🏆 Key Achievements

<table>
<tr>
<td align="center" width="33%">
<h3>15</h3>
<strong>Algorithms Implemented</strong><br/>
<sub>From TF-IDF to BFS Cascade</sub>
</td>
<td align="center" width="33%">
<h3>40+</h3>
<strong>Components Built</strong><br/>
<sub>React components with full type safety</sub>
</td>
<td align="center" width="33%">
<h3>3</h3>
<strong>Weeks to Ship</strong><br/>
<sub>From concept to production</sub>
</td>
</tr>
</table>

<br/>

---

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/🔥_Equal_Effort-Shared_Victory-ff0033?style=flat-square&labelColor=0a0a0a" />
  &nbsp;
  <img src="https://img.shields.io/badge/🛡️_Team_AVENGERS-United_Front-7c3aed?style=flat-square&labelColor=0a0a0a" />
</p>

<h3 align="center">— Team AVENGERS 🛡️</h3>

<p align="center">
  <sub>🏆 Built for IIT Delhi Hackathon 2025</sub>
</p>

<p align="center">
  <sub>Every member. Every module. Every line. Together. 💪</sub>
</p>
