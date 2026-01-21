import type { ParsedSession, ParsedMessage, Insight, InsightMetadata, ParsedInsightContent } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export function parseInsightContent(raw: string): ParsedInsightContent {
  const isClaudeInsight = raw.includes('★ Insight') || raw.includes('★Insight');
  if (isClaudeInsight) {
    return parseClaudeFormattedInsight(raw);
  }
  return parseGenericContent(raw);
}

function parseClaudeFormattedInsight(raw: string): ParsedInsightContent {
  let cleaned = raw.replace(/★\s*Insight\s*─*/g, '').replace(/─+/g, '').replace(/\*\*/g, '').trim();
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
  const title = (lines[0] || '').replace(/:$/, '').trim();
  const bullets = lines.slice(1).filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim());
  const summary = bullets.length > 0 ? `${title}: ${bullets[0]}` : title;
  return { title, summary, bullets, rawContent: raw };
}

function parseGenericContent(raw: string): ParsedInsightContent {
  let cleaned = raw.replace(/\*\*/g, '').replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l);
  const title = truncate(lines[0] || cleaned, 100);
  const bullets = lines.slice(1).filter(l => l.startsWith('-') || l.startsWith('•')).map(l => l.replace(/^[-•]\s*/, '').trim());
  return { title, summary: title, bullets, rawContent: raw };
}

// Pattern matching rules for different insight types
const DECISION_PATTERNS = [
  /decided to (.+)/i,
  /chose (.+) over (.+)/i,
  /went with (.+) because (.+)/i,
  /trade-off:?\s*(.+)/i,
  /approach:?\s*(.+)/i,
  /\*\*decision\*\*:?\s*(.+)/i,
  /we('ll| will) use (.+) (for|to|because)/i,
  /let's go with (.+)/i,
  /the (best|right|better) (approach|solution|choice) is (.+)/i,
];

const LEARNING_PATTERNS = [
  /learned that (.+)/i,
  /TIL:?\s*(.+)/i,
  /insight:?\s*(.+)/i,
  /realized (.+)/i,
  /mistake:?\s*(.+)/i,
  /note to self:?\s*(.+)/i,
  /important:?\s*(.+)/i,
  /remember:?\s*(.+)/i,
  /turns out (.+)/i,
  /didn't know (.+)/i,
];

const WORKITEM_SIGNALS = {
  feature: ['added', 'implemented', 'created', 'built', 'new feature', 'introducing'],
  bugfix: ['fixed', 'resolved', 'patched', 'corrected', 'bug fix', 'fixing'],
  refactor: ['refactored', 'restructured', 'reorganized', 'cleaned', 'improved', 'simplified'],
  docs: ['documented', 'documentation', 'readme', 'comments', 'jsdoc'],
  test: ['tested', 'test', 'spec', 'coverage', 'unit test', 'integration test'],
};

const WORK_TOOLS = ['Edit', 'Write', 'Bash'];

/**
 * Extract insights from a parsed session using pattern matching
 */
export function extractInsights(session: ParsedSession): Insight[] {
  const insights: Insight[] = [];
  const projectId = generateProjectId(session.projectPath);

  // Extract from assistant messages
  for (const message of session.messages) {
    if (message.type === 'assistant') {
      // Check for decisions
      const decisions = extractDecisions(message, session, projectId);
      insights.push(...decisions);

      // Check for learnings
      const learnings = extractLearnings(message, session, projectId);
      insights.push(...learnings);

      // Check for work items from tool calls
      const workItems = extractWorkItems(message, session, projectId);
      insights.push(...workItems);
    }
  }

  // Add effort insight for the session
  const effortInsight = createEffortInsight(session, projectId);
  if (effortInsight) {
    insights.push(effortInsight);
  }

  return insights;
}

/**
 * Extract decision insights from a message
 */
function extractDecisions(
  message: ParsedMessage,
  session: ParsedSession,
  projectId: string
): Insight[] {
  const insights: Insight[] = [];
  const content = message.content;

  for (const pattern of DECISION_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      const extractedText = match[1] || match[0];

      // Get surrounding context (up to 200 chars)
      const matchIndex = content.indexOf(match[0]);
      const contextStart = Math.max(0, matchIndex - 100);
      const contextEnd = Math.min(content.length, matchIndex + match[0].length + 100);
      const context = content.slice(contextStart, contextEnd);

      insights.push({
        id: uuidv4(),
        sessionId: session.id,
        projectId,
        projectName: session.projectName,
        type: 'decision',
        title: truncate(extractedText, 100),
        content: context,
        summary: '',
        bullets: [],
        confidence: 0.7,
        source: 'pattern',
        metadata: {
          reasoning: extractedText,
        },
        timestamp: message.timestamp,
      });

      // Only extract first match per pattern to avoid duplicates
      break;
    }
  }

  return insights;
}

