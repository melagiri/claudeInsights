import { format as formatDate } from 'date-fns';
import type { Session, Insight } from '../types';

export type ExportFormat = 'plain' | 'obsidian' | 'notion';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  groupByType?: boolean;
}

/**
 * Export sessions and insights to markdown
 */
export function exportToMarkdown(
  sessions: Session[],
  insights: Insight[],
  options: ExportOptions
): string {
  const { format: exportFormat, includeMetadata = true, groupByType = true } = options;

  let content = '';

  // Title
  content += formatTitle('ClaudeInsight Export', exportFormat);
  content += `\nExported on ${formatDate(new Date(), 'MMMM d, yyyy h:mm a')}\n\n`;

  // Summary
  content += formatHeading('Summary', 2, exportFormat);
  content += `- **Sessions:** ${sessions.length}\n`;
  content += `- **Insights:** ${insights.length}\n`;
  content += `- **Summaries:** ${insights.filter((i) => i.type === 'summary').length}\n`;
  content += `- **Decisions:** ${insights.filter((i) => i.type === 'decision').length}\n`;
  content += `- **Learnings:** ${insights.filter((i) => i.type === 'learning').length}\n`;
  content += `- **Techniques:** ${insights.filter((i) => i.type === 'technique').length}\n\n`;

  // Insights
  content += formatHeading('Insights', 2, exportFormat);

  if (groupByType) {
    // Group by type
    const summaries = insights.filter((i) => i.type === 'summary');
    const decisions = insights.filter((i) => i.type === 'decision');
    const learnings = insights.filter((i) => i.type === 'learning');
    const techniques = insights.filter((i) => i.type === 'technique');

    if (summaries.length > 0) {
      content += formatHeading('Summaries', 3, exportFormat);
      content += formatInsightList(summaries, exportFormat, includeMetadata);
    }

    if (decisions.length > 0) {
      content += formatHeading('Decisions', 3, exportFormat);
      content += formatInsightList(decisions, exportFormat, includeMetadata);
    }

    if (learnings.length > 0) {
      content += formatHeading('Learnings', 3, exportFormat);
      content += formatInsightList(learnings, exportFormat, includeMetadata);
    }

    if (techniques.length > 0) {
      content += formatHeading('Techniques', 3, exportFormat);
      content += formatInsightList(techniques, exportFormat, includeMetadata);
    }
  } else {
    // Chronological
    const sortedInsights = [...insights].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    content += formatInsightList(sortedInsights, exportFormat, includeMetadata);
  }

  // Sessions
  content += formatHeading('Sessions', 2, exportFormat);
  for (const session of sessions) {
    content += formatSession(session, exportFormat, includeMetadata);
  }

  return content;
}

/**
 * Export a single session to markdown
 */
export function exportSessionToMarkdown(
  session: Session,
  insights: Insight[],
  options: ExportOptions
): string {
  const { format: exportFormat, includeMetadata = true } = options;

  let content = '';

  // Title
  content += formatTitle(session.summary || 'Session', exportFormat);
  content += `\n${session.projectName} | ${formatDate(session.startedAt, 'MMMM d, yyyy')}\n\n`;

  // Metadata
  if (includeMetadata) {
    content += formatHeading('Details', 2, exportFormat);
    content += `- **Duration:** ${Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)} minutes\n`;
    content += `- **Messages:** ${session.messageCount}\n`;
    content += `- **Tool Calls:** ${session.toolCallCount}\n`;
    if (session.gitBranch) {
      content += `- **Branch:** ${session.gitBranch}\n`;
    }
    content += '\n';
  }

  // Insights
  if (insights.length > 0) {
    content += formatHeading('Insights', 2, exportFormat);
    content += formatInsightList(insights, exportFormat, includeMetadata);
  }

  return content;
}

/**
 * Export daily digest to markdown
 */
