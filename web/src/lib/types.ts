// Shared types for ClaudeInsight web app

export interface Project {
  id: string;
  name: string;
  path: string;
  sessionCount: number;
  lastActivity: Date;
  createdAt: Date;
  // Multi-device support fields
  gitRemoteUrl: string | null;
  projectIdSource: 'git-remote' | 'path-hash';
}

export interface Session {
  id: string;
  projectId: string;
  projectName: string;
  projectPath: string;
  summary: string | null;
  // New title fields
  generatedTitle: string | null;
  titleSource: 'claude' | 'user_message' | 'insight' | 'character' | 'fallback' | null;
  sessionCharacter: 'deep_focus' | 'bug_hunt' | 'feature_build' | 'exploration' | 'refactor' | 'learning' | 'quick_task' | null;
  startedAt: Date;
  endedAt: Date;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  toolCallCount: number;
  gitBranch: string | null;
  claudeVersion: string | null;
  syncedAt: Date;
  // Multi-device support fields
  gitRemoteUrl: string | null;
  deviceId: string | null;
  deviceHostname: string | null;
  devicePlatform: string | null;
}

export type InsightType = 'summary' | 'decision' | 'learning' | 'technique';
export type InsightScope = 'session' | 'project' | 'overall';

export interface Insight {
  id: string;
  sessionId: string;
  projectId: string;
  projectName: string;
  type: InsightType;
  title: string;
  content: string;
  summary: string;
  bullets: string[];
  confidence: number;
  source: 'llm';
  metadata: InsightMetadata;
  timestamp: Date;
  createdAt: Date;
  scope: InsightScope;
  analysisVersion: string;
}

export interface InsightMetadata {
  alternatives?: string[];
  reasoning?: string;
  context?: string;
  applicability?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls: ToolCall[];
  timestamp: Date;
  parentId: string | null;
}

export interface ToolCall {
  name: string;
  input: string;
}

// Filter types
export interface SessionFilters {
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface InsightFilters {
  projectId?: string;
  sessionId?: string;
  type?: InsightType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Analytics types
export interface DailyStats {
  date: string;
  sessionCount: number;
  messageCount: number;
  insightCount: number;
}

export interface ProjectStats {
  projectId: string;
  projectName: string;
  sessionCount: number;
  totalDuration: number;
  insightCounts: {
    summary: number;
    decision: number;
    learning: number;
    technique: number;
  };
}
