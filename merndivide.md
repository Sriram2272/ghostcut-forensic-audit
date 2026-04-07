<p align="center">
  <img src="https://img.shields.io/badge/🔪_GHOSTCUT-MERN_Stack-ff0033?style=for-the-badge&labelColor=0a0a0a" />
  <img src="https://img.shields.io/badge/Team-BYTEFORCES-7c3aed?style=for-the-badge&labelColor=0a0a0a" />
</p>

<h1 align="center">⚙️ MERN Stack — Work Division & Contributions</h1>

<h3 align="center">
  <code>IIT Delhi Hackathon 2025 • Team BYTEFORCES</code>
</h3>

<p align="center">
  <strong>MongoDB · Express.js · React.js · Node.js</strong><br/>
  <sub>Full-stack MERN application — every module built, tested & deployed by two engineers.</sub>
</p>

---

<br/>

## 🏗️ Tech Stack Overview (MERN)

```
┌─────────────────────────────────────────────────────────────────┐
│                      GHOSTCUT — MERN Stack                      │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │ MongoDB  │  │ Express  │  │  React   │  │  Node.js │      │
│   │          │  │          │  │          │  │          │      │
│   │ Database │→ │ REST API │→ │ Frontend │← │ Runtime  │      │
│   │ Storage  │  │ Routes   │  │ UI/UX    │  │ Server   │      │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│   + Gemini AI · TF-IDF · NLI · BFS Cascade · Cosine Similarity │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 👥 Team Members

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   ⭐ DAMA SRI RAM              PRAJITHAA PARANI            │
│   ─────────────────            ─────────────────           │
│   Team Leader &                Core Developer &            │
│   Full-Stack Architect         Full-Stack Engineer         │
│                                                            │
│   🧠 Complex Systems           🎨 UI/UX & Integration      │
│   🔗 Backend & AI Engine       📊 Visualization & Export   │
│   ☁️ Infrastructure            📄 Document Pipeline        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## ⭐ Dama Sri Ram — Team Leader & Full-Stack Architect

> 🧠 *Handled the most complex, algorithmically intensive modules — from AI verification engine to backend infrastructure.*

<br/>

### 🔥 Core Responsibilities

| # | Module | Technology | Complexity | Description |
|---|--------|-----------|------------|-------------|
| 1 | 🧠 **AI Verification Engine** | Node.js · Express · Gemini AI | 🔴 **Very High** | Built the entire NLI-based claim verification pipeline — decomposes LLM text into atomic claims, cross-references against source documents, returns verdicts (Supported / Contradicted / Unverifiable) with confidence scores |
| 2 | 📊 **TF-IDF + Cosine Similarity** | Node.js · Math Engine | 🔴 **Very High** | Implemented Term Frequency–Inverse Document Frequency vectorization from scratch, paired with cosine similarity for document-claim relevance matching |
| 3 | 🔗 **BFS Cascade Detection** | Node.js · Graph Algorithms | 🔴 **Very High** | Built Breadth-First Search cascade hallucination propagation — when one claim is contradicted, all dependent claims are automatically flagged |
| 4 | 🗄️ **MongoDB Schema Design** | MongoDB · Mongoose | 🟠 **High** | Designed the database schema for audit records, claim graphs, verification results, and user sessions |
| 5 | 🌐 **Express.js API Layer** | Express.js · REST API | 🟠 **High** | Built all backend API routes — `/api/verify`, `/api/claims`, `/api/audit-history`, `/api/batch-audit` with proper error handling & validation |
| 6 | ☁️ **Edge Functions & Serverless** | Node.js · Deno · Cloud | 🟠 **High** | Designed and deployed the `verify-claims` serverless function for AI-powered claim verification processing |
| 7 | 🔐 **Trust Score Algorithm** | Node.js · Mathematics | 🟠 **High** | Engineered the weighted scoring formula: `Score = 100 − (Contradicted% × 1.5) − (Unverifiable% × 0.5)` |
| 8 | 🕸️ **Claim Graph Engine** | React · Canvas · BFS/DFS | 🟠 **High** | Built the interactive claim dependency graph with force-directed layout, topological sorting, and cascade visualization |
| 9 | 🚀 **Deployment & DevOps** | CI/CD · Domain · SSL | 🟡 **Medium** | Managed production builds, domain setup at `sriramdama.in`, SSL certificates, CI pipeline |
| 10 | 🏗️ **System Architecture** | MERN · Design Patterns | 🔴 **Very High** | Designed the complete system architecture — component tree, data flow, state management patterns, API contracts |

<br/>

### 📁 Files Authored & Outcomes

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FILE                                    │  OUTCOME                      │
├──────────────────────────────────────────┼───────────────────────────────┤
│  src/lib/verification-engine.ts          │  Core AI verification logic   │
│  src/lib/claim-graph-utils.ts            │  BFS cascade + topo sort      │
│  src/lib/document-pipeline.ts            │  TF-IDF vectorization engine  │
│  supabase/functions/verify-claims/       │  Serverless AI processing     │
│  src/components/ClaimGraphView.tsx        │  Interactive dependency graph  │
│  src/components/TrustDashboard.tsx        │  Trust score visualization    │
│  src/components/VerificationPanel.tsx     │  Main verification interface  │
│  src/pages/Index.tsx                     │  Application main page        │
│  server/routes/api.js                    │  Express REST API routes      │
│  server/models/Audit.js                  │  MongoDB audit schema         │
│  server/models/Claim.js                  │  MongoDB claim schema         │
└──────────────────────────────────────────┴───────────────────────────────┘
```

