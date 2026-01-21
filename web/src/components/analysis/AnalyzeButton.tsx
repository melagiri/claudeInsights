'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isLLMConfigured, analyzeSession } from '@/lib/llm';
import { useMessages } from '@/lib/hooks/useFirestore';
import type { Session } from '@/lib/types';
import Link from 'next/link';

interface AnalyzeButtonProps {
  session: Session;
}

export function AnalyzeButton({ session }: AnalyzeButtonProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);

  const { messages, loading: messagesLoading } = useMessages(session.id);
  const configured = isLLMConfigured();

  const handleAnalyze = async () => {
    if (!configured) return;

    setAnalyzing(true);
    setError(null);
    setSuccess(false);
    setUsage(null);

    const result = await analyzeSession(session, messages);

    if (result.success) {
      setSuccess(true);
      if (result.usage) {
        setUsage(result.usage);
      }
    } else {
      setError(result.error || 'Analysis failed');
    }

    setAnalyzing(false);
  };

  // LLM not configured
  if (!configured) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>
          Configure an AI provider in{' '}
          <Link href="/settings" className="underline hover:text-foreground">
            Settings
          </Link>{' '}
          to analyze sessions
        </span>
      </div>
    );
  }

  // Messages still loading
  if (messagesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading messages...</span>
      </div>
    );
  }

  // No messages available
  if (messages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>
          No messages found. Run{' '}
          <code className="px-1 py-0.5 bg-muted rounded text-xs">claudeinsight sync</code>{' '}
          to upload session messages.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          variant={success ? 'outline' : 'default'}
          className="gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing {messages.length} messages...
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Re-analyze Session
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Session
            </>
          )}
        </Button>

        {!analyzing && !success && (
          <span className="text-xs text-muted-foreground">
            {messages.length} messages
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600">
          Analysis complete! Insights have been saved.
          {usage && (
            <span className="text-muted-foreground ml-2">
              ({usage.inputTokens.toLocaleString()} input / {usage.outputTokens.toLocaleString()} output tokens)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
