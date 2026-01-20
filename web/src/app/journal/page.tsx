'use client';

import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useInsights, useSessions } from '@/lib/hooks/useFirestore';
import { isGeminiConfigured, extractDeepInsights } from '@/lib/gemini/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, BookOpen, Target, Lightbulb, GitBranch } from 'lucide-react';
import type { Insight } from '@/lib/types';

interface DeepInsights {
  decisions: Array<{ title: string; reasoning: string; alternatives?: string }>;
  learnings: Array<{ title: string; context: string }>;
  patterns: string[];
}

export default function JournalPage() {
  const { insights, loading: insightsLoading } = useInsights(undefined, 500);
  const { sessions } = useSessions(undefined, 100);

  const [deepInsights, setDeepInsights] = useState<DeepInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geminiConfigured = isGeminiConfigured();

  // Group insights by type
  const decisions = useMemo(() => insights.filter((i) => i.type === 'decision'), [insights]);
  const learnings = useMemo(() => insights.filter((i) => i.type === 'learning'), [insights]);

  // Group learnings by week
  const learningsByWeek = useMemo(() => {
    const grouped: Record<string, Insight[]> = {};
    learnings.forEach((learning) => {
      const weekStart = format(
        subDays(learning.timestamp, learning.timestamp.getDay()),
        'yyyy-MM-dd'
      );
      if (!grouped[weekStart]) {
        grouped[weekStart] = [];
      }
      grouped[weekStart].push(learning);
    });
    return grouped;
  }, [learnings]);

  // Group decisions by project
  const decisionsByProject = useMemo(() => {
    const grouped: Record<string, Insight[]> = {};
    decisions.forEach((decision) => {
      if (!grouped[decision.projectName]) {
        grouped[decision.projectName] = [];
      }
      grouped[decision.projectName].push(decision);
    });
    return grouped;
  }, [decisions]);

  const generateDeepInsights = async () => {
    if (!geminiConfigured) return;

    setLoading(true);
    setError(null);

    try {
      // Use recent sessions for context
      const recentSessions = sessions.slice(0, 10);
      const summaries = recentSessions.map((s) => s.summary).filter(Boolean).join('. ');

      if (!summaries) {
        setError('No session data available for analysis.');
        setLoading(false);
        return;
      }

      const result = await extractDeepInsights(summaries, insights.slice(0, 20));
      setDeepInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Journal</h1>
        <p className="text-muted-foreground">Track decisions, learnings, and patterns over time</p>
      </div>

      <Tabs defaultValue="learnings">
        <TabsList>
          <TabsTrigger value="learnings" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learnings ({learnings.length})
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-2">
            <Target className="h-4 w-4" />
            Decisions ({decisions.length})
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learnings" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(learningsByWeek)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 10)
              .map(([weekStart, weekLearnings]) => (
                <Card key={weekStart}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Week of {format(new Date(weekStart), 'MMMM d, yyyy')}
                    </CardTitle>
                    <CardDescription>{weekLearnings.length} learnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {weekLearnings.map((learning) => (
                        <li key={learning.id} className="flex items-start gap-3">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">{learning.title}</p>
                            <p className="text-sm text-muted-foreground">{learning.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {learning.projectName} • {format(learning.timestamp, 'MMM d')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            {learnings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No learnings recorded yet. They will appear as you sync sessions.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(decisionsByProject)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([project, projectDecisions]) => (
                <Card key={project}>
                  <CardHeader>
                    <CardTitle className="text-base">{project}</CardTitle>
                    <CardDescription>{projectDecisions.length} decisions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {projectDecisions.map((decision) => (
                        <li key={decision.id} className="flex items-start gap-3">
                          <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">{decision.title}</p>
                            <p className="text-sm text-muted-foreground">{decision.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(decision.timestamp, 'MMM d, yyyy')}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            {decisions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No decisions recorded yet. They will appear as you sync sessions.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Pattern Analysis
                  </CardTitle>
                  <CardDescription>
                    Discover recurring patterns in your work using Gemini AI
                  </CardDescription>
                </div>
                {geminiConfigured ? (
                  <Button onClick={generateDeepInsights} disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze Patterns
                      </>
                    )}
                  </Button>
                ) : (
                  <Badge variant="outline">Add Gemini API key in Settings</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm text-red-500 mb-4">{error}</p>
              )}

              {deepInsights ? (
                <div className="space-y-6">
                  {deepInsights.patterns.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Recurring Patterns</h4>
                      <ul className="space-y-2">
                        {deepInsights.patterns.map((pattern, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Badge variant="outline" className="shrink-0">Pattern</Badge>
                            <span className="text-sm text-muted-foreground">{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {deepInsights.decisions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Key Decisions</h4>
                      <ul className="space-y-4">
                        {deepInsights.decisions.map((decision, i) => (
                          <li key={i} className="border-l-2 border-blue-200 pl-4">
                            <p className="font-medium">{decision.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{decision.reasoning}</p>
                            {decision.alternatives && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Alternatives: {decision.alternatives}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {deepInsights.learnings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Deep Learnings</h4>
                      <ul className="space-y-4">
                        {deepInsights.learnings.map((learning, i) => (
                          <li key={i} className="border-l-2 border-green-200 pl-4">
                            <p className="font-medium">{learning.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{learning.context}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {geminiConfigured
                    ? 'Click "Analyze Patterns" to discover recurring themes in your work'
                    : 'Add your Gemini API key in Settings to use this feature'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
