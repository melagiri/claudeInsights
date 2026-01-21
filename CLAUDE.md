# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClaudeInsight transforms Claude Code session history (`~/.claude/projects/` JSONL files) into structured, searchable insights. It follows a **Bring Your Own Firebase (BYOF)** privacy model - no central server, users own all their data.

**Two main components:**
- **CLI** (`/cli`) - Parses JSONL sessions and syncs to user's Firestore
- **Web Dashboard** (`/web`) - Next.js app for visualizing insights

## Commands

### Web Dashboard
```bash
cd web
pnpm install          # Install dependencies
pnpm dev              # Start dev server at http://localhost:3000
pnpm build            # Production build
pnpm lint             # Run ESLint
```

### CLI
```bash
cd cli
pnpm install          # Install dependencies
pnpm dev              # Watch mode (tsc --watch)
pnpm build            # Compile TypeScript to dist/
pnpm lint             # Run ESLint

# After building, link for local testing:
npm link
claudeinsight init                     # Configure Firebase credentials
claudeinsight sync                     # Sync sessions to Firestore
claudeinsight sync --force             # Re-sync all sessions
claudeinsight sync --dry-run           # Preview without changes
claudeinsight status                   # Show sync statistics
```

## Architecture

### Data Flow
```
~/.claude/projects/**/*.jsonl → CLI Parser → Firestore → Web Dashboard
```

### CLI (`/cli/src/`)
- `commands/` - CLI commands (init, sync, status, install-hook)
- `parser/jsonl.ts` - JSONL file parsing
- `parser/insights.ts` - Pattern-based insight extraction (regex matching)
- `firebase/` - Firebase Admin SDK for Firestore writes
- `types.ts` - Shared TypeScript types

### Web (`/web/src/`)
- `app/` - Next.js App Router pages
- `app/providers.tsx` - Firebase client initialization from localStorage config
- `lib/hooks/useFirestore.ts` - Real-time Firestore subscriptions
- `lib/firebase.ts` - Firebase client utilities
- `components/ui/` - shadcn/ui components

### Firestore Collections
- `projects` - Project metadata (id is hash of path)
- `sessions` - Session metadata (id from JSONL filename)
- `insights` - Extracted insights with type, confidence, metadata
- `messages` - Optional full message content (--include-messages flag)

## Key Patterns

### Insight Extraction
Pattern-based extraction in `/cli/src/parser/insights.ts`:
- **Decisions**: "decided to", "chose X over Y", "trade-off:"
- **Learnings**: "learned that", "TIL:", "realized", "mistake:"
- **Work Items**: Inferred from Edit/Write/Bash tool calls
- **Effort**: Calculated from session duration and token counts

### Firebase Integration
- CLI uses Admin SDK with service account credentials
- Web uses client SDK with config stored in browser localStorage
- Batch writes capped at 500 operations per batch
- Incremental sync tracks file modification times

### Types
Types are duplicated between `/cli/src/types.ts` and `/web/src/types.ts` (not yet unified).

## Tech Stack

- **CLI**: Node.js, Commander.js, Firebase Admin SDK, Chalk/Ora for UI
- **Web**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts
- **Database**: Firebase Firestore (user-provided)
- **Optional AI**: Google Generative AI (Gemini) with user's API key

## Development Notes

- No test framework configured yet
- TypeScript strict mode enabled
- ESLint configured for both CLI and web
- pnpm is the package manager for both workspaces
