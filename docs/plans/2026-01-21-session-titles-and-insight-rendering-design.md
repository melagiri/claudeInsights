# Session Titles & Insight Rendering Improvements

> Design document for Code Insights UX improvements
> Created: 2026-01-21

---

## Problem Statement

### 1. Session Titles
Most sessions display as "Untitled Session" because Claude Code's native `summary` field is frequently empty. This makes the session list uninformative and hard to navigate.

### 2. Insight Rendering
Insights captured from Claude Code contain raw terminal formatting (`★ Insight`, `**bold**`, escape characters) that displays as garbled text in the web UI instead of clean, structured content.

---

## Solution: Smart Session Titles

### Architecture

**Where:** CLI during sync (computed once, stored in Firestore)

**New fields on session document:**
```typescript
{
  // Existing
  summary: string | null;          // Claude Code's native summary

  // New
  generatedTitle: string | null;   // Our computed title
  titleSource: 'claude' | 'user_message' | 'insight' | 'character' | 'fallback';
  sessionCharacter: SessionCharacter | null;
}

type SessionCharacter =
  | 'deep_focus'    // 50+ messages, concentrated file work
  | 'bug_hunt'      // Error patterns + fixes
  | 'feature_build' // Multiple new files created
  | 'exploration'   // Heavy Read/Grep, few edits
  | 'refactor'      // Many edits, same file count
  | 'learning'      // Questions and explanations
  | 'quick_task';   // <10 messages, completed
```

**Display logic in web UI:**
```typescript
const displayTitle = session.summary || session.generatedTitle || 'Untitled Session';
```

### Title Generation Pipeline

```
┌─────────────────┐
│  ParsedSession  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  1. Check Claude Code summary                        │
│     → If exists and meaningful, use it (score 100)  │
└────────┬────────────────────────────────────────────┘
         │ (empty or null)
         ▼
┌─────────────────────────────────────────────────────┐
│  2. Extract title candidates                         │
│     → First user message                            │
│     → Decision insights                             │
│     → Workitem insights with context                │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  3. Score each candidate (0-100)                    │
│     → Apply specificity rules                       │
│     → Select highest scoring (threshold ≥40)        │
└────────┬────────────────────────────────────────────┘
         │ (no candidate meets threshold)
         ▼
┌─────────────────────────────────────────────────────┐
│  4. Detect session character                         │
│     → Analyze tool patterns, message ratios         │
│     → Generate template-based title                 │
└────────┬────────────────────────────────────────────┘
         │ (no clear character)
         ▼
┌─────────────────────────────────────────────────────┐
│  5. Fallback                                         │
│     → "{projectName} session ({messageCount} msgs)" │
└─────────────────────────────────────────────────────┘
```

### Specificity Scoring Rules

| Source | Condition | Score |
|--------|-----------|-------|
| **User message** | Contains action verb + noun ("fix the auth bug") | 80 |
| **User message** | Question about specific topic | 70 |
| **User message** | Short but meaningful (5-15 words) | 60 |
| **User message** | Too short (<5 words) or generic ("yes", "continue", "ok") | 0 |
| **User message** | Too long (>50 words) - truncate and penalize | 20 |
| **Insight (decision)** | Has clear subject ("Use JWT over sessions") | 85 |
| **Insight (workitem)** | Specific file/feature context | 75 |
| **Insight (workitem)** | Generic ("Feature: 1 file modified") | 10 |
| **Insight (learning)** | Concrete lesson | 65 |

**Skip patterns (score = 0):**
- Single words: "yes", "no", "ok", "sure", "thanks", "continue"
- Fragments: starts with lowercase, no verb
- Pure code blocks
- Very long (>100 words)

### Session Character Detection

```typescript
function detectSessionCharacter(session: ParsedSession): SessionCharacter | null {
  const { messages, toolCallCount, messageCount } = session;

  // Analyze tool call distribution
  const toolCounts = countToolsByType(messages);
  const fileOperations = toolCounts.Edit + toolCounts.Write;
  const readOperations = toolCounts.Read + toolCounts.Grep + toolCounts.Glob;
  const uniqueFilesModified = getUniqueFilesModified(messages);
  const newFilesCreated = countNewFiles(messages);

  // Detection rules
  if (messageCount >= 50 && uniqueFilesModified.size <= 3) {
    return 'deep_focus';
  }
  if (hasErrorPatterns(messages) && hasFixCommit(messages)) {
    return 'bug_hunt';
  }
  if (newFilesCreated >= 3) {
    return 'feature_build';
  }
  if (readOperations > fileOperations * 3 && fileOperations < 5) {
    return 'exploration';
  }
  if (fileOperations > 10 && newFilesCreated === 0) {
    return 'refactor';
  }
  if (hasLearningPatterns(messages) && toolCallCount < messageCount) {
    return 'learning';
  }
  if (messageCount < 10 && fileOperations > 0) {
    return 'quick_task';
  }

  return null;
}
```

### Character-Based Title Templates

| Character | Template | Example |
|-----------|----------|---------|
| `deep_focus` | "Deep work: {primary_file}" | "Deep work: auth/middleware.ts" |
| `bug_hunt` | "Fixed: {bug_description}" | "Fixed: login timeout issue" |
| `feature_build` | "Built: {feature_name}" | "Built: user settings page" |
| `exploration` | "Explored: {topic}" | "Explored: authentication patterns" |
| `refactor` | "Refactored: {area}" | "Refactored: API layer" |
| `learning` | "Learned: {concept}" | "Learned: React hooks" |
| `quick_task` | "{verb}: {object}" | "Updated: README.md" |

