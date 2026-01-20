'use client';

import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, GitCommit, BookOpen, Activity, FileCode } from 'lucide-react';
import type { Insight } from '@/lib/types';

interface InsightCardProps {
  insight: Insight;
  showProject?: boolean;
}

const typeIcons = {
  decision: GitCommit,
  learning: BookOpen,
  workitem: FileCode,
  effort: Activity,
};

const typeColors = {
  decision: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  learning: 'bg-green-500/10 text-green-500 border-green-500/20',
  workitem: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  effort: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const typeLabels = {
  decision: 'Decision',
  learning: 'Learning',
  workitem: 'Work',
  effort: 'Effort',
};

export function InsightCard({ insight, showProject = false }: InsightCardProps) {
  const Icon = typeIcons[insight.type];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${typeColors[insight.type]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium line-clamp-2">
                {insight.title}
              </CardTitle>
              {showProject && (
                <p className="text-xs text-muted-foreground">{insight.projectName}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className={typeColors[insight.type]}>
            {typeLabels[insight.type]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{insight.content}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(insight.timestamp, { addSuffix: true })}
          </span>
          {insight.source === 'llm' && (
            <Badge variant="secondary" className="text-xs">
              AI Enhanced
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
