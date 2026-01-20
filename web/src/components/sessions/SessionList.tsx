'use client';

import { useSessions } from '@/lib/hooks/useFirestore';
import { SessionCard } from './SessionCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { SessionFilters } from '@/lib/types';

interface SessionListProps {
  filters?: SessionFilters;
  limit?: number;
}

export function SessionList({ filters, limit = 20 }: SessionListProps) {
  const { sessions, loading, error } = useSessions(filters, limit);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Error loading sessions: {error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No sessions found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Run <code className="rounded bg-muted px-1">claudeinsight sync</code> to sync your sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  );
}