<br/>

### 🧩 Algorithms Implemented

| Algorithm | Topic | Time Complexity | Why Used | Benefit |
|-----------|-------|----------------|----------|---------|
| **BFS Cascade** | Graph Traversal | O(V + E) | Propagate errors through claim dependencies | If one claim falls, all dependent claims are automatically flagged |
| **TF-IDF Vectorization** | Information Retrieval | O(N × M) | Convert text to numerical vectors for similarity | Identifies most relevant source passages for each claim |
| **Cosine Similarity** | Linear Algebra | O(N) | Measure angle between TF-IDF vectors | Finds closest matching evidence regardless of document length |
| **Topological Sort** | Graph Theory | O(V + E) | Order claims by dependency hierarchy | Ensures parent claims verified before children |
| **Sliding Window Chunking** | String Processing | O(N) | Split documents into overlapping segments | Preserves context at chunk boundaries |
| **Weighted Scoring** | Statistical Math | O(N) | Compute trust percentage from verdicts | Single intuitive metric for document reliability |

<br/>

### 🛠️ Technologies Used

```
Node.js · Express.js · MongoDB · Mongoose · Gemini 2.5 Flash AI
BFS · DFS · TF-IDF · Cosine Similarity · Topological Sort
React 18 · TypeScript · TanStack Query · Cloud Functions · Deno
```

<br/>

---

<br/>

## 🔬 Prajithaa Parani — Core Developer & Full-Stack Engineer

> 🎨 *Handled UI/UX design, data visualization, document processing, and export systems — making the app beautiful & functional.*

<br/>

### 🎯 Core Responsibilities

| # | Module | Technology | Complexity | Description |
|---|--------|-----------|------------|-------------|
| 1 | 🎨 **UI/UX Design System** | React · Tailwind CSS · CSS | 🟡 **Medium** | Crafted the dark forensic theme — color tokens, typography scale, glassmorphism effects, responsive breakpoints |
| 2 | 📄 **Document Upload Pipeline** | React · File API · Node.js | 🟡 **Medium** | Built the multi-format document processor (PDF, TXT, DOCX, JSON, CSV) with drag-and-drop interface & format detection |
| 3 | 🔍 **Sentence Viewer & Highlighting** | React · Regex · DOM | 🟡 **Medium** | Implemented inline verdict highlighting — green (supported), red (contradicted), amber (unverifiable) sentence-level visual feedback |
| 4 | 📊 **Data Visualization Dashboard** | React · Recharts · SVG | 🟡 **Medium** | Designed the Trust Dashboard with pie charts, bar graphs, risk indicators using Recharts library |
| 5 | ⚙️ **Settings & Configuration Panel** | React · State Management | 🟢 **Standard** | Built the configurable settings dialog — verification depth, confidence thresholds, chunk size tuning |
| 6 | 📤 **Multi-Format Export System** | React · jsPDF · Node.js | 🟡 **Medium** | Engineered export to PDF, JSON, CSV, and Markdown with professional report formatting & auto-table generation |
| 7 | 🔗 **Audit Input & Comparison** | React · MongoDB · Express | 🟡 **Medium** | Built the audit input interface and side-by-side comparison view for historical audit results |
| 8 | 📋 **Batch Audit Panel** | React · Queue System | 🟡 **Medium** | Created the batch audit queue — submit multiple LLM outputs against same source documents |
| 9 | 🧪 **Testing & QA** | Vitest · Testing Library | 🟢 **Standard** | Wrote test suites, cross-browser testing, accessibility audits, edge case validation |
| 10 | 📱 **Responsive Design** | Tailwind CSS · Media Queries | 🟢 **Standard** | Ensured mobile-first responsive layouts across all 40+ components |

