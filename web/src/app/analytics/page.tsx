'use client';

import { useAnalytics, useProjects } from '@/lib/hooks/useFirestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { InsightTypeChart } from '@/components/charts/InsightTypeChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const { dailyStats, projectStats, insightsByType, totalSessions, totalInsights } = useAnalytics();
  const { projects } = useProjects();

  // Prepare project chart data
  const projectChartData = projectStats
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10)
    .map((p) => ({
      name: p.projectName.length > 15 ? p.projectName.slice(0, 15) + '...' : p.projectName,
      sessions: p.sessionCount,
      insights: p.insightCounts.summary + p.insightCounts.decision + p.insightCounts.learning + p.insightCounts.technique,
    }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Visualize your Claude Code usage patterns</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInsights}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Sessions/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dailyStats.length > 0
                ? (totalSessions / dailyStats.length).toFixed(1)
                : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Over Time */}
      <ActivityChart data={dailyStats} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Insight Types */}
        <InsightTypeChart data={insightsByType} />

        {/* Sessions by Project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {projectChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">No project data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Project</th>
                  <th className="py-3 text-right font-medium">Sessions</th>
                  <th className="py-3 text-right font-medium">Summaries</th>
                  <th className="py-3 text-right font-medium">Decisions</th>
                  <th className="py-3 text-right font-medium">Learnings</th>
                  <th className="py-3 text-right font-medium">Techniques</th>
                  <th className="py-3 text-right font-medium">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {projectStats.map((project) => (
                  <tr key={project.projectId} className="border-b">
                    <td className="py-3">{project.projectName}</td>
                    <td className="py-3 text-right">{project.sessionCount}</td>
                    <td className="py-3 text-right">{project.insightCounts.summary}</td>
                    <td className="py-3 text-right">{project.insightCounts.decision}</td>
                    <td className="py-3 text-right">{project.insightCounts.learning}</td>
                    <td className="py-3 text-right">{project.insightCounts.technique}</td>
                    <td className="py-3 text-right">{Math.round(project.totalDuration)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