export function exportDailyDigest(
  date: Date,
  sessions: Session[],
  insights: Insight[],
  options: ExportOptions
): string {
  const { format: exportFormat } = options;

  let content = '';

  // Title
  content += formatTitle(`Daily Digest - ${formatDate(date, 'MMMM d, yyyy')}`, exportFormat);
  content += '\n';

  // Summary
  content += `**${sessions.length}** sessions | **${insights.length}** insights\n\n`;

  // What you worked on
  const projects = [...new Set(sessions.map((s) => s.projectName))];
  content += formatHeading('Projects', 2, exportFormat);
  for (const project of projects) {
    const projectSessions = sessions.filter((s) => s.projectName === project);
    content += `- **${project}**: ${projectSessions.length} sessions\n`;
  }
  content += '\n';

  // Session summaries
  const summaries = insights.filter((i) => i.type === 'summary');
  if (summaries.length > 0) {
    content += formatHeading('Session Summaries', 2, exportFormat);
    for (const summary of summaries) {
      content += `- ${summary.title}\n`;
    }
    content += '\n';
  }

  // Key decisions
  const decisions = insights.filter((i) => i.type === 'decision');
  if (decisions.length > 0) {
    content += formatHeading('Decisions Made', 2, exportFormat);
    for (const decision of decisions) {
      content += `- ${decision.title}\n`;
    }
    content += '\n';
  }

  // Learnings
  const learnings = insights.filter((i) => i.type === 'learning');
  if (learnings.length > 0) {
    content += formatHeading('Things Learned', 2, exportFormat);
    for (const learning of learnings) {
      content += `- ${learning.title}\n`;
    }
    content += '\n';
  }

  // Techniques
  const techniques = insights.filter((i) => i.type === 'technique');
  if (techniques.length > 0) {
    content += formatHeading('Techniques Used', 2, exportFormat);
    for (const technique of techniques) {
      content += `- ${technique.title}\n`;
    }
    content += '\n';
  }

  return content;
}

// Helper functions

function formatTitle(text: string, format: ExportFormat): string {
  if (format === 'notion') {
    return `# ${text}\n`;
  }
  return `# ${text}\n`;
}

function formatHeading(text: string, level: number, format: ExportFormat): string {
  const prefix = '#'.repeat(level);
  if (format === 'obsidian') {
    return `\n${prefix} ${text}\n\n`;
  }
  return `\n${prefix} ${text}\n\n`;
}

function formatInsightList(
  insights: Insight[],
  format: ExportFormat,
  includeMetadata: boolean
): string {
  let content = '';

  for (const insight of insights) {
    if (format === 'obsidian') {
      // Obsidian callout format
      const calloutType = insight.type === 'summary' ? 'summary' : insight.type === 'decision' ? 'info' : insight.type === 'learning' ? 'tip' : 'note';
      content += `> [!${calloutType}] ${insight.title}\n`;
      content += `> ${insight.content.replace(/\n/g, '\n> ')}\n`;
      if (includeMetadata) {
        content += `> \n> *${insight.projectName} | ${formatDate(insight.timestamp, 'MMM d, yyyy')}*\n`;
      }
      content += '\n';
    } else if (format === 'notion') {
      // Notion toggle format
      content += `<details>\n<summary>${insight.title}</summary>\n\n`;
      content += `${insight.content}\n\n`;
      if (includeMetadata) {
        content += `*${insight.projectName} | ${formatDate(insight.timestamp, 'MMM d, yyyy')}*\n`;
      }
      content += `</details>\n\n`;
    } else {
      // Plain markdown
      content += `### ${insight.title}\n\n`;
      content += `${insight.content}\n\n`;
      if (includeMetadata) {
        content += `*${insight.projectName} | ${formatDate(insight.timestamp, 'MMM d, yyyy')}*\n\n`;
      }
      content += '---\n\n';
    }
  }

  return content;
}

function formatSession(
  session: Session,
  format: ExportFormat,
  includeMetadata: boolean
): string {
  let content = '';

  if (format === 'obsidian') {
    content += `### [[${session.summary || 'Session'}]]\n`;
  } else {
    content += `### ${session.summary || 'Session'}\n`;
  }

  content += `\n${session.projectName} | ${formatDate(session.startedAt, 'MMM d, yyyy h:mm a')}\n`;

  if (includeMetadata) {
    const duration = Math.round(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000
    );
    content += `\n- Duration: ${duration} min\n`;
    content += `- Messages: ${session.messageCount}\n`;
    content += `- Tool Calls: ${session.toolCallCount}\n`;
  }

  content += '\n';

  return content;
}
