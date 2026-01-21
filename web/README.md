# ClaudeInsight Web Dashboard

Next.js web application for visualizing Claude Code session insights.

## For Users

Most users should use the hosted version at **claudeinsight.vercel.app** via the CLI:

```bash
claudeinsight init   # Configure credentials
claudeinsight sync   # Sync sessions
claudeinsight open   # Open dashboard
```

This README is for self-hosting or development.

## Authentication

The dashboard requires authentication (Google or GitHub sign-in). This:
- Protects the dashboard from unauthorized access
- Enables usage analytics for the project maintainers
- **Does NOT access your Claude Code data** (that stays in your Firebase)

## Getting Started (Development)

### Prerequisites

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Set up OAuth providers:
   - **Google**: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   - **GitHub**: [github.com/settings/developers](https://github.com/settings/developers)

3. Set up Vercel Postgres (or local PostgreSQL)

### Run Development Server

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Page | Description |
|------|-------------|
| `/login` | Authentication (Google/GitHub) |
| `/` | Dashboard overview |
| `/sessions` | Browse sessions |
| `/sessions/[id]` | Session detail with Analyze button |
| `/insights` | Browse insights by type |
| `/analytics` | Usage charts and trends |
| `/export` | Export to Markdown |
| `/digest` | Daily summary |
| `/settings` | Firebase + LLM configuration |

## LLM-Powered Analysis

Analyze sessions using your own LLM API key:

| Provider | Models |
|----------|--------|
| OpenAI | gpt-4o, gpt-4o-mini |
| Anthropic | claude-sonnet-4-20250514, claude-3-5-haiku |
| Google Gemini | gemini-1.5-pro, gemini-1.5-flash |
| Ollama (local) | llama3.2, mistral, codellama |

## Project Structure

```
web/
├── prisma/
│   └── schema.prisma       # User auth schema (Vercel Postgres)
├── src/
│   ├── app/
│   │   ├── api/auth/       # NextAuth API routes
│   │   ├── login/          # Login page
│   │   └── ...             # Dashboard pages
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── analysis/       # AnalyzeButton
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── prisma.ts       # Prisma client
│   │   ├── firebase.ts     # Firebase client
│   │   ├── llm/            # LLM providers
│   │   └── ...
│   └── middleware.ts       # Auth middleware
├── .env.example
└── package.json
```

## Environment Variables

```bash
# NextAuth
NEXTAUTH_SECRET=random-secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...

# Vercel Postgres
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set root directory to `web`

### 3. Add Vercel Postgres

1. Go to your project → Storage
2. Create a new Postgres database
3. Environment variables are auto-configured

### 4. Configure OAuth

Add these environment variables in Vercel:
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` (your Vercel URL)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID`, `GITHUB_SECRET`

### 5. Run Database Migration

```bash
npx prisma db push
```

### 6. Enable Analytics

1. Go to your project → Analytics
2. Enable Vercel Analytics (free tier)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js v5 (Google, GitHub)
- **Database**: Vercel Postgres + Prisma (users)
- **User Data**: Firebase Firestore (user-provided)
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Charts**: Recharts
- **Analytics**: Vercel Analytics