<br/>

### 📁 Files Authored & Outcomes

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FILE                                    │  OUTCOME                      │
├──────────────────────────────────────────┼───────────────────────────────┤
│  src/components/DocumentUpload.tsx        │  Drag-and-drop file upload    │
│  src/components/SentenceViewer.tsx        │  Inline verdict highlighting  │
│  src/components/HighlightedText.tsx       │  Color-coded claim display    │
│  src/components/TrustScore.tsx            │  Animated score gauge         │
│  src/components/SettingsDialog.tsx        │  Configuration panel          │
│  src/components/ExportDropdown.tsx        │  Multi-format export menu     │
│  src/components/AuditInput.tsx            │  LLM text input interface     │
│  src/components/AuditComparison.tsx       │  Side-by-side comparison      │
│  src/components/BatchAuditPanel.tsx       │  Multi-audit queue system     │
│  src/lib/pdf-export.ts                   │  PDF report generation        │
│  src/lib/json-export.ts                  │  JSON/CSV/MD export logic     │
│  src/index.css                           │  Design system tokens         │
└──────────────────────────────────────────┴───────────────────────────────┘
```

<br/>

### 🧩 Algorithms Implemented

| Algorithm | Topic | Time Complexity | Why Used | Benefit |
|-----------|-------|----------------|----------|---------|
| **Regex Tokenizer** | String Processing | O(N) | Split text into sentences at boundaries | Accurate sentence-level verdict mapping |
| **Largest Remainder** | Number Theory | O(N log N) | Round percentages to sum exactly 100% | Clean dashboard statistics display |
| **Color Interpolation** | Computer Graphics | O(1) | Map trust scores to gradient colors | Intuitive red→amber→green visual feedback |
| **Debounce/Throttle** | Event Handling | O(1) | Limit rapid UI re-renders | Smooth performance during typing & interactions |
| **Queue Processing** | Data Structures | O(N) | Sequential batch audit execution | Reliable multi-document verification |
| **HashSet Lookup** | Hashing | O(1) avg | Stop word filtering in text processing | Fast preprocessing for TF-IDF pipeline |

<br/>

### 🛠️ Technologies Used

```
React 18 · TypeScript · Tailwind CSS · shadcn/ui · Radix UI
Recharts · jsPDF · jspdf-autotable · Framer Motion
MongoDB Queries · Express API Integration · Responsive Design
Vitest · Testing Library · Accessibility (WCAG)
```

<br/>

---

<br/>

## 🔄 Work Division Matrix

```
┌──────────────────────────────┬──────────────┬──────────────┐
│          MODULE              │  ⭐ SRI RAM   │  PRAJITHAA   │
│                              │  (Leader)    │              │
├──────────────────────────────┼──────────────┼──────────────┤
│ 🏗️ System Architecture       │  ████████████ │  ██████      │
│ 🧠 AI/NLP Verification       │  ████████████ │  ████        │
│ 🗄️ MongoDB Schema Design     │  ████████████ │  ██████      │
│ 🌐 Express.js API Routes     │  ████████████ │  ██████      │
│ 🔗 BFS Cascade Detection     │  ████████████ │  ████        │
│ ☁️ Edge Functions / Serverless│  ████████████ │  ████        │
│ 📊 TF-IDF + Cosine Sim       │  ████████████ │  ████        │
│ 🔐 Trust Score Algorithm     │  ████████████ │  ██████      │
│ 🕸️ Claim Graph Visualization │  ██████████   │  ██████      │
│ 🚀 Deployment & DevOps       │  ████████████ │  ██████      │
│                              │              │              │
│ 🎨 UI/UX Design System       │  ██████      │  ████████████ │
│ 📄 Document Upload Pipeline   │  ████        │  ████████████ │
│ 🔍 Sentence Highlighting     │  ████        │  ████████████ │
│ 📊 Dashboard & Charts         │  ██████      │  ████████████ │
│ ⚙️ Settings & Config          │  ████        │  ████████████ │
│ 📤 Export System (PDF/JSON)   │  ████        │  ████████████ │
│ 📋 Batch Audit Panel          │  ██████      │  ████████████ │
│ 🧪 Testing & QA              │  ██████      │  ████████████ │
│ 📱 Responsive Design          │  ████        │  ████████████ │
│ 🔗 Audit Comparison           │  ██████      │  ████████████ │
├──────────────────────────────┼──────────────┼──────────────┤
│ OVERALL CONTRIBUTION         │   ~55%       │   ~45%       │
└──────────────────────────────┴──────────────┴──────────────┘

