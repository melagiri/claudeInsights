'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Folder,
  Lightbulb,
  Shield,
  Zap,
  Download,
  GitBranch,
  Search,
  BarChart3,
  Sparkles,
  Terminal,
  ArrowRight,
  Check,
  Github,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Folder className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              ClaudeInsight
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your Claude Code session history into structured, searchable insights.
            Track decisions, learnings, and work patterns across all your projects.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={onGetStarted} className="gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="https://github.com/claudeinsight/claudeinsight"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2">
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Privacy Banner */}
      <section className="px-6 py-8 bg-primary/5 border-y">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Your Data, Your Infrastructure</span>
          </div>
          <p className="text-muted-foreground">
            All data is stored in your own Firebase project. Nothing is sent to ClaudeInsight servers.
            You bring your own Firebase credentials.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to get insights from your Claude Code sessions
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Lightbulb}
              title="Insight Extraction"
              description="Automatically extract decisions, learnings, and work items from your sessions using pattern matching."
            />
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Analysis"
              description="Enhance insights with Gemini AI. Generate summaries, extract deeper patterns, and create learning journals."
            />
            <FeatureCard
              icon={Search}
              title="Full-Text Search"
              description="Search across all sessions and insights. Filter by project, date, type, and more."
            />
            <FeatureCard
              icon={BarChart3}
              title="Analytics Dashboard"
              description="Visualize your coding patterns with charts showing activity over time and insight distribution."
            />
            <FeatureCard
              icon={Download}
              title="Markdown Export"
              description="Export to plain Markdown, Obsidian, or Notion formats. Schedule regular exports."
            />
            <FeatureCard
              icon={Zap}
              title="Auto-Sync Hook"
              description="Install a Claude Code hook that automatically syncs sessions when they complete."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12">
            Get started in three simple steps
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number={1}
              title="Set Up Firebase"
              description="Create a Firebase project and configure Firestore. Get your credentials from the Firebase Console."
            />
            <StepCard
              number={2}
              title="Install the CLI"
              description="Run the CLI to sync your Claude Code sessions from ~/.claude/projects/ to your Firestore."
            />
            <StepCard
              number={3}
              title="View Insights"
              description="Open the dashboard to explore sessions, insights, and analytics. Optionally add Gemini for AI features."
            />
          </div>
        </div>
      </section>

      {/* CLI Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">Quick Start</h2>
          <p className="text-center text-muted-foreground mb-8">
            Install the CLI and start syncing in minutes
          </p>
          <Card>
            <CardContent className="p-6">
              <div className="rounded-lg bg-zinc-950 p-6 font-mono text-sm text-zinc-100 overflow-x-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="h-4 w-4" />
                  <span className="text-zinc-400">Terminal</span>
                </div>
                <pre className="space-y-2">
                  <div><span className="text-zinc-500"># Clone the repository</span></div>
                  <div>git clone https://github.com/claudeinsight/claudeinsight.git</div>
                  <div className="mt-4"><span className="text-zinc-500"># Install and build the CLI</span></div>
                  <div>cd claudeinsight/cli && pnpm install && pnpm build</div>
                  <div className="mt-4"><span className="text-zinc-500"># Initialize with your Firebase credentials</span></div>
                  <div>node dist/index.js init</div>
                  <div className="mt-4"><span className="text-zinc-500"># Sync your sessions</span></div>
                  <div>node dist/index.js sync</div>
                  <div className="mt-4"><span className="text-zinc-500"># Optional: Install auto-sync hook</span></div>
                  <div>node dist/index.js install-hook</div>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">What You Get</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <BenefitItem text="Track architectural decisions across projects" />
            <BenefitItem text="Build a learning journal from your sessions" />
            <BenefitItem text="Search your entire coding history" />
            <BenefitItem text="Export insights to Obsidian or Notion" />
            <BenefitItem text="AI-powered summaries with Gemini" />
            <BenefitItem text="REST API for custom integrations" />
            <BenefitItem text="Real-time dashboard updates" />
            <BenefitItem text="100% privacy - your data, your infrastructure" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Configure your Firebase credentials and start extracting insights from your Claude Code sessions.
          </p>
          <Button size="lg" onClick={onGetStarted} className="gap-2">
            Configure Firebase
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t">
        <div className="mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <span className="font-semibold">ClaudeInsight</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open source hobby project. MIT License.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/claudeinsight/claudeinsight"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <Icon className="h-8 w-8 text-primary mb-4" />
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Check className="h-5 w-5 text-green-500 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
