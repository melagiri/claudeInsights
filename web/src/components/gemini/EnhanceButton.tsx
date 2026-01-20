'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isGeminiConfigured, enhanceSession } from '@/lib/gemini/client';
import type { Session } from '@/lib/types';

interface EnhanceButtonProps {
  session: Session;
}

interface EnhancedInsights {
  enhancedSummary: string;
  keyDecisions: string[];
  learnings: string[];
  suggestedActions: string[];
}

export function EnhanceButton({ session }: EnhanceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<EnhancedInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configured = isGeminiConfigured();

  const handleEnhance = async () => {
    if (!configured) return;

    setLoading(true);
    setError(null);

    try {
      const result = await enhanceSession(session);
      setInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance session');
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="text-sm text-muted-foreground">
        <Sparkles className="inline h-4 w-4 mr-1" />
        Add Gemini API key in Settings to enable AI insights
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!insights && (
        <Button
          onClick={handleEnhance}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Enhance with Gemini
            </>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI-Enhanced Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground">{insights.enhancedSummary}</p>
            </div>

            {insights.keyDecisions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Key Decisions</h4>
                <ul className="space-y-1">
                  {insights.keyDecisions.map((decision, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0">Decision</Badge>
                      <span className="text-muted-foreground">{decision}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.learnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Learnings</h4>
                <ul className="space-y-1">
                  {insights.learnings.map((learning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0 bg-green-50">Learning</Badge>
                      <span className="text-muted-foreground">{learning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.suggestedActions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggested Actions</h4>
                <ul className="space-y-1">
                  {insights.suggestedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0 bg-blue-50">Action</Badge>
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
