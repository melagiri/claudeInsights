'use client';

import { useState } from 'react';
import { useProjects } from '@/lib/hooks/useFirestore';
import { SessionList } from '@/components/sessions/SessionList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { SessionFilters } from '@/lib/types';

export default function SessionsPage() {
  const { projects } = useProjects();
  const [filters, setFilters] = useState<SessionFilters>({});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">Browse your Claude Code sessions</p>
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

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Session List */}
      <SessionList filters={filters} limit={50} />
    </div>
  );
}
