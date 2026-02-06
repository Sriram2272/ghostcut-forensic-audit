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

interface VerificationResult {
  verdict: "supported" | "contradicted" | "unverifiable";
  confidence: number;
  reasoning: string;
  nli: {
    verdict: "supported" | "contradicted" | "unverifiable";
    confidence: number;
    reasoning: string;
  };
  judge: {
    verdict: "supported" | "contradicted" | "unverifiable";
    confidence: number;
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

    // Process claims in batches to avoid rate limits
    const BATCH_SIZE = 3;
    const results: (VerificationResult | { error: string })[] = [];

    for (let i = 0; i < claims.length; i += BATCH_SIZE) {
      const batch = claims.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((claim) => verifySingleClaim(claim, LOVABLE_API_KEY))
      );
      results.push(...batchResults);

      // Small delay between batches to avoid rate limiting
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
- Confidence scores must reflect your actual certainty (0.0 to 1.0).
- Do NOT fabricate or hallucinate evidence that is not in the provided text.`;

  const userPrompt = `CLAIM: "${claim.claim}"

EVIDENCE:
${evidenceText}

Analyze this claim against the evidence using both NLI classification and judicial reasoning.`;

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
                  "Submit the NLI and judge verification results for this claim.",
                parameters: {
                  type: "object",
                  properties: {
                    nli_verdict: {
                      type: "string",
                      enum: ["supported", "contradicted", "unverifiable"],
                      description:
                        "NLI classification: does the evidence entail, contradict, or fail to address the claim?",
                    },
                    nli_confidence: {
                      type: "number",
                      description:
                        "NLI confidence score from 0.0 to 1.0 based on evidence strength.",
                    },
                    nli_reasoning: {
                      type: "string",
                      description:
                        "Brief NLI explanation of the entailment/contradiction/neutrality relationship.",
                    },
                    judge_verdict: {
                      type: "string",
                      enum: ["supported", "contradicted", "unverifiable"],
                      description:
                        "Judge verdict after considering all evidence holistically.",
                    },
                    judge_confidence: {
                      type: "number",
                      description:
                        "Judge confidence score from 0.0 to 1.0.",
                    },
                    judge_reasoning: {
                      type: "string",
                      description:
                        "Detailed judicial reasoning explaining the verdict, referencing specific evidence.",
                    },
                    final_verdict: {
                      type: "string",
                      enum: ["supported", "contradicted", "unverifiable"],
                      description:
                        "Final combined verdict considering both NLI and judge analysis.",
                    },
                    final_confidence: {
                      type: "number",
                      description:
                        "Final confidence score from 0.0 to 1.0.",
                    },
                    final_reasoning: {
                      type: "string",
                      description:
                        "Final reasoning synthesizing NLI and judge perspectives.",
                    },
                  },
                  required: [
                    "nli_verdict",
                    "nli_confidence",
                    "nli_reasoning",
                    "judge_verdict",
                    "judge_confidence",
                    "judge_reasoning",
                    "final_verdict",
                    "final_confidence",
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

    // Clamp confidence values
    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    return {
      verdict: args.final_verdict,
      confidence: clamp(args.final_confidence),
      reasoning: args.final_reasoning,
      nli: {
        verdict: args.nli_verdict,
        confidence: clamp(args.nli_confidence),
        reasoning: args.nli_reasoning,
      },
      judge: {
        verdict: args.judge_verdict,
        confidence: clamp(args.judge_confidence),
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
