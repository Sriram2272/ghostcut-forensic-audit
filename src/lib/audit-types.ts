export type SentenceStatus = "supported" | "contradicted" | "unverifiable";

export type HallucinationSeverity = "critical" | "moderate" | "minor";

export interface SeverityInfo {
  level: HallucinationSeverity;
  reasoning: string;
}

export interface AuditSentence {
  id: string;
  text: string;
  status: SentenceStatus;
  confidence: number;
  reasoning: string;
  evidenceIds: string[]; // links to SourceParagraph ids
  severity?: SeverityInfo; // only present for contradicted claims
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

export interface AuditResult {
  sentences: AuditSentence[];
  documents: SourceDocument[];
  trustScore: number; // now computed dynamically via computeWeightedTrustScore
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
    }
    // supported = 0 penalty
  }

  const score = Math.round(Math.max(0, Math.min(100, 100 * (1 - totalPenalty / maxPenalty) )));
  return score;
}

// ═══════════════════════════════════════════
// MOCK DATA — Rich forensic audit scenario
// ═══════════════════════════════════════════

export const MOCK_AUDIT_RESULT: AuditResult = {
  trustScore: 33,
  sentences: [
    {
      id: "s1",
      text: "Nextera Health was founded in 2017 by Dr. Ananya Kapoor as a digital therapeutics company.",
      status: "supported",
      confidence: 0.97,
      reasoning:
        "The founding year, founder name, and company classification all match the corporate filing document exactly.",
      evidenceIds: ["p1-2"],
    },
    {
      id: "s2",
      text: "The company received FDA 510(k) clearance for its flagship product, NeuraScan, in January 2023.",
      status: "contradicted",
      confidence: 0.92,
      reasoning:
        "The regulatory filing shows the 510(k) clearance was granted in March 2024, not January 2023. The product name is correct but the date is fabricated, which is a dangerous error in a medical context.",
      evidenceIds: ["p2-3"],
      severity: {
        level: "moderate",
        reasoning: "Incorrect date on a regulatory filing. While the FDA clearance exists, the 14-month date discrepancy could mislead investors about the company's regulatory timeline and product maturity.",
      },
    },
    {
      id: "s3",
      text: "NeuraScan uses a proprietary deep-learning algorithm trained on over 2 million brain MRI scans.",
      status: "supported",
      confidence: 0.89,
      reasoning:
        "The technical whitepaper confirms a deep-learning approach trained on 2.1 million anonymized brain MRI scans from partner hospitals.",
      evidenceIds: ["p3-2"],
    },
    {
      id: "s4",
      text: "In Q2 2025, Nextera Health reported annual recurring revenue of $120 million.",
      status: "contradicted",
      confidence: 0.95,
      reasoning:
        "The financial disclosure for Q2 2025 clearly states ARR of $47.3 million. The claimed $120M figure is a 153% overstatement and constitutes a material misrepresentation.",
      evidenceIds: ["p4-2"],
      severity: {
        level: "critical",
        reasoning: "Numeric financial fact inflated by 153%. ARR of $120M vs actual $47.3M constitutes material misrepresentation that could violate SEC regulations and mislead investors in due diligence.",
      },
    },
    {
      id: "s5",
      text: "The company has established partnerships with Mayo Clinic, Johns Hopkins, and Cleveland Clinic.",
      status: "supported",
      confidence: 0.93,
      reasoning:
        "The partnership announcements document confirms active agreements with all three institutions.",
      evidenceIds: ["p5-1"],
    },
    {
      id: "s6",
      text: "Clinical trials demonstrated a 99.7% accuracy rate in detecting early-stage glioblastoma.",
      status: "contradicted",
      confidence: 0.98,
      reasoning:
        "The published trial results show 87.3% sensitivity and 91.2% specificity—not 99.7% accuracy. This exaggeration in a medical AI claim could directly endanger patients.",
      evidenceIds: ["p3-4"],
      severity: {
        level: "critical",
        reasoning: "Fabricated medical accuracy statistic for a cancer detection tool. Overstating diagnostic performance from 87% to 99.7% could lead to misplaced clinical trust and endanger patient lives.",
      },
    },
    {
      id: "s7",
      text: "Nextera Health plans to expand into the European market by establishing a regional headquarters in Zurich.",
      status: "unverifiable",
      confidence: 0.45,
      reasoning:
        "No source document mentions European expansion plans or a Zurich office. This claim can neither be confirmed nor denied with available materials.",
      evidenceIds: [],
    },
    {
      id: "s8",
      text: "The company currently employs over 800 people across 5 offices worldwide.",
      status: "unverifiable",
      confidence: 0.52,
      reasoning:
        "The HR overview mentions '500+ employees' but does not specify office count. The 800 figure cannot be verified and may be inflated.",
      evidenceIds: ["p6-1"],
    },
    {
      id: "s9",
      text: "Dr. Kapoor holds dual PhDs in Computational Neuroscience from MIT and Biomedical Engineering from Stanford.",
      status: "supported",
      confidence: 0.96,
      reasoning:
        "The executive biography confirms both degrees with the correct institutions.",
      evidenceIds: ["p1-3"],
    },
    {
      id: "s10",
      text: "The NeuraScan platform has been endorsed by the World Health Organization for use in developing nations.",
      status: "contradicted",
      confidence: 0.99,
      reasoning:
        "No WHO endorsement exists in any uploaded document. A WHO endorsement is a significant institutional claim that appears entirely fabricated. This is a high-severity hallucination.",
      evidenceIds: [],
      severity: {
        level: "critical",
        reasoning: "Entirely fabricated institutional endorsement from the WHO — a global health authority. False claims of WHO backing for a medical device constitute fraud and could facilitate illegal market entry.",
      },
    },
  ],
  documents: [
    {
      id: "doc1",
      name: "corporate-filing-2024.pdf",
      type: "pdf",
      paragraphs: [
        {
          id: "p1-1",
          text: "CORPORATE FILING — NEXTERA HEALTH INC.\nDocument Classification: Public Record\nFiled with the Securities and Exchange Commission, 2024.",
          linkedSentenceIds: [],
        },
        {
          id: "p1-2",
          text: "Nextera Health Inc. was incorporated in the State of Delaware on August 14, 2017. The company was founded by Dr. Ananya Kapoor with the stated mission of developing AI-powered digital therapeutics for neurological disorders. Initial seed funding of $3.2 million was provided by Horizon Ventures.",
          linkedSentenceIds: ["s1"],
        },
        {
          id: "p1-3",
          text: "Dr. Ananya Kapoor, CEO and Co-Founder, holds a Ph.D. in Computational Neuroscience from the Massachusetts Institute of Technology (2012) and a Ph.D. in Biomedical Engineering from Stanford University (2015). Prior to founding Nextera Health, she served as a Senior Research Scientist at Google DeepMind's Health Division.",
          linkedSentenceIds: ["s9"],
        },
        {
          id: "p1-4",
          text: "The company's principal offices are located at 450 Kendall Street, Cambridge, Massachusetts 02142. Additional office locations include San Francisco, CA and Austin, TX.",
          linkedSentenceIds: [],
        },
      ],
    },
    {
      id: "doc2",
      name: "regulatory-status-report.pdf",
      type: "pdf",
      paragraphs: [
        {
          id: "p2-1",
          text: "REGULATORY STATUS REPORT\nPrepared for: Board of Directors\nDate: June 2025\nClassification: Confidential",
          linkedSentenceIds: [],
        },
        {
          id: "p2-2",
          text: "The following report summarizes the current regulatory status of all Nextera Health products under review by the U.S. Food and Drug Administration and equivalent international bodies.",
          linkedSentenceIds: [],
        },
        {
          id: "p2-3",
          text: "NeuraScan Diagnostic Platform — FDA Status: 510(k) CLEARED\nClearance Number: K241892\nDate of Clearance: March 15, 2024\nPredicate Device: NeuroAssist Pro (K192847)\nIndications for Use: Computer-aided detection of abnormalities in adult brain MRI scans. Not intended as a standalone diagnostic tool.",
          linkedSentenceIds: ["s2"],
        },
        {
          id: "p2-4",
          text: "Note: The clearance scope is limited to computer-aided detection. Any claim of standalone diagnostic capability or disease-specific accuracy exceeding published trial results is not supported by the regulatory record.",
          linkedSentenceIds: [],
        },
      ],
    },
    {
      id: "doc3",
      name: "technical-whitepaper-neurascan.pdf",
      type: "pdf",
      paragraphs: [
        {
          id: "p3-1",
          text: "TECHNICAL WHITEPAPER: NeuraScan Deep Learning Architecture\nVersion 4.2 | Published: February 2025\nAuthors: Dr. A. Kapoor, Dr. R. Chen, Dr. M. Okonkwo",
          linkedSentenceIds: [],
        },
        {
          id: "p3-2",
          text: "The NeuraScan platform employs a proprietary convolutional neural network architecture (NSNet-v4) trained on a dataset of 2,100,000 anonymized brain MRI scans sourced from 14 partner hospitals across North America and Europe. Training was conducted on NVIDIA A100 GPU clusters over a period of 18 months.",
          linkedSentenceIds: ["s3"],
        },
        {
          id: "p3-3",
          text: "Data preprocessing included skull-stripping, intensity normalization, and registration to MNI152 standard space. Augmentation techniques included random rotation (±15°), elastic deformation, and contrast adjustment. All training data was de-identified in accordance with HIPAA Safe Harbor provisions.",
          linkedSentenceIds: [],
        },
        {
          id: "p3-4",
          text: "Clinical validation results (Phase III trial, NCT04892301, n=4,200):\n— Sensitivity for early-stage glioblastoma: 87.3% (95% CI: 84.1–90.5%)\n— Specificity: 91.2% (95% CI: 88.7–93.7%)\n— Positive Predictive Value: 76.8%\n— Area Under ROC Curve: 0.934\nThese results represent performance as a screening aid, not standalone diagnosis.",
          linkedSentenceIds: ["s6"],
        },
      ],
    },
    {
      id: "doc4",
      name: "financial-disclosure-q2-2025.pdf",
      type: "pdf",
      paragraphs: [
        {
          id: "p4-1",
          text: "QUARTERLY FINANCIAL DISCLOSURE\nNextera Health Inc. — Q2 2025\nPrepared for Shareholders and Regulatory Compliance\nAll figures in USD unless otherwise noted.",
          linkedSentenceIds: [],
        },
        {
          id: "p4-2",
          text: "Annual Recurring Revenue (ARR): $47,300,000 (up 34% year-over-year)\nQuarterly Revenue: $12,800,000\nGross Margin: 71.2%\nNet Loss: ($8,400,000)\nCash and Equivalents: $62,100,000\nBurn Rate: Approximately $4.2M/month",
          linkedSentenceIds: ["s4"],
        },
        {
          id: "p4-3",
          text: "Management Commentary: Revenue growth continues to accelerate driven by new hospital system deployments. We expect to reach profitability by Q4 2026 based on current trajectory. Pipeline expansion into cardiac imaging is on track for initial FDA submission in Q1 2026.",
          linkedSentenceIds: [],
        },
      ],
    },
    {
      id: "doc5",
      name: "partnership-announcements.pdf",
      type: "pdf",
      paragraphs: [
        {
          id: "p5-1",
          text: "ACTIVE INSTITUTIONAL PARTNERSHIPS\n\n1. Mayo Clinic (Rochester, MN) — Signed February 2023. Scope: Deployment of NeuraScan in Department of Radiology. Status: ACTIVE.\n\n2. Johns Hopkins Medicine (Baltimore, MD) — Signed June 2023. Scope: Clinical validation study and integration with PACS. Status: ACTIVE.\n\n3. Cleveland Clinic (Cleveland, OH) — Signed November 2023. Scope: Multi-site deployment across neurology and radiology departments. Status: ACTIVE.",
          linkedSentenceIds: ["s5"],
        },
        {
          id: "p5-2",
          text: "Pending Partnerships: Negotiations are underway with Massachusetts General Hospital and UCSF Medical Center. Expected signing: Q3 2025.",
          linkedSentenceIds: [],
        },
      ],
    },
    {
      id: "doc6",
      name: "hr-overview-2025.pdf",
      type: "txt",
      paragraphs: [
        {
          id: "p6-1",
          text: "HUMAN RESOURCES OVERVIEW — NEXTERA HEALTH\nAs of May 2025\n\nTotal Headcount: 520 full-time employees\nEngineering & Data Science: 210\nClinical & Regulatory: 85\nSales & Marketing: 110\nOperations & Support: 75\nExecutive & Administrative: 40\n\nAttrition Rate (trailing 12 months): 11.4%\nOpen Positions: 47",
          linkedSentenceIds: ["s8"],
        },
      ],
    },
  ],
};
