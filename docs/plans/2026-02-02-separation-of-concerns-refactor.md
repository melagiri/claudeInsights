# CLI/Web Separation & Chat UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate CLI and Web into distinct concerns: CLI syncs sessions to Firestore (data collection), Web provides hosted dashboard with chat UI and LLM-driven insights (intelligence layer).

**Architecture:**
```
CLI (npm package)              Web (Vercel-hosted)
├── init                       ├── Firebase config via localStorage
├── sync → sessions + messages ├── Chat conversation UI (WhatsApp-style)
└── status                     ├── LLM insight generation (user's API key)
                               ├── Writes insights back to user's Firestore
                               └── Bulk actions (analyze multiple sessions)
```

**Tech Stack:**
- CLI: Node.js, Commander.js, Firebase Admin SDK
- Web: Next.js 16, React 19, Firebase Client SDK, Tailwind CSS 4, shadcn/ui
- LLM: Multi-provider (OpenAI, Anthropic, Gemini, Ollama) via user's API key

---

## Phase 1: CLI Simplification

### Task 1: Remove CLI `open` command

**Files:**
- Delete: `cli/src/commands/open.ts`
- Modify: `cli/src/index.ts`

**Step 1: Delete the open command file**

Delete the file `cli/src/commands/open.ts`

**Step 2: Remove open command from CLI index**

In `cli/src/index.ts`, remove lines:

```typescript
// DELETE these lines:
import { openCommand } from './commands/open.js';

// DELETE this block:
program
  .command('open')
  .description('Open the ClaudeInsight dashboard in your browser')
  .option('--url', 'Print the URL instead of opening browser')
  .action(openCommand);
```

**Step 3: Run build to verify**

Run: `cd cli && pnpm build`

Expected: Build succeeds without open command

**Step 4: Commit**

Commit message: "chore(cli): remove open command - web is hosted separately"

---

### Task 2: Remove CLI `insights` command

**Files:**
- Delete: `cli/src/commands/insights.ts`
- Modify: `cli/src/index.ts`
- Modify: `cli/src/firebase/client.ts` (remove getRecentInsights)

**Step 1: Delete the insights command file**

Delete the file `cli/src/commands/insights.ts`

**Step 2: Remove insights command from CLI index**

In `cli/src/index.ts`, remove:

```typescript
// DELETE:
import { insightsCommand } from './commands/insights.js';

// DELETE this block:
program
  .command('insights')
  .description('View recent insights from Firestore')
  .option('-t, --type <type>', 'Filter by insight type (summary, decision, learning, technique)')
  .option('-p, --project <name>', 'Filter by project name')
  .option('--today', 'Show only today\'s insights')
  .option('-l, --limit <number>', 'Number of insights to show', '20')
  .action((options) => {
    insightsCommand({
      type: options.type,
      project: options.project,
      today: options.today,
      limit: parseInt(options.limit, 10),
    });
  });
```

**Step 3: Remove getRecentInsights from firebase/client.ts**

Delete the `getRecentInsights` function and its related imports (`Insight`, `InsightType`).

**Step 4: Run build to verify**

Run: `cd cli && pnpm build`

**Step 5: Commit**

Commit message: "chore(cli): remove insights command - insights viewed via web"

---

### Task 3: Remove webConfig from CLI init

**Files:**
- Modify: `cli/src/commands/init.ts`
- Modify: `cli/src/types.ts` (remove webConfig from ClaudeInsightConfig)
- Modify: `cli/src/utils/config.ts`

**Step 1: Update ClaudeInsightConfig type in types.ts**

Remove `webConfig` and `dashboardUrl` fields:

```typescript
export interface ClaudeInsightConfig {
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  sync: {
    claudeDir: string;
    excludeProjects: string[];
  };
  // REMOVED: webConfig, dashboardUrl, gemini
}
```

**Step 2: Simplify init.ts**

Remove the webConfig prompts section (Firebase Web SDK config, dashboard URL). Keep only:
- Firebase Admin SDK credentials (service account)
- Sync settings (claudeDir, excludeProjects)

**Step 3: Update config.ts**

Remove any references to `webConfig` or `dashboardUrl`.

**Step 4: Build and test**

Run: `cd cli && pnpm build && node dist/index.js status`

**Step 5: Commit**

Commit message: "chore(cli): simplify init - remove web config (web is hosted)"