Legend: ████████████ = Primary Owner    ██████ = Major Contributor    ████ = Contributor
```

<br/>

---

<br/>

## 🔀 MERN Stack Data Flow

```
                        GHOSTCUT — MERN Architecture
                        ─────────────────────────────

  📄 User Input                                           📊 Output
  ───────────                                           ────────
  │ LLM Text                                              │ Trust Score
  │ Source Docs                                           │ Verdicts
  ▼                                                       │ Reports
                                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  React  │───▶│  Express.js  │───▶│   MongoDB    │           │
│  │ Frontend│    │   REST API   │    │   Database   │           │
│  │         │◀───│              │◀───│              │           │
│  └────┬────┘    └──────┬───────┘    └──────────────┘           │
│       │                │                                        │
│       │                ▼                                        │
│       │         ┌──────────────┐                                │
│       │         │   Node.js    │                                │
│       │         │  AI Engine   │                                │
│       │         │              │                                │
│       │         │ • Gemini AI  │                                │
│       │         │ • TF-IDF     │                                │
│       │         │ • BFS/DFS    │                                │
│       │         │ • NLI Logic  │                                │
│       │         └──────────────┘                                │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────┐                           │
│  │        React Components          │                           │
│  │                                  │                           │
│  │  Sri Ram's Modules:              │                           │
│  │  • ClaimGraphView                │                           │
│  │  • TrustDashboard                │                           │
│  │  • VerificationPanel             │                           │
│  │                                  │                           │
│  │  Prajithaa's Modules:            │                           │
│  │  • DocumentUpload                │                           │
│  │  • SentenceViewer                │                           │
│  │  • ExportDropdown                │                           │
│  │  • SettingsDialog                │                           │
│  │  • BatchAuditPanel               │                           │
│  └──────────────────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 📈 Outcomes & Results

<table>
<tr>
<td align="center" width="25%">
<h3>🧠 10</h3>
<strong>Complex Algorithms</strong><br/>
<sub>Sri Ram: 6 | Prajithaa: 4</sub>
</td>
<td align="center" width="25%">
<h3>📄 23+</h3>
<strong>Files Authored</strong><br/>
<sub>Sri Ram: 11 | Prajithaa: 12</sub>
</td>
<td align="center" width="25%">
<h3>⚙️ 40+</h3>
<strong>React Components</strong><br/>
<sub>Full MERN integration</sub>
</td>
<td align="center" width="25%">
<h3>🚀 3</h3>
<strong>Weeks to Ship</strong><br/>
<sub>Concept → Production</sub>
</td>
</tr>
</table>

<br/>

---

<br/>

