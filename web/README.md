# ClaudeInsight Web Dashboard

Next.js web application for visualizing Claude Code session insights.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-Time Setup

1. Open the Settings page
2. Enter your Firebase configuration:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

Configuration is stored in browser localStorage.

### LLM Analysis Setup (Optional)

To enable AI-powered insight generation:

1. Go to Settings → LLM Provider
2. Select a provider (OpenAI, Anthropic, Gemini, or Ollama)
3. Enter your API key
4. Choose a model

## Pages

### Dashboard (`/`)
Overview of recent activity:
- Session count and trends
- Recent sessions list
- Quick stats

### Sessions (`/sessions`)
Browse all synced sessions:
- Filter by project
- Search by content
- View session details

### Session Detail (`/sessions/[id]`)
Deep dive into a single session:
- Full message timeline
- Tool call breakdown
- **Analyze Button** - Generate insights using LLM
- Related insights

### Insights (`/insights`)
Browse all generated insights:
- Filter by type (Summary, Decision, Learning, Technique)
- Filter by project
- Card-based view with expandable details

### Analytics (`/analytics`)
Visualize usage patterns:
- Activity over time chart
- Insight type distribution (pie chart)
- Top projects by sessions
- Project breakdown table

### Export (`/export`)
Export data to Markdown:
- Plain Markdown
- Obsidian format (with callouts and wikilinks)
- Notion format (with toggle blocks)

### Daily Digest (`/digest`)
Daily summary view:
- What you worked on
- Decisions made
- Things learned

### Settings (`/settings`)
Configure the dashboard:
- Firebase connection
- LLM provider and API key
- Model selection

## LLM-Powered Analysis

The web dashboard can analyze sessions using your own LLM API key.

### Supported Providers

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Anthropic | claude-sonnet-4-20250514, claude-3-5-haiku-20241022 |
| Google Gemini | gemini-1.5-pro, gemini-1.5-flash |
| Ollama (local) | llama3.2, mistral, codellama |

### How It Works

1. Click **Analyze** on any session
2. Messages are fetched from Firestore
3. Long sessions are chunked (~80k tokens max per call)
4. LLM extracts structured insights
5. Insights are saved to Firestore
6. UI updates in real-time

### Insight Types Generated

- **Summary**: What was accomplished in the session
- **Decision**: Choices made with reasoning
- **Learning**: Technical discoveries and gotchas
- **Technique**: Problem-solving approaches used

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── sessions/
│   │   │   ├── page.tsx          # Session list
│   │   │   └── [id]/page.tsx     # Session detail
│   │   ├── insights/page.tsx     # Insights browser
│   │   ├── analytics/page.tsx    # Analytics charts
│   │   ├── export/page.tsx       # Export page
│   │   ├── digest/page.tsx       # Daily digest
│   │   ├── settings/page.tsx     # Settings
│   │   ├── api/                   # API routes
│   │   ├── layout.tsx            # Root layout
│   │   └── providers.tsx         # Firebase provider
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── charts/               # Recharts components
│   │   ├── insights/             # InsightCard, etc.
│   │   ├── sessions/             # SessionCard, etc.
│   │   └── analysis/             # AnalyzeButton
│   └── lib/
│       ├── firebase.ts           # Firebase client
│       ├── types.ts              # TypeScript types
│       ├── hooks/
│       │   └── useFirestore.ts   # Real-time hooks
│       ├── llm/
│       │   ├── client.ts         # LLM provider factory
│       │   ├── providers/        # OpenAI, Anthropic, etc.
│       │   ├── prompts.ts        # Analysis prompts
│       │   └── analysis.ts       # Analysis engine
│       ├── firestore/
│       │   └── insights.ts       # Insight write helpers
│       └── export/
│           └── markdown.ts       # Export formatters
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Development

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui
- **Charts**: Recharts
- **Database**: Firebase Firestore (client SDK)
- **State**: React hooks with real-time Firestore subscriptions

## Environment Variables

No environment variables required - all configuration is done through the Settings page and stored in localStorage.

## Deployment

The dashboard can be deployed to any static hosting:

```bash
pnpm build
# Deploy .next/standalone or use Vercel/Netlify
```

Note: Since Firebase config is entered by users in the browser, no server-side secrets are needed.