---

### Task 4: Verify messages are always synced

**Files:**
- Review: `cli/src/commands/sync.ts`

**Step 1: Verify current sync behavior**

Review sync.ts to confirm `uploadMessages(session)` is already called for every session (it is based on current code review).

**Step 2: No changes needed if already uploading messages**

Current implementation already uploads messages for every session.

---

### Task 5: Update CLI description and version

**Files:**
- Modify: `cli/src/index.ts`
- Modify: `cli/package.json`

**Step 1: Update CLI description**

In `cli/src/index.ts`:

```typescript
program
  .name('claudeinsight')
  .description('Sync Claude Code sessions to your Firebase for analysis')
  .version('1.0.0');
```

**Step 2: Update package.json**

Update version to "1.0.0" and description to "Sync Claude Code sessions to your Firebase for analysis".

Add bin entry if not present:
```json
"bin": {
  "claudeinsight": "./dist/index.js"
}
```

**Step 3: Build and test**

Run: `cd cli && pnpm build && node dist/index.js --help`

**Step 4: Commit**

Commit message: "chore(cli): update version and description for v1.0.0"

---

## Phase 2: Web Chat Conversation UI

### Task 6: Create Message component for chat display

**Files:**
- Create: `web/src/components/chat/ToolCallBadge.tsx`
- Create: `web/src/components/chat/MessageBubble.tsx`

**Step 1: Install required dependencies**

Run: `cd web && pnpm add react-markdown react-syntax-highlighter`
Run: `cd web && pnpm add -D @types/react-syntax-highlighter`

**Step 2: Create ToolCallBadge component**

Create `web/src/components/chat/ToolCallBadge.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, FileText, Edit, FolderSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ToolCall } from '@/lib/types';

const TOOL_ICONS: Record<string, React.ElementType> = {
  Bash: Terminal,
  Read: FileText,
  Write: Edit,
  Edit: Edit,
  Glob: FolderSearch,
  Grep: FolderSearch,
};

const TOOL_DESCRIPTIONS: Record<string, (input: string) => string> = {
  Bash: (input) => {
    try {
      const parsed = JSON.parse(input);
      return parsed.command?.slice(0, 60) || 'Executed command';
    } catch {
      return 'Executed command';
    }
  },
  Read: (input) => {
    try {
      const parsed = JSON.parse(input);
      const path = parsed.file_path || '';
      return `Read ${path.split('/').pop() || 'file'}`;
    } catch {
      return 'Read file';
    }
  },
  Write: (input) => {
    try {
      const parsed = JSON.parse(input);
      const path = parsed.file_path || '';
      return `Wrote ${path.split('/').pop() || 'file'}`;
    } catch {
      return 'Wrote file';
    }
  },
  Edit: (input) => {
    try {
      const parsed = JSON.parse(input);
      const path = parsed.file_path || '';
      return `Edited ${path.split('/').pop() || 'file'}`;
    } catch {
      return 'Edited file';
    }
  },
  Glob: () => 'Searched files',
  Grep: () => 'Searched code',
};

interface ToolCallBadgeProps {
  toolCall: ToolCall;
  expandable?: boolean;
}

export function ToolCallBadge({ toolCall, expandable = true }: ToolCallBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[toolCall.name] || Terminal;
  const getDescription = TOOL_DESCRIPTIONS[toolCall.name] || (() => toolCall.name);

  return (
    <div className="my-1">
      <Badge
        variant="secondary"
        className="cursor-pointer gap-1.5 font-normal"
        onClick={() => expandable && setExpanded(!expanded)}
      >
        <Icon className="h-3 w-3" />
        <span>{getDescription(toolCall.input)}</span>
        {expandable && (
          expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        )}
      </Badge>
      {expanded && (
        <pre className="mt-1 p-2 text-xs bg-muted rounded-md overflow-x-auto max-h-40">
          {toolCall.input}
        </pre>
      )}
    </div>
  );
}
```

**Step 3: Create MessageBubble component**

Create `web/src/components/chat/MessageBubble.tsx`:

