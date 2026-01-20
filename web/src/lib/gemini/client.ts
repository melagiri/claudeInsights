import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Session, Insight } from '../types';

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize or get Gemini client
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (genAI) return genAI;

  const apiKey = localStorage.getItem('claudeinsight_gemini_key');
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Add it in Settings.');
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!localStorage.getItem('claudeinsight_gemini_key');
}

/**
 * Enhance a session with Gemini-powered analysis
 */
export async function enhanceSession(session: Session): Promise<{
  enhancedSummary: string;
  keyDecisions: string[];
  learnings: string[];
  suggestedActions: string[];
}> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this Claude Code session and provide insights:

Session: ${session.summary || 'No summary available'}
Project: ${session.projectName}
Duration: ${Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)} minutes
Messages: ${session.messageCount}
Tool Calls: ${session.toolCallCount}

Provide your analysis in the following JSON format:
{
  "enhancedSummary": "A concise 2-3 sentence summary of what was accomplished",
  "keyDecisions": ["List of key architectural or implementation decisions made"],
  "learnings": ["List of new things learned or patterns discovered"],
  "suggestedActions": ["List of follow-up actions or improvements to consider"]
}

Only respond with valid JSON, no other text.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      enhancedSummary: 'Unable to generate enhanced summary.',
      keyDecisions: [],
      learnings: [],
      suggestedActions: [],
    };
  }
}

/**
 * Generate a daily digest using Gemini
 */
export async function generateDailyDigest(
  sessions: Session[],
  insights: Insight[],
  date: Date
): Promise<{
  summary: string;
  highlights: string[];
  productivity: string;
  suggestions: string[];
}> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const sessionSummaries = sessions.map((s) => ({
    project: s.projectName,
    summary: s.summary,
    duration: Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60000),
    messages: s.messageCount,
  }));

  const insightSummaries = insights.map((i) => ({
    type: i.type,
    title: i.title,
    project: i.projectName,
  }));

  const prompt = `Generate a daily digest for ${date.toDateString()}:

Sessions (${sessions.length}):
${JSON.stringify(sessionSummaries, null, 2)}

Insights (${insights.length}):
${JSON.stringify(insightSummaries, null, 2)}

Provide your analysis in the following JSON format:
{
  "summary": "A 2-3 sentence overview of the day's work",
  "highlights": ["Key accomplishments from today"],
  "productivity": "Brief assessment of productivity and focus",
  "suggestions": ["Suggestions for tomorrow or follow-up items"]
}

Only respond with valid JSON, no other text.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      summary: 'Unable to generate daily digest.',
      highlights: [],
      productivity: 'Unknown',
      suggestions: [],
    };
  }
}

/**
 * Extract deeper insights from a conversation
 */
export async function extractDeepInsights(
  sessionSummary: string,
  existingInsights: Insight[]
): Promise<{
  decisions: Array<{ title: string; reasoning: string; alternatives?: string }>;
  learnings: Array<{ title: string; context: string }>;
  patterns: string[];
}> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const existingTitles = existingInsights.map((i) => i.title).join(', ');

  const prompt = `Analyze this session and extract deep insights that go beyond the basics:

Session Summary: ${sessionSummary}

Already Extracted: ${existingTitles || 'None'}

Find:
1. Technical decisions with reasoning and alternatives considered
2. Learnings that could be applied to other projects
3. Patterns in how problems were approached

Provide your analysis in the following JSON format:
{
  "decisions": [
    {"title": "Decision title", "reasoning": "Why this was chosen", "alternatives": "What else was considered"}
  ],
  "learnings": [
    {"title": "What was learned", "context": "When/why this is useful"}
  ],
  "patterns": ["Recurring patterns or approaches observed"]
}

Only respond with valid JSON, no other text.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      decisions: [],
      learnings: [],
      patterns: [],
    };
  }
}
