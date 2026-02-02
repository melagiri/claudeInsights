'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirebaseContext } from './providers';
import { useProjects, useSessions, useInsights, useAnalytics } from '@/lib/hooks/useFirestore';
import { getExportReminder } from '@/lib/scheduler/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SessionList } from '@/components/sessions/SessionList';
import { InsightList } from '@/components/insights/InsightList';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { InsightTypeChart } from '@/components/charts/InsightTypeChart';
import { LandingPage } from '@/components/landing/LandingPage';
import { BulkAnalyzeButton } from '@/components/analysis/BulkAnalyzeButton';
import { fetchMessages } from '@/lib/hooks/useFirestore';
import { MessageSquare, Lightbulb, Folder, Clock, Download, X } from 'lucide-react';

export default function DashboardPage() {
  const { isConfigured, showConfig } = useFirebaseContext();
  const { projects } = useProjects();
  const { sessions } = useSessions(undefined, 100);
  const { insights } = useInsights(undefined, 100);
  const { dailyStats, insightsByType } = useAnalytics();
  const [exportReminder, setExportReminder] = useState<string | null>(null);
  const [dismissedReminder, setDismissedReminder] = useState(false);

  useEffect(() => {
    const reminder = getExportReminder();
    setExportReminder(reminder);
  }, []);

  if (!isConfigured) {
    return <LandingPage onGetStarted={showConfig} />;
  }

  // Calculate total duration
  const totalDuration = sessions.reduce((acc, s) => {
    return acc + (s.endedAt.getTime() - s.startedAt.getTime());
  }, 0);
  const totalHours = Math.round(totalDuration / 3600000);

  // Find sessions without insights
  const sessionIdsWithInsights = new Set(insights.map(i => i.sessionId));
  const unanalyzedSessions = sessions.filter(s => !sessionIdsWithInsights.has(s.id));

  return (
    <div className="p-6 space-y-6">
      {/* Export Reminder */}
      {exportReminder && !dismissedReminder && (
        <Alert className="bg-blue-50 border-blue-200">
          <Download className="h-4 w-4" />
          <AlertTitle>Export Reminder</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{exportReminder}</span>
            <div className="flex gap-2 ml-4">
              <Link href="/export">
                <Button size="sm">Export Now</Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissedReminder(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your Claude Code insights at a glance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {projects.length} projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              {insightsByType.decision} decisions, {insightsByType.learning} learnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active codebases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              With Claude Code
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <ActivityChart data={dailyStats} />
        </div>
        <div>
          <InsightTypeChart data={insightsByType} />
        </div>
      </div>

      {/* Quick Actions */}
      {unanalyzedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{unanalyzedSessions.length} sessions without insights</p>
              <p className="text-xs text-muted-foreground">Generate AI insights for unanalyzed sessions</p>
            </div>
            <BulkAnalyzeButton
              sessions={unanalyzedSessions}
              getMessages={fetchMessages}
            />
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
          <SessionList limit={5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Insights</h2>
          <InsightList limit={6} />
        </div>
      </div>
    </div>
  );
}
