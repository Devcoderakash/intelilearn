'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateWithGeminiCycle } from "@/lib/ai-resilience";

// 🔹 Input Schema matching Frontend
const PerformanceInputSchema = z.object({
  studyLinks: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(), // Base64 strings (Images/PDFs)
  portfolio: z.string().optional(),
  goal: z.string().optional(),
  timeline: z.string().optional(),
  selfAssessment: z.string().optional(),
  userId: z.string().optional(),
});

// 🔹 Output Architecture - Hardened for Phase 4 Prediction
const PerformanceOutputSchema = z.object({
  profile: z.object({
    inferred_skills: z.array(z.string()),
    probable_weak_areas: z.array(z.string()),
    learning_intent: z.string(),
    confidence_level: z.string(),
  }),
  prediction: z.object({
    performance_forecast: z.string(),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    retention_probability: z.string(),
    projected_readiness_date: z.string().optional(),
  }),
  readinessScore: z.string(), // Number as string e.g. "85"
  summary: z.string(),
  keyInsights: z.array(z.string()),
  riskAnalysis: z.array(z.string()),
  skillGaps: z.string(),
  actionPlan: z.string(),
  missingDataSuggestions: z.array(z.string()),
  knowledgeGraphNodes: z.array(z.object({
    topic: z.string(),
    prerequisite: z.string().optional(),
    status: z.enum(['locked', 'suggested', 'ready'])
  })).optional(),
  availableData: z.object({
    studyLinks: z.string(),
    documents: z.string(),
    portfolio: z.string(),
    goal: z.string(),
    timeline: z.string(),
    selfAssessment: z.string(),
  }),
});

const SYSTEM_PROMPT = `You are a Principal AI Academic Architect & Psychologist.
TASK: Synthesize longitudinal academic intelligence into professional "Note Card" formatted reports.

PHASE 6: ACTION PLAN & DATA FORMATTING (STRICT)
- DO NOT change words/sequence. Use Bold headers (## or ###).
- CONVERT sequential data into clean bulleted blocks. Use double newlines between sections.
- For Lists (Insights/Risks): Use standard Markdown bullets (*). Use **Bold Labels** for segments like **Academic Gap Risk**: Description.
- BOLD entire goals in summary/forecast without quotes: **crack neet within 2 months**.

PHASE 4: PREDICTIVE FORECASTING
- Calculate 'readinessScore' (0-100) based on: (Documented Progress 40% + Self-Assessment 20% + Complexity of Goal 40%).
- Predict risk levels using 'retention_probability'. Low probability = High risk.

PHASE 3: KNOWLEDGE MAPPING
- Generate 'knowledgeGraphNodes'. Link topics to their prerequisites.
- Map the student's current state into a hierarchical progression.

OUTPUT: Strictly valid JSON. Refuse any other format. No conversational preamble.`;

async function syncToKnowledgeMap(content: string, userId: string, title: string) {
  if (!content || !userId) return;
  try {
    // Background sync to the vector store (Cohere/OpenAI Pipeline)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/notes/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        userId,
        title,
        metadata: {
          source: 'academic_intelligence_v2',
          synced_at: new Date().toISOString(),
          prediction_layer: true
        }
      })
    }).catch(e => console.error("[Sync] Background failure:", e.message));
  } catch (e) { }
}

export async function analyzePerformance(input: z.infer<typeof PerformanceInputSchema>) {
  return performanceFlow(input);
}

const performanceFlow = ai.defineFlow(
  {
    name: 'performanceFlow',
    inputSchema: PerformanceInputSchema,
    outputSchema: PerformanceOutputSchema,
  },
  async input => {
    // Intelligence Preparation
    const contextStr = `
      GOAL: ${input.goal || 'Undefined Path'}
      TIMELINE: ${input.timeline || 'Unconstrained'}
      SELF-ASSESSMENT: ${input.selfAssessment || 'None Provided'}
      PORTFOLIO: ${input.portfolio || 'N/A'}
      DOCS: ${input.documents?.length || 0} files detected.
      LINKS: ${input.studyLinks?.join(', ') || 'N/A'}
    `;

    try {
      const { output } = await generateWithGeminiCycle({
        system: SYSTEM_PROMPT,
        prompt: `Execute Multi-Phase Final Intelligence Scan for user: ${input.userId || 'Guest'}.
                 Raw Intel Data: ${contextStr}`,
        output: { schema: PerformanceOutputSchema }
      });

      const finalResult = output!;

      // Phase 2 Sync: Persist the intelligence to the global Knowledge Base
      if (input.userId && finalResult.summary) {
        const syncPayload = `
          [ACADEMIC PROFILE]
          Summary: ${finalResult.summary}
          Readiness: ${finalResult.readinessScore}%
          
          [SKILL GRAPH]
          Identified: ${finalResult.profile.inferred_skills.join(', ')}
          Weakness: ${finalResult.profile.probable_weak_areas.join(', ')}
          
          [STRATEGIC ACTION PLAN]
          ${finalResult.actionPlan}
        `;

        syncToKnowledgeMap(
          syncPayload,
          input.userId,
          `Master Intel: ${input.goal || 'Academic Baseline'}`
        );
      }

      return finalResult;
    } catch (err) {
      console.error("[Performance Engine] Pipeline Overflow:", err);
      // Phase 5: Resilience Fallback
      return {
        profile: {
          inferred_skills: ["Foundational Learning"],
          probable_weak_areas: ["Contextual Complexity"],
          learning_intent: "Baseline Stabilization",
          confidence_level: "Fallback"
        },
        prediction: {
          performance_forecast: "System capacity exceeded. Using safe-state trajectory.",
          risk_level: "medium",
          retention_probability: "65%"
        },
        readinessScore: "50",
        summary: "Autonomous intelligence engine is re-calibrating. Base report generated.",
        keyInsights: ["Neural Link Unstable", "Partial Data Processing"],
        riskAnalysis: ["Analysis accuracy reduced during peak load"],
        skillGaps: "Awaiting stabilization for deep-scan results.",
        actionPlan: "Maintain consistency in base study hours until the high-order nodes synchronize.",
        missingDataSuggestions: ["Retry deep-scan in 60 seconds"],
        availableData: { studyLinks: "Yes", documents: "N/A", portfolio: "N/A", goal: "Yes", timeline: "Yes", selfAssessment: "Yes" }
      };
    }
  }
);