```tsx
'use client';

import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Cog } from 'lucide-react';
import { ToolCallBadge } from './ToolCallBadge';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  return (
    <div className={cn(
      'flex gap-3 p-4',
      isUser ? 'bg-muted/50' : 'bg-background'
    )}>
      {/* Avatar */}
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-blue-500' : isSystem ? 'bg-gray-500' : 'bg-purple-500'
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : isSystem ? (
          <Cog className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isUser ? 'You' : isSystem ? 'System' : 'Claude'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(message.timestamp, 'h:mm a')}
          </span>
        </div>

        {/* Message content with markdown */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Tool calls */}
        {message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.toolCalls.map((tc, i) => (
              <ToolCallBadge key={i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Build to verify**

Run: `cd web && pnpm build`

**Step 5: Commit**

Commit message: "feat(web): add chat message components with markdown rendering"

---

### Task 7: Create ChatConversation container component

**Files:**
- Create: `web/src/components/chat/ChatConversation.tsx`
- Create: `web/src/components/chat/index.ts`

**Step 1: Create ChatConversation component**

Create `web/src/components/chat/ChatConversation.tsx`:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Skeleton } from '@/components/ui/skeleton';
import type { Message } from '@/lib/types';

interface ChatConversationProps {
  messages: Message[];
  loading?: boolean;
}

export function ChatConversation({ messages, loading }: ChatConversationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No messages in this session
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="divide-y divide-border overflow-y-auto max-h-[600px]"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
```

**Step 2: Create index export**

Create `web/src/components/chat/index.ts`:

```typescript
export { MessageBubble } from './MessageBubble';
export { ToolCallBadge } from './ToolCallBadge';
export { ChatConversation } from './ChatConversation';
```

**Step 3: Build to verify**

Run: `cd web && pnpm build`

**Step 4: Commit**

Commit message: "feat(web): add ChatConversation container component"

---

### Task 8: Update session detail page with chat UI

**Files:**
- Modify: `web/src/app/sessions/[id]/page.tsx`

**Step 1: Rewrite session detail page with tabs**

Replace the entire file with the new implementation that includes:
- Conversation tab with ChatConversation component
- Insights tab with existing InsightCard components
- AnalyzeButton in header and as fallback in Insights tab
- Session metadata cards

Key changes:
1. Import `useMessages` hook and `ChatConversation` component
2. Add Tabs component with "Conversation" and "Insights" tabs
3. Move AnalyzeButton to header area
4. Use ChatConversation in Conversation tab

**Step 2: Build and test locally**

Run: `cd web && pnpm dev`

Navigate to a session and verify:
- Chat conversation renders with messages
- Tabs switch correctly
- Insights tab shows generated insights

**Step 3: Commit**

Commit message: "feat(web): session detail page with chat conversation UI"

---

## Phase 3: Bulk Analysis Actions

### Task 9: Add batch analysis function

**Files:**
- Modify: `web/src/lib/llm/analysis.ts`

**Step 1: Add analyzeSessions batch function**

Add to the end of `web/src/lib/llm/analysis.ts`:

```typescript
/**
 * Analyze multiple sessions in sequence
 */
export async function analyzeSessions(
  sessions: Array<{ session: Session; messages: Message[] }>,
  onProgress?: (completed: number, total: number) => void
): Promise<{
  successful: number;
  failed: number;
  errors: string[];
}> {
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const { session, messages } = sessions[i];
    const result = await analyzeSession(session, messages);

    if (result.success) {
      successful++;
    } else {
      failed++;
      errors.push(`${session.generatedTitle || session.id}: ${result.error}`);
    }

    onProgress?.(i + 1, sessions.length);
  }

  return { successful, failed, errors };
}
```

**Step 2: Build to verify**

Run: `cd web && pnpm build`

**Step 3: Commit**

Commit message: "feat(web): add batch analysis function for multiple sessions"

---

### Task 10: Create BulkAnalyzeButton component

**Files:**
- Create: `web/src/components/analysis/BulkAnalyzeButton.tsx`

**Step 1: Create the component**

Create `web/src/components/analysis/BulkAnalyzeButton.tsx` with:
- Dialog for confirmation and progress
- Progress bar during analysis
- Success/failure summary
- Integration with analyzeSessions function

**Step 2: Build to verify**

Run: `cd web && pnpm build`

**Step 3: Commit**

Commit message: "feat(web): add bulk analysis button component"

---

### Task 11: Add fetchMessages helper to hooks

**Files:**
- Modify: `web/src/lib/hooks/useFirestore.ts`

