"use server";

import { getPollAnalytics } from "@/lib/actions/analytics";

/** Helper to execute direct server-side REST call to Gemini 2.5 Flash */
async function callGemini(prompt: string, responseMimeType?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  if (responseMimeType) {
    body.generationConfig = {
      responseMimeType,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("No text returned from Gemini API.");
  }

  return text;
}

export interface AiPollResult {
  ok: boolean;
  question?: string;
  options?: string[];
  type?: "single" | "multiple" | "rating" | "scale" | "reactions" | "ranking" | "text";
  error?: string;
}

/** Generates a complete poll object from a topic prompt using Gemini */
export async function generateAiPollAction(prompt: string): Promise<AiPollResult> {
  if (!prompt || !prompt.trim()) {
    return { ok: false, error: "Prompt cannot be empty." };
  }

  try {
    const promptText = `
You are an expert poll designer. Based on the user topic/prompt, generate a highly engaging poll in JSON format.

Topic: "${prompt}"

Generate a JSON object matching this schema exactly:
{
  "question": "Engaging poll question text",
  "options": ["Option 1", "Option 2", ...],
  "type": "single" | "multiple" | "rating" | "scale" | "reactions" | "ranking" | "text"
}

Rules:
1. "options" must contain 2 to 6 options, EXCEPT when "type" is:
   - "rating": (options must be empty array [])
   - "scale": (options must be empty array [])
   - "reactions": (options must be empty array [])
   - "text": (options must be empty array [])
2. Choose the most natural poll type for the topic.
3. Keep the JSON valid and return ONLY the JSON object.
`;

    const rawResponse = await callGemini(promptText, "application/json");
    const parsed = JSON.parse(rawResponse.trim());

    return {
      ok: true,
      question: parsed.question,
      options: parsed.options || [],
      type: parsed.type || "single",
    };
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message === "GEMINI_API_KEY_MISSING") {
      return { ok: false, error: "GEMINI_API_KEY_MISSING" };
    }
    console.error("AI Generation failed:", err);
    return { ok: false, error: err.message || "Failed to generate AI poll." };
  }
}

export interface AiSummaryResult {
  ok: boolean;
  winnerSummary?: string;
  trendsSummary?: string;
  commentsClustering?: string[];
  error?: string;
}

/** Generates analytical insights for a poll using Gemini */
export async function generatePollSummaryAction(
  slug: string,
  adminToken?: string,
  sessionToken?: string,
): Promise<AiSummaryResult> {
  try {
    // Re-use current analytics loader
    const analytics = await getPollAnalytics(slug, adminToken, sessionToken);
    if (!analytics.ok || !analytics.poll || !analytics.options || !analytics.votes) {
      return { ok: false, error: analytics.error || "Could not retrieve analytics data." };
    }

    const { poll, options, votes } = analytics;

    // Calculate metrics
    const totalVotes = votes.length;
    const views = poll.views ?? 0;
    const uniqueVoters = new Set(votes.map(v => v.voter_id).filter(Boolean));
    const uniqueCount = uniqueVoters.size || totalVotes;
    const completionRate = views > 0 ? ((uniqueCount / views) * 100).toFixed(1) : "0";

    const durationVotes = votes.filter(v => v.vote_duration_ms);
    const avgDuration = durationVotes.length
      ? (durationVotes.reduce((sum, v) => sum + (v.vote_duration_ms ?? 0), 0) / durationVotes.length / 1000).toFixed(1)
      : "N/A";

    const counts: Record<string, number> = {};
    options.forEach(o => { counts[o.id] = 0; });
    votes.forEach(v => {
      counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
    });

    const optionsText = options
      .map(o => `- "${o.text}": ${counts[o.id] ?? 0} votes (${totalVotes > 0 ? (((counts[o.id] ?? 0) / totalVotes) * 100).toFixed(0) : 0}%)`)
      .join("\n");

    const textResponses = votes
      .map(v => v.text_response)
      .filter((v): v is string => typeof v === "string" && v.trim() !== "");

    const textResponsesText = textResponses.length
      ? `Voter commentary replies:\n${textResponses.map(r => `* "${r}"`).join("\n")}`
      : "No open-ended voter comments submitted.";

    const promptText = `
You are a data analyst for SwiftPoll. Analyze these poll results and generate a concise summary in JSON format.

Poll Question: "${poll.question}"
Poll Type: "${poll.type}"
Total Views: ${views}
Total Votes Registered: ${totalVotes}
Voter Completion Rate: ${completionRate}%
Average Response Time: ${avgDuration} seconds

Choice Tally breakdown:
${optionsText}

${textResponsesText}

Generate a JSON object matching this schema exactly:
{
  "winnerSummary": "A 1-2 sentence overview explaining the winning option, its vote count, and how it compared to runners-up.",
  "trendsSummary": "A 1-2 sentence observation about turnout views, response speed, or other notable activity metrics.",
  "commentsClustering": ["Cluster grouping 1", "Cluster grouping 2", ...]
}

Rules:
1. Keep the insights objective and helpful.
2. "commentsClustering" should summarize voter comments into 2 to 4 bullet points (leave empty array [] if there are no comments).
3. Return ONLY valid JSON matching the schema.
`;

    const rawResponse = await callGemini(promptText, "application/json");
    const parsed = JSON.parse(rawResponse.trim());

    return {
      ok: true,
      winnerSummary: parsed.winnerSummary,
      trendsSummary: parsed.trendsSummary,
      commentsClustering: parsed.commentsClustering || [],
    };
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message === "GEMINI_API_KEY_MISSING") {
      return { ok: false, error: "GEMINI_API_KEY_MISSING" };
    }
    console.error("AI Summarizer failed:", err);
    return { ok: false, error: err.message || "Failed to generate AI insights." };
  }
}