/**
 * Extract learning insights from a message
 */
function extractLearnings(
  message: ParsedMessage,
  session: ParsedSession,
  projectId: string
): Insight[] {
  const insights: Insight[] = [];
  const content = message.content;

  for (const pattern of LEARNING_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      const extractedText = match[1] || match[0];

      // Get surrounding context
      const matchIndex = content.indexOf(match[0]);
      const contextStart = Math.max(0, matchIndex - 100);
      const contextEnd = Math.min(content.length, matchIndex + match[0].length + 100);
      const context = content.slice(contextStart, contextEnd);

      insights.push({
        id: uuidv4(),
        sessionId: session.id,
        projectId,
        projectName: session.projectName,
        type: 'learning',
        title: truncate(extractedText, 100),
        content: context,
        summary: '',
        bullets: [],
        confidence: 0.6,
        source: 'pattern',
        metadata: {},
        timestamp: message.timestamp,
      });

      break;
    }
  }

  return insights;
}

/**
 * Extract work item insights from tool calls
 */
function extractWorkItems(
  message: ParsedMessage,
  session: ParsedSession,
  projectId: string
): Insight[] {
  const insights: Insight[] = [];

  // Check for file-modifying tool calls
  const fileEdits = message.toolCalls.filter((tc) => WORK_TOOLS.includes(tc.name));

  if (fileEdits.length === 0) {
    return insights;
  }

  // Extract files modified
  const files: string[] = [];
  for (const tc of fileEdits) {
    if (tc.name === 'Edit' || tc.name === 'Write') {
      const filePath = tc.input.file_path as string | undefined;
      if (filePath) {
        files.push(filePath);
      }
    }
  }

  if (files.length === 0) {
    return insights;
  }

  // Determine work type from message content
  const workType = determineWorkType(message.content);

  // Create a consolidated work item for this message
  insights.push({
    id: uuidv4(),
    sessionId: session.id,
    projectId,
    projectName: session.projectName,
    type: 'workitem',
    title: `${capitalizeFirst(workType)}: ${files.length} file(s) modified`,
    content: `Files: ${files.join(', ')}`,
    summary: '',
    bullets: [],
    confidence: 0.9,
    source: 'pattern',
    metadata: {
      files,
      workType,
    },
    timestamp: message.timestamp,
  });

  return insights;
}

/**
 * Create an effort insight for the session
 */
function createEffortInsight(session: ParsedSession, projectId: string): Insight | null {
  // Calculate session duration in minutes
  const durationMs = session.endedAt.getTime() - session.startedAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  if (durationMinutes < 1) {
    return null;
  }

  return {
    id: uuidv4(),
    sessionId: session.id,
    projectId,
    projectName: session.projectName,
    type: 'effort',
    title: `Session: ${durationMinutes} min, ${session.messageCount} messages`,
    content: `User: ${session.userMessageCount} messages, Assistant: ${session.assistantMessageCount} messages, Tool calls: ${session.toolCallCount}`,
    summary: '',
    bullets: [],
    confidence: 1.0,
    source: 'pattern',
    metadata: {
      duration: durationMinutes,
    },
    timestamp: session.startedAt,
  };
}

/**
 * Determine work type from message content
 */
function determineWorkType(
  content: string
): 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test' {
  const lowerContent = content.toLowerCase();

  for (const [workType, signals] of Object.entries(WORKITEM_SIGNALS)) {
    for (const signal of signals) {
      if (lowerContent.includes(signal)) {
        return workType as 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test';
      }
    }
  }

  return 'feature'; // Default
}

/**
 * Generate a stable project ID from path
 */
function generateProjectId(projectPath: string): string {
  // Create a simple hash from the path
  let hash = 0;
  for (let i = 0; i < projectPath.length; i++) {
    const char = projectPath.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `proj_${Math.abs(hash).toString(16)}`;
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
