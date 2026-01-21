# ClaudeInsight

Transform your Claude Code session history into structured, searchable insights.

ClaudeInsight parses Claude Code's JSONL session files (`~/.claude/projects/`) and syncs them to your own Firebase database, where you can visualize patterns, track decisions, and analyze your AI-assisted development workflow.

## Privacy First: Bring Your Own Firebase (BYOF)

Your data stays yours. ClaudeInsight follows a **Bring Your Own Firebase** model:
- No central server or data collection
- You create your own Firebase project
- All data lives in your Firestore database
- Web dashboard runs locally or on your own hosting

## Components

| Component | Description |
|-----------|-------------|
| **[CLI](/cli)** | Parses JSONL sessions and syncs to Firestore |
| **[Web Dashboard](/web)** | Next.js app for visualizing insights |

## Quick Start

### 1. Set Up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Generate a service account key (Project Settings → Service Accounts → Generate New Private Key)

### 2. Install & Configure CLI

```bash
cd cli
pnpm install
pnpm build
npm link

# Configure with your Firebase credentials
claudeinsight init
```

### 3. Sync Your Sessions

```bash
# Sync all Claude Code sessions
claudeinsight sync

# Check status
claudeinsight status
```

### 4. Run the Web Dashboard

```bash
cd web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your Firebase config.

## Architecture

```
~/.claude/projects/**/*.jsonl
           │
           ▼
    ┌─────────────┐
    │   CLI       │  Parse JSONL, extract metadata
    │  (Node.js)  │  Upload to Firestore
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │  Firestore  │  projects, sessions, messages, insights
    │  (Firebase) │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │    Web      │  Real-time dashboard
    │  (Next.js)  │  LLM-powered analysis
    └─────────────┘
```

## Features

### CLI
- Incremental sync (only new/modified sessions)
- Multi-device support with stable project IDs
- Automatic title generation for sessions
- Git branch and Claude version tracking
- Hook integration for automatic sync

### Web Dashboard
- Real-time session and project views
- LLM-powered insight generation (bring your own API key)
- Analytics and usage patterns
- Export to Markdown (plain, Obsidian, Notion formats)
- Daily digest view

## Insight Types

| Type | Description |
|------|-------------|
| **Summary** | High-level narrative of what was accomplished |
| **Decision** | Choices made with reasoning and alternatives |
| **Learning** | Technical discoveries and transferable knowledge |
| **Technique** | Problem-solving approaches and debugging strategies |

## Multi-Device Support

ClaudeInsight supports syncing from multiple machines:
- Project IDs are derived from git remote URLs (stable across devices)
- Each session tracks device metadata (hostname, platform)
- Session counts are idempotent (re-syncing won't inflate counts)

## Tech Stack

- **CLI**: Node.js, TypeScript, Commander.js, Firebase Admin SDK
- **Web**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Recharts
- **Database**: Firebase Firestore
- **LLM Analysis**: OpenAI, Anthropic, Google Gemini, or Ollama (local)

## License

MIT License - see [LICENSE](LICENSE) for details.
