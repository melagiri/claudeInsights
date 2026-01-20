'use client';

import { useInsights } from '@/lib/hooks/useFirestore';
import { InsightCard } from './InsightCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { InsightFilters } from '@/lib/types';

interface InsightListProps {
  filters?: InsightFilters;
  limit?: number;
  showProject?: boolean;
}

export function InsightList({ filters, limit = 20, showProject = true }: InsightListProps) {
  const { insights, loading, error } = useInsights(filters, limit);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Error loading insights: {error}</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No insights found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Insights are extracted automatically when you sync sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} showProject={showProject} />
      ))}
    </div>
  );
}
