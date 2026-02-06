import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ClaimRequest {
  claim: string;
  evidenceChunks: { documentName: string; chunkText: string; chunkId: string }[];
}

interface ConfidenceRange {
  low: number;
  high: number;
  explanation?: string;
}

interface VerificationResult {
  verdict: "supported" | "contradicted" | "unverifiable";
  confidence: ConfidenceRange;
  reasoning: string;
  nli: {
    verdict: "supported" | "contradicted" | "unverifiable";
    confidence: ConfidenceRange;
    reasoning: string;
  };
  judge: {
    verdict: "supported" | "contradicted" | "unverifiable";
    confidence: ConfidenceRange;
    reasoning: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Verification model unavailable", detail: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { claims } = (await req.json()) as { claims: ClaimRequest[] };

    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      return new Response(
        JSON.stringify({ error: "No claims provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BATCH_SIZE = 3;
    const results: (VerificationResult | { error: string })[] = [];

    for (let i = 0; i < claims.length; i += BATCH_SIZE) {
      const batch = claims.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((claim) => verifySingleClaim(claim, LOVABLE_API_KEY))
      );
      results.push(...batchResults);

      if (i + BATCH_SIZE < claims.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-claims error:", e);
    return new Response(
      JSON.stringify({
        error: "Verification model unavailable",
        detail: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function verifySingleClaim(
  claim: ClaimRequest,
  apiKey: string
): Promise<VerificationResult | { error: string }> {
  const evidenceText =
    claim.evidenceChunks.length > 0
      ? claim.evidenceChunks
          .map(
            (e, i) =>
              `[Evidence ${i + 1} from "${e.documentName}"]\n${e.chunkText}`
          )
          .join("\n\n")
      : "NO EVIDENCE AVAILABLE — no document chunk matched this claim above the similarity threshold.";

  const systemPrompt = `You are a forensic fact-checking system performing Natural Language Inference (NLI) and judicial analysis.

You will receive a CLAIM and EVIDENCE from uploaded documents. You must determine whether the evidence SUPPORTS, CONTRADICTS, or is insufficient to verify (UNVERIFIABLE) the claim.

CRITICAL RULES:
- You may ONLY use the provided evidence. Do NOT use any external knowledge.
- If no evidence is provided or evidence is irrelevant, the verdict MUST be "unverifiable".
- If the evidence partially matches but key facts (numbers, dates, names) differ, the verdict MUST be "contradicted".
- Do NOT fabricate or hallucinate evidence that is not in the provided text.
- NEVER return 1.0 or 100% confidence. Maximum allowed is 0.98.

UNVERIFIABLE CLASSIFICATION RULES (STRICT):
- A claim is UNVERIFIABLE only when the source documents are COMPLETELY SILENT on the topic.
- Do NOT classify a claim as "unverifiable" if there is partial evidence — use "supported" or "contradicted" instead.
- Do NOT use ambiguous labels like "partial reference", "partial evidence", or "weak match" in your reasoning.
- For UNVERIFIABLE claims, the reasoning MUST clearly state that the uploaded source documents do not contain any information about this topic.
- For UNVERIFIABLE claims, confidence refers to CERTAINTY THAT THE SOURCE IS SILENT, not that the claim is false.
- Example confidence explanation for UNVERIFIABLE: "High confidence that the source documents do not address this claim."
- Do NOT auto-correct, downgrade to contradicted, or fabricate evidence for UNVERIFIABLE claims.

CONFIDENCE RANGE RULES:
- Return confidence as a RANGE (low and high bounds), not a single number.
- The range width reflects your uncertainty. A narrow range (e.g., 0.91–0.96) means high certainty. A wide range (e.g., 0.40–0.75) means significant uncertainty.
- confidence_low must always be less than confidence_high.
- Neither value can be 1.0. Maximum is 0.98.
- Minimum is 0.05.
- Always provide a confidence_explanation that explains WHY you chose this confidence level.
- For high confidence (>0.85), explain what specific evidence feature drives the certainty (e.g., "Explicit negation found in source document", "Exact numeric match across two sources").
- For low confidence, explain what is uncertain (e.g., "Evidence is tangentially related but does not directly address the claim").`;

  const userPrompt = `CLAIM: "${claim.claim}"

EVIDENCE:
${evidenceText}

Analyze this claim against the evidence using both NLI classification and judicial reasoning. Provide confidence as ranges with explanations.`;

  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_verification",
                description:
                  "Submit the NLI and judge verification results for this claim with confidence ranges.",
                parameters: {
                  type: "object",
                  properties: {
                    nli_verdict: {
                      type: "string",
                      enum: ["supported", "contradicted", "unverifiable"],
                    },
                    nli_confidence_low: {
                      type: "number",
                      description: "Lower bound of NLI confidence (0.05–0.98).",
                    },
                    nli_confidence_high: {
                      type: "number",
                      description: "Upper bound of NLI confidence (0.05–0.98). Must be > nli_confidence_low.",
                    },
                    nli_confidence_explanation: {
                      type: "string",
                      description: "Why this NLI confidence level? Reference specific evidence features.",
                    },
                    nli_reasoning: {
                      type: "string",
                      description: "Brief NLI explanation of the entailment/contradiction/neutrality.",
                    },
                    judge_verdict: {
                      type: "string",
                      enum: ["supported", "contradicted", "unverifiable"],
                    },
                    judge_confidence_low: {
                      type: "number",
                      description: "Lower bound of judge confidence (0.05–0.98).",
                    },
                    judge_confidence_high: {
                      type: "number",
                      description: "Upper bound of judge confidence (0.05–0.98). Must be > judge_confidence_low.",
                    },
                    judge_confidence_explanation: {
                      type: "string",
                      description: "Why this judge confidence level? Reference specific evidence features.",
                    },
                    judge_reasoning: {
                      type: "string",
                      description: "Detailed judicial reasoning referencing specific evidence.",
                    },
                    final_verdict: {
                      type: "string",
                      enum: ["supported", "contradicted", "unverifiable"],
                    },
                    final_confidence_low: {
                      type: "number",
                      description: "Lower bound of combined confidence (0.05–0.98).",
                    },
                    final_confidence_high: {
                      type: "number",
                      description: "Upper bound of combined confidence (0.05–0.98). Must be > final_confidence_low.",
                    },
                    final_confidence_explanation: {
                      type: "string",
                      description: "Explain what drives the final confidence (e.g. 'Explicit negation found in source document').",
                    },
                    final_reasoning: {
                      type: "string",
                      description: "Final reasoning synthesizing NLI and judge perspectives.",
                    },
                  },
                  required: [
                    "nli_verdict",
                    "nli_confidence_low",
                    "nli_confidence_high",
                    "nli_confidence_explanation",
                    "nli_reasoning",
                    "judge_verdict",
                    "judge_confidence_low",
                    "judge_confidence_high",
                    "judge_confidence_explanation",
                    "judge_reasoning",
                    "final_verdict",
                    "final_confidence_low",
                    "final_confidence_high",
                    "final_confidence_explanation",
                    "final_reasoning",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "submit_verification" },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI gateway error ${response.status}:`, errText);

      if (response.status === 429) {
        return { error: "Rate limited — please try again shortly." };
      }
      if (response.status === 402) {
        return { error: "AI credits exhausted — please add funds." };
      }
      return { error: `Verification model unavailable (HTTP ${response.status})` };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return { error: "Verification model returned invalid response format." };
    }

    const args = JSON.parse(toolCall.function.arguments);

    // Clamp and validate confidence ranges
    const clampConf = (v: number) => Math.max(0.05, Math.min(0.98, v || 0));
    const buildRange = (low: number, high: number, explanation?: string): ConfidenceRange => {
      const lo = clampConf(low);
      const hi = clampConf(high);
      return {
        low: Math.min(lo, hi),
        high: Math.max(lo, hi),
        explanation: explanation || undefined,
      };
    };

    return {
      verdict: args.final_verdict,
      confidence: buildRange(args.final_confidence_low, args.final_confidence_high, args.final_confidence_explanation),
      reasoning: args.final_reasoning,
      nli: {
        verdict: args.nli_verdict,
        confidence: buildRange(args.nli_confidence_low, args.nli_confidence_high, args.nli_confidence_explanation),
        reasoning: args.nli_reasoning,
      },
      judge: {
        verdict: args.judge_verdict,
        confidence: buildRange(args.judge_confidence_low, args.judge_confidence_high, args.judge_confidence_explanation),
        reasoning: args.judge_reasoning,
      },
    };
  } catch (e) {
    console.error("Model call failed:", e);
    return {
      error: `Verification model unavailable: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }
}