## 🛠️ Complete MERN Technology Map

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  M — MongoDB          E — Express.js       R — React 18         │
│  ──────────           ──────────────       ─────────            │
│  • Audit Storage      • REST API           • Component Tree     │
│  • Claim Records      • Route Handling     • State Management   │
│  • User Sessions      • Middleware         • TanStack Query     │
│  • Graph Data         • Error Handling     • Tailwind CSS       │
│  • Export History     • CORS Config        • shadcn/ui          │
│                       • Request Parsing    • Recharts           │
│                                            • Framer Motion      │
│                                                                 │
│  N — Node.js          AI / NLP Layer       DevOps               │
│  ──────────           ──────────────       ──────               │
│  • Runtime Engine     • Gemini 2.5 Flash   • Vite Build         │
│  • NPM Packages      • TF-IDF Engine      • CI/CD Pipeline     │
│  • File Processing    • Cosine Similarity  • Domain Setup       │
│  • Stream Handling    • BFS Cascade        • SSL Certificates   │
│  • Edge Functions     • NLI Verification   • Cloud Deploy       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 🏆 Individual Highlights

### ⭐ Sri Ram — Why He Led the Complex Modules

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 COMPLEXITY BREAKDOWN — SRI RAM'S MODULES               │
│                                                             │
│  Verification Engine    ████████████████████  (Very High)   │
│  BFS Cascade Detection  ████████████████████  (Very High)   │
│  TF-IDF Implementation  ████████████████████  (Very High)   │
│  System Architecture    ████████████████████  (Very High)   │
│  MongoDB Schema Design  ███████████████       (High)        │
│  Express API Layer      ███████████████       (High)        │
│  Edge Functions         ███████████████       (High)        │
│  Trust Score Math       ███████████████       (High)        │
│  Claim Graph Engine     ███████████████       (High)        │
│  DevOps & Deployment    ██████████            (Medium)      │
│                                                             │
│  Average Complexity: 🔴 HIGH                                │
└─────────────────────────────────────────────────────────────┘
```

### 🔬 Prajithaa — Why Her Modules Were Essential

```
┌─────────────────────────────────────────────────────────────┐
│  🎨 IMPACT BREAKDOWN — PRAJITHAA'S MODULES                 │
│                                                             │
│  UI/UX Design System    ████████████████  (High Impact)     │
│  Document Upload        ████████████████  (High Impact)     │
│  Data Visualization     ████████████████  (High Impact)     │
│  Export System           ████████████████  (High Impact)     │
│  Sentence Highlighting  █████████████     (Medium Impact)   │
│  Batch Audit Panel      █████████████     (Medium Impact)   │
│  Audit Comparison       █████████████     (Medium Impact)   │
│  Settings Panel         ██████████        (Standard)        │
│  Testing & QA           ██████████        (Standard)        │
│  Responsive Design      ██████████        (Standard)        │
│                                                             │
│  Average Impact: 🟡 HIGH (User-Facing)                      │
└─────────────────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## 📝 Summary

| Aspect | ⭐ Dama Sri Ram | Prajithaa Parani |
|--------|----------------|------------------|
| **Role** | Team Leader & Architect | Core Developer & Engineer |
| **Focus** | Backend, AI Engine, Algorithms | Frontend, UI/UX, Exports |
| **Complexity** | 🔴 Very High (Graph algorithms, AI/NLP) | 🟡 Medium-High (UI systems, visualization) |
| **Stack** | Node.js, Express, MongoDB, Gemini AI | React, Tailwind, Recharts, jsPDF |
| **Files** | 11 core files | 12 core files |
| **Algorithms** | 6 (BFS, TF-IDF, Cosine, Topo Sort, etc.) | 6 (Regex, Queue, HashSet, Debounce, etc.) |
| **Contribution** | ~55% | ~45% |

<br/>

---

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/🔪_GHOSTCUT-Built_with_MERN-ff0033?style=flat-square&labelColor=0a0a0a" />
  &nbsp;
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
</p>

<h3 align="center">— Team BYTEFORCES 🛡️</h3>

<p align="center">
  <sub>🏆 Built for IIT Delhi Hackathon 2025</sub><br/>
  <sub>Full MERN Stack • Two Engineers • One Mission: Cut Hallucinations 🔪</sub>
</p>
