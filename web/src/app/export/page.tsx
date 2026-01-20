'use client';

import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useProjects, useSessions, useInsights } from '@/lib/hooks/useFirestore';
import { exportToMarkdown, exportDailyDigest, type ExportFormat } from '@/lib/export/markdown';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Calendar, Folder } from 'lucide-react';

export default function ExportPage() {
  const { projects } = useProjects();
  const { sessions } = useSessions(undefined, 500);
  const { insights } = useInsights(undefined, 1000);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('plain');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [customDate, setCustomDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const handleExport = (type: 'full' | 'daily' | 'project') => {
    let content = '';
    let filename = '';

    // Filter by date range
    const now = new Date();
    let dateFrom: Date | undefined;

    switch (dateRange) {
      case 'today':
        dateFrom = startOfDay(now);
        break;
      case 'week':
        dateFrom = subDays(now, 7);
        break;
      case 'month':
        dateFrom = subDays(now, 30);
        break;
    }

    let filteredSessions = dateFrom
      ? sessions.filter((s) => s.startedAt >= dateFrom!)
      : sessions;
    let filteredInsights = dateFrom
      ? insights.filter((i) => i.timestamp >= dateFrom!)
      : insights;

    // Filter by project
    if (selectedProject !== 'all') {
      filteredSessions = filteredSessions.filter((s) => s.projectId === selectedProject);
      filteredInsights = filteredInsights.filter((i) => i.projectId === selectedProject);
    }

    const options = { format: exportFormat, includeMetadata: true, groupByType: true };

    switch (type) {
      case 'full':
        content = exportToMarkdown(filteredSessions, filteredInsights, options);
        filename = `claudeinsight-export-${format(now, 'yyyy-MM-dd')}.md`;
        break;
      case 'daily':
        const date = new Date(customDate);
        const daySessions = sessions.filter(
          (s) => s.startedAt >= startOfDay(date) && s.startedAt <= endOfDay(date)
        );
        const dayInsights = insights.filter(
          (i) => i.timestamp >= startOfDay(date) && i.timestamp <= endOfDay(date)
        );
        content = exportDailyDigest(date, daySessions, dayInsights, options);
        filename = `daily-digest-${format(date, 'yyyy-MM-dd')}.md`;
        break;
      case 'project':
        if (selectedProject === 'all') {
          alert('Please select a project');
          return;
        }
        const projectName = projects.find((p) => p.id === selectedProject)?.name || 'project';
        content = exportToMarkdown(filteredSessions, filteredInsights, options);
        filename = `${projectName}-insights-${format(now, 'yyyy-MM-dd')}.md`;
        break;
    }

    // Download
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-muted-foreground">Download your insights in various formats</p>
      </div>

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Format</CardTitle>
          <CardDescription>Choose the markdown format for your export</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="plain">Plain Markdown</TabsTrigger>
              <TabsTrigger value="obsidian">Obsidian</TabsTrigger>
              <TabsTrigger value="notion">Notion</TabsTrigger>
            </TabsList>
            <TabsContent value="plain" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Standard markdown format compatible with any editor or viewer.
              </p>
            </TabsContent>
            <TabsContent value="obsidian" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Includes callout blocks and [[wikilinks]] for Obsidian vault compatibility.
              </p>
            </TabsContent>
            <TabsContent value="notion" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Uses toggle blocks and formatting optimized for Notion import.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Full Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle className="text-base">Full Export</CardTitle>
            </div>
            <CardDescription>Export all sessions and insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="month">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
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

            <Button className="w-full" onClick={() => handleExport('full')}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </CardContent>
        </Card>

        {/* Daily Digest */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle className="text-base">Daily Digest</CardTitle>
            </div>
            <CardDescription>Summary for a specific day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={() => handleExport('daily')}>
              <Download className="mr-2 h-4 w-4" />
              Export Digest
            </Button>
          </CardContent>
        </Card>

        {/* Project Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              <CardTitle className="text-base">Project Export</CardTitle>
            </div>
            <CardDescription>All insights from one project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={() => handleExport('project')}
              disabled={selectedProject === 'all'}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Project
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{insights.length}</p>
              <p className="text-sm text-muted-foreground">Total Insights</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {insights.filter((i) => i.type === 'decision').length}
              </p>
              <p className="text-sm text-muted-foreground">Decisions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {insights.filter((i) => i.type === 'learning').length}
              </p>
              <p className="text-sm text-muted-foreground">Learnings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
