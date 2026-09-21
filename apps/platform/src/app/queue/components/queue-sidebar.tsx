"use client";

import React from 'react';
import {
  WorkspaceSidebar,
  WorkspaceSidebarAction,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
  WorkspaceSidebarWidget,
} from '@/components/workspace-sidebar';
import { Button } from '@atlas/ui/components/button';
import {
  Tray,
  CalendarCheck,
  CalendarBlank,
  Queue,
  CheckCircle,
  FolderSimple,
  Plus,
  Tag,
  Lightning,
  Hash,
} from '@phosphor-icons/react';
import { QueueArea, QueueLabel, QueueOverview } from '@atlas/api-client';

interface QueueSidebarProps {
  activeView: 'inbox' | 'today' | 'upcoming' | 'all' | 'completed';
  selectedProjectId?: string;
  selectedLabel?: string;
  overview?: QueueOverview;
  areas: QueueArea[];
  labels: QueueLabel[];
  onSelectView: (view: 'inbox' | 'today' | 'upcoming' | 'all' | 'completed') => void;
  onSelectProject: (projectId: string) => void;
  onSelectLabel: (labelName: string) => void;
  onOpenCreateProject: (areaId?: string) => void;
}

export function QueueSidebar({
  activeView,
  selectedProjectId,
  selectedLabel,
  overview,
  areas,
  labels,
  onSelectView,
  onSelectProject,
  onSelectLabel,
  onOpenCreateProject,
}: QueueSidebarProps) {
  return (
    <WorkspaceSidebar className="w-full md:w-64 shrink-0">
      {/* System Views */}
      <WorkspaceSidebarGroup title="Views">
        <WorkspaceSidebarItem
          icon={<Tray className="size-3.5" />}
          label="Inbox"
          badge={overview?.inbox || 0}
          isActive={!selectedProjectId && !selectedLabel && activeView === 'inbox'}
          onClick={() => onSelectView('inbox')}
        />
        <WorkspaceSidebarItem
          icon={<CalendarCheck className="size-3.5" />}
          label="Today"
          badge={overview?.today || 0}
          isActive={!selectedProjectId && !selectedLabel && activeView === 'today'}
          onClick={() => onSelectView('today')}
        />
        <WorkspaceSidebarItem
          icon={<CalendarBlank className="size-3.5" />}
          label="Upcoming"
          badge={overview?.upcoming || 0}
          isActive={!selectedProjectId && !selectedLabel && activeView === 'upcoming'}
          onClick={() => onSelectView('upcoming')}
        />
        <WorkspaceSidebarItem
          icon={<Queue className="size-3.5" />}
          label="All Tasks"
          badge={overview?.all || 0}
          isActive={!selectedProjectId && !selectedLabel && activeView === 'all'}
          onClick={() => onSelectView('all')}
        />
        <WorkspaceSidebarItem
          icon={<CheckCircle className="size-3.5" />}
          label="Completed"
          badge={overview?.completed || 0}
          isActive={!selectedProjectId && !selectedLabel && activeView === 'completed'}
          onClick={() => onSelectView('completed')}
        />
      </WorkspaceSidebarGroup>

      {/* Projects grouped by Areas */}
      {areas.map((area) => (
        <WorkspaceSidebarGroup
          key={area.id}
          title={area.name}
          action={
            <button
              type="button"
              onClick={() => onOpenCreateProject(area.id)}
              title={`Add project to ${area.name}`}
              className="text-brand-muted hover:text-brand-charcoal focus:outline-none"
            >
              <Plus className="size-3" />
            </button>
          }
        >
          {area.projects?.map((project) => (
            <WorkspaceSidebarItem
              key={project.id}
              icon={<FolderSimple className="size-3.5" />}
              label={project.name}
              badge={project._count?.tasks || 0}
              isActive={selectedProjectId === project.id}
              onClick={() => onSelectProject(project.id)}
            />
          ))}
        </WorkspaceSidebarGroup>
      ))}

      {/* Labels */}
      {labels.length > 0 && (
        <WorkspaceSidebarGroup title="Labels">
          {labels.map((lbl) => (
            <WorkspaceSidebarItem
              key={lbl.id || lbl.name}
              icon={<Hash className="size-3" />}
              label={lbl.name}
              badge={lbl._count?.tasks || 0}
              isActive={selectedLabel === lbl.name}
              onClick={() => onSelectLabel(lbl.name)}
            />
          ))}
        </WorkspaceSidebarGroup>
      )}

      {/* Focus / Velocity Widget */}
      <WorkspaceSidebarWidget
        title="Execution Velocity"
        icon={<Lightning className="size-3 text-amber-500" weight="fill" />}
      >
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-brand-muted">Completed:</span>
            <span className="font-semibold text-brand-charcoal">
              {overview?.completed || 0} tasks
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Pending:</span>
            <span className="font-semibold text-brand-charcoal">
              {overview?.all || 0} tasks
            </span>
          </div>
          {overview && overview.overdue > 0 && (
            <div className="flex justify-between text-[#9F2F2D]">
              <span>Overdue:</span>
              <span className="font-semibold">{overview.overdue} tasks</span>
            </div>
          )}
        </div>
      </WorkspaceSidebarWidget>
    </WorkspaceSidebar>
  );
}