**Step 1: Add non-reactive fetchMessages function**

Add to `web/src/lib/hooks/useFirestore.ts`:

```typescript
/**
 * Fetch messages for a single session (non-reactive, for bulk operations)
 */
export async function fetchMessages(sessionId: string): Promise<Message[]> {
  if (!isFirebaseInitialized()) return [];

  const db = getDb();
  const q = query(
    collection(db, 'messages'),
    where('sessionId', '==', sessionId),
    orderBy('timestamp', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
  })) as Message[];
}
```

**Step 2: Build to verify**

Run: `cd web && pnpm build`

**Step 3: Commit**

Commit message: "feat(web): add fetchMessages helper for bulk operations"

---

### Task 12: Add bulk actions to Dashboard

**Files:**
- Modify: `web/src/app/page.tsx`

**Step 1: Add "Analyze All Unanalyzed" card to dashboard**

Add a card showing:
- Count of sessions without insights
- Button to analyze all unanalyzed sessions
- Uses BulkAnalyzeButton internally

**Step 2: Build and test**

Run: `cd web && pnpm dev`

**Step 3: Commit**

Commit message: "feat(web): add bulk analysis action to dashboard"

---

### Task 13: Add session selection to Sessions page

**Files:**
- Modify: `web/src/app/sessions/page.tsx`

**Step 1: Add selection mode with checkboxes**

Add:
- Checkbox for each session
- "Select All" checkbox
- Floating action bar when sessions selected
- BulkAnalyzeButton for selected sessions

**Step 2: Build and test**

Run: `cd web && pnpm dev`

**Step 3: Commit**

Commit message: "feat(web): add session selection and bulk actions to sessions page"

---

## Phase 4: Documentation and Cleanup

### Task 14: Update CLI README

**Files:**
- Create or modify: `cli/README.md`

**Step 1: Write updated documentation**

Document:
- Installation via npm
- Commands: init, sync, status
- Firebase setup instructions
- Link to web dashboard

**Step 2: Commit**

Commit message: "docs(cli): update README for simplified CLI"

---

### Task 15: Update main project README

**Files:**
- Modify: `README.md`

**Step 1: Update architecture explanation**

- Clarify CLI/Web separation
- Update data flow diagram
- Link to hosted dashboard
- Update installation steps

**Step 2: Commit**

Commit message: "docs: update README for CLI/Web separation architecture"

---

### Task 16: Final integration test

**Step 1: Test CLI flow**

```
cd cli
pnpm build
node dist/index.js status
node dist/index.js sync --dry-run
```

**Step 2: Test Web flow**

```
cd web
pnpm dev
```

Test:
1. Configure Firebase
2. View sessions list
3. Open session → see chat conversation
4. Analyze session → verify insights generated
5. Dashboard → verify bulk analyze works

**Step 3: Create release commit**

Commit message: "feat: complete CLI/Web separation with chat UI and LLM insights"

---

## Summary of Changes

### CLI (Simplified)
- ✅ Remove `open` command
- ✅ Remove `insights` command
- ✅ Remove webConfig from init
- ✅ Always sync messages (already default)
- ✅ Update to v1.0.0

### Web (Enhanced)
- ✅ Chat conversation UI (WhatsApp-style)
- ✅ Markdown rendering with syntax highlighting
- ✅ Tool call badges (expandable)
- ✅ Session detail with Conversation/Insights tabs
- ✅ Bulk analysis (dashboard + sessions page)
- ✅ Writes insights to user's Firestore

### Final Data Flow
```
User's Machine                    Your Vercel App
┌─────────────┐                   ┌─────────────────┐
│ Claude Code │                   │ Web Dashboard   │
│   Sessions  │                   │                 │
│ (JSONL)     │                   │ • Chat UI       │
└──────┬──────┘                   │ • LLM Analysis  │
       │                          │ • Insights Gen  │
       ▼                          └────────┬────────┘
┌─────────────┐                            │
│ CLI (sync)  │──────────┐                 │
└─────────────┘          │                 │
                         ▼                 ▼
                   ┌───────────────────────────┐
                   │  User's Firebase          │
                   │  (Firestore)              │
                   │                           │
                   │  • projects               │
                   │  • sessions               │
                   │  • messages               │
                   │  • insights (written by   │
                   │    web app)               │
                   └───────────────────────────┘
```