### Title Cleanup Rules

Before storing, apply cleanup:
1. Remove leading "Help me", "Can you", "Please"
2. Capitalize first letter
3. Truncate to 60 characters (with ellipsis if needed)
4. Strip markdown formatting
5. Collapse whitespace

```typescript
function cleanTitle(raw: string): string {
  return raw
    .replace(/^(help me|can you|please|i want to|i need to)\s+/i, '')
    .replace(/[*_`#]/g, '')           // Strip markdown
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .trim()
    .slice(0, 60)
    .replace(/^./, c => c.toUpperCase())  // Capitalize
    + (raw.length > 60 ? '...' : '');
}
```

---

## Solution: Structured Insight Parsing

### Problem Analysis

Claude Code outputs insights with terminal formatting:
```
★ Insight ─────────────────────────────────
Parallel Agent Efficiency:
- TA and PM worked simultaneously because their tasks had no dependencies
- TA created DB schema while PM updated Jira/ceremony docs
```

Current parser captures this as raw text, causing:
- `★ Insight` appearing in titles
- Escape sequences like `s\"."`
- Raw markdown `**bold**` showing literally
- Truncated mid-content

### New Insight Structure

```typescript
interface StructuredInsight {
  id: string;
  sessionId: string;
  projectId: string;

  // Clean, parsed fields
  type: 'decision' | 'learning' | 'workitem' | 'effort';
  title: string;           // Cleaned, no formatting
  summary: string;         // First line/sentence, cleaned
  bullets: string[];       // Parsed bullet points
  rawContent: string;      // Original for reference

  // Metadata
  confidence: number;
  source: 'pattern' | 'llm' | 'claude_insight';
  timestamp: Date;
}
```

### Insight Parsing Pipeline

```typescript
function parseInsightContent(raw: string): ParsedInsightContent {
  // 1. Detect if it's a Claude Code formatted insight
  const isClaudeInsight = raw.includes('★ Insight') || raw.includes('★Insight');

  if (isClaudeInsight) {
    return parseClaudeFormattedInsight(raw);
  }

  // 2. Otherwise use existing pattern matching
  return parsePatternMatchedInsight(raw);
}

function parseClaudeFormattedInsight(raw: string): ParsedInsightContent {
  // Remove the ★ Insight header and decorative lines
  const cleaned = raw
    .replace(/★\s*Insight\s*─+/g, '')
    .replace(/─+/g, '')
    .trim();

  // Extract title (first line, often bold)
  const lines = cleaned.split('\n').filter(l => l.trim());
  const titleLine = lines[0] || '';
  const title = titleLine
    .replace(/\*\*/g, '')      // Remove bold markers
    .replace(/:$/, '')          // Remove trailing colon
    .trim();

  // Extract bullets
  const bullets = lines
    .slice(1)
    .filter(l => l.trim().startsWith('-'))
    .map(l => l.replace(/^-\s*/, '').trim());

  // Summary is title + first bullet (if exists)
  const summary = bullets.length > 0
    ? `${title}: ${bullets[0]}`
    : title;

  return { title, summary, bullets, rawContent: raw };
}
```

### Web UI Rendering

**InsightCard component updates:**

```tsx
function InsightCard({ insight }: { insight: StructuredInsight }) {
  return (
    <Card>
      <CardHeader>
        <Badge>{insight.type}</Badge>
        <CardTitle>{insight.title}</CardTitle>
        <p className="text-muted-foreground">{insight.projectName}</p>
      </CardHeader>
      <CardContent>
        {insight.bullets.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {insight.bullets.slice(0, 3).map((bullet, i) => (
              <li key={i} className="text-sm">{bullet}</li>
            ))}
            {insight.bullets.length > 3 && (
              <li className="text-sm text-muted-foreground">
                +{insight.bullets.length - 3} more...
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm">{insight.summary}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Plan

### Phase 1: Session Titles (CLI)
1. Add `generateTitle()` function in `/cli/src/parser/titles.ts`
2. Add `detectSessionCharacter()` function
3. Integrate into `buildSession()` in jsonl.ts
4. Update Firestore schema to include new fields
5. Add `--regenerate-titles` flag to sync command

### Phase 2: Insight Parsing (CLI)
1. Add `parseInsightContent()` in `/cli/src/parser/insights.ts`
2. Update insight extraction to produce structured output
3. Migrate existing insights on next sync

### Phase 3: Web UI Updates
1. Update `SessionCard` to use new title fields
2. Update `InsightCard` to render structured content
3. Add insight type icons and better visual hierarchy

### Phase 4: Enhancement (Optional)
1. "Enhance titles" button using Gemini
2. Batch processing for historical sessions
3. User can manually edit titles in UI

---

## Success Criteria

- [ ] <5% of sessions show "Untitled Session"
- [ ] Session list tells a clear story of work done
- [ ] Insights render cleanly without raw formatting
- [ ] Titles are consistent and scannable
- [ ] No performance regression on sync

---

## Open Questions

1. **Migration:** Re-process all existing sessions on upgrade, or only new ones?
   - Recommendation: Add `--regenerate-titles` flag, let user choose

2. **Title editing:** Should users be able to manually override titles?
   - Recommendation: Yes, add `customTitle` field that takes precedence

3. **Character badges:** Show session character as a badge in the UI?
   - Recommendation: Yes, adds useful context at a glance
