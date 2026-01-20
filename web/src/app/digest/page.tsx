'use client';

import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { useSessions, useInsights } from '@/lib/hooks/useFirestore';
import { isGeminiConfigured, generateDailyDigest } from '@/lib/gemini/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Loader2, Calendar, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface DigestData {
  summary: string;
  highlights: string[];
  productivity: string;
  suggestions: string[];
}

export default function DigestPage() {
  const { sessions } = useSessions(undefined, 100);
  const { insights } = useInsights(undefined, 200);

  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [digestPeriod, setDigestPeriod] = useState<'today' | 'week'>('today');
  const [error, setError] = useState<string | null>(null);

  const geminiConfigured = isGeminiConfigured();

  // Filter data by period
  const filterByPeriod = (period: 'today' | 'week') => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === 'today') {
      start = startOfDay(now);
      end = endOfDay(now);
    } else {
      start = startOfWeek(now);
      end = endOfWeek(now);
    }

    const filteredSessions = sessions.filter(
      (s) => s.startedAt >= start && s.startedAt <= end
    );
    const filteredInsights = insights.filter(
      (i) => i.timestamp >= start && i.timestamp <= end
    );

    return { sessions: filteredSessions, insights: filteredInsights, start, end };
  };

  const generateDigest = async () => {
    if (!geminiConfigured) return;

    setLoading(true);
    setError(null);

    try {
      const { sessions: periodSessions, insights: periodInsights, start } = filterByPeriod(digestPeriod);

      if (periodSessions.length === 0 && periodInsights.length === 0) {
        setError('No data found for this period.');
        setLoading(false);
        return;
      }

      const result = await generateDailyDigest(periodSessions, periodInsights, start);
      setDigest(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate digest');
    } finally {
      setLoading(false);
    }
  };

  const { sessions: todaySessions, insights: todayInsights } = filterByPeriod('today');
  const { sessions: weekSessions, insights: weekInsights } = filterByPeriod('week');

  // Calculate stats
  const todayStats = {
    sessions: todaySessions.length,
    insights: todayInsights.length,
    decisions: todayInsights.filter((i) => i.type === 'decision').length,
    learnings: todayInsights.filter((i) => i.type === 'learning').length,
  };

  const weekStats = {
    sessions: weekSessions.length,
    insights: weekInsights.length,
    decisions: weekInsights.filter((i) => i.type === 'decision').length,
    learnings: weekInsights.filter((i) => i.type === 'learning').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Digest</h1>
        <p className="text-muted-foreground">AI-powered summaries of your work</p>
      </div>

      <Tabs value={digestPeriod} onValueChange={(v) => { setDigestPeriod(v as 'today' | 'week'); setDigest(null); }}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {/* Today's Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{todayStats.sessions}</p>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{todayStats.insights}</p>
                    <p className="text-sm text-muted-foreground">Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{todayStats.decisions}</p>
                    <p className="text-sm text-muted-foreground">Decisions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{todayStats.learnings}</p>
                    <p className="text-sm text-muted-foreground">Learnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-6">
          {/* Week Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{weekStats.sessions}</p>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{weekStats.insights}</p>
                    <p className="text-sm text-muted-foreground">Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{weekStats.decisions}</p>
                    <p className="text-sm text-muted-foreground">Decisions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{weekStats.learnings}</p>
                    <p className="text-sm text-muted-foreground">Learnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Digest */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI-Powered Digest
              </CardTitle>
              <CardDescription>
                Generate a summary using Gemini AI
              </CardDescription>
            </div>
            {geminiConfigured ? (
              <Button onClick={generateDigest} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Digest
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

          {digest ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-muted-foreground">{digest.summary}</p>
              </div>

              {digest.highlights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Highlights</h4>
                  <ul className="space-y-2">
                    {digest.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 bg-green-50">✓</Badge>
                        <span className="text-sm text-muted-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Productivity</h4>
                <p className="text-sm text-muted-foreground">{digest.productivity}</p>
              </div>

              {digest.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Suggestions</h4>
                  <ul className="space-y-2">
                    {digest.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 bg-blue-50">→</Badge>
                        <span className="text-sm text-muted-foreground">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {geminiConfigured
                ? 'Click "Generate Digest" to create an AI-powered summary'
                : 'Add your Gemini API key in Settings to use this feature'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
