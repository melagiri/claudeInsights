'use client';

import { useState } from 'react';
import { useProjects, useInsights } from '@/lib/hooks/useFirestore';
import { InsightCard } from '@/components/insights/InsightCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { InsightFilters, Insight } from '@/lib/types';

export default function InsightsPage() {
  const { projects } = useProjects();
  const [filters, setFilters] = useState<InsightFilters>({});
  const { insights, loading, error } = useInsights(filters, 200);

  // Group insights by type
  const summaries = insights.filter((i) => i.type === 'summary');
  const decisions = insights.filter((i) => i.type === 'decision');
  const learnings = insights.filter((i) => i.type === 'learning');
  const techniques = insights.filter((i) => i.type === 'technique');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground">AI-generated summaries, decisions, learnings, and techniques from your sessions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filters.projectId || 'all'}
          onValueChange={(value) =>
            setFilters({ ...filters, projectId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({insights.length})</TabsTrigger>
          <TabsTrigger value="summaries">Summaries ({summaries.length})</TabsTrigger>
          <TabsTrigger value="decisions">Decisions ({decisions.length})</TabsTrigger>
          <TabsTrigger value="learnings">Learnings ({learnings.length})</TabsTrigger>
          <TabsTrigger value="techniques">Techniques ({techniques.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <InsightGrid insights={insights} loading={loading} error={error} />
        </TabsContent>

        <TabsContent value="summaries" className="mt-6">
          <InsightGrid insights={summaries} loading={loading} error={error} />
        </TabsContent>

        <TabsContent value="decisions" className="mt-6">
          <InsightGrid insights={decisions} loading={loading} error={error} />
        </TabsContent>

        <TabsContent value="learnings" className="mt-6">
          <InsightGrid insights={learnings} loading={loading} error={error} />
        </TabsContent>

        <TabsContent value="techniques" className="mt-6">
          <InsightGrid insights={techniques} loading={loading} error={error} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InsightGrid({
  insights,
  loading,
  error,
}: {
  insights: Insight[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
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
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} showProject />
      ))}
    </div>
  );
}
