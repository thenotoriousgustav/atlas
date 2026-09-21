"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  queueApi,
  QueueTask,
  QueueProject,
  QueueArea,
  QueueLabel,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@atlas/api-client';
import { StandardWorkspaceHeader } from '@/components/workspace-header';
import { ModuleContainer } from '@/components/module-container';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { toast } from 'sonner';
import {
  Command,
  Plus,
  Sparkle,
  Clock,
  CheckCircle,
  FolderSimple,
} from '@phosphor-icons/react';
import { QueueSidebar } from './components/queue-sidebar';
import { QuickCaptureInput } from './components/quick-capture-input';
import { TaskList } from './components/task-list';
import { TaskDetailSheet } from './components/task-detail-sheet';
import { QueueCommandPalette } from './components/queue-command-palette';
import { AiDecomposeDialog } from './components/ai-decompose-dialog';
import { CreateProjectDialog } from './components/create-project-dialog';

export function QueueDashboard() {
  const queryClient = useQueryClient();

  // Active View & Filter State
  const [activeView, setActiveView] = useState<
    'inbox' | 'today' | 'upcoming' | 'all' | 'completed'
  >('today');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    undefined
  );
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(undefined);

  // Modals & Drawers State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiDecomposeOpen, setIsAiDecomposeOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [targetAreaIdForProject, setTargetAreaIdForProject] = useState<
    string | undefined
  >(undefined);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 1. Fetch Overview stats
  const { data: overviewRes } = useQuery({
    queryKey: ['queue-overview'],
    queryFn: () => queueApi.getOverview(),
  });
  const overview = overviewRes?.data;

  // 2. Fetch Areas with Projects
  const { data: areasRes } = useQuery({
    queryKey: ['queue-areas'],
    queryFn: () => queueApi.getAreas(),
  });
  const areas = areasRes?.data || [];

  // Flatten projects list for quick lookup
  const allProjects = useMemo(
    () => areas.flatMap((a) => a.projects || []),
    [areas]
  );

  // 3. Fetch Labels
  const { data: labelsRes } = useQuery({
    queryKey: ['queue-labels'],
    queryFn: () => queueApi.getLabels(),
  });
  const labels = labelsRes?.data || [];

  // 4. Fetch Tasks according to active filter
  const { data: tasksRes, isLoading: isTasksLoading } = useQuery({
    queryKey: [
      'queue-tasks',
      activeView,
      selectedProjectId,
      selectedLabel,
    ],
    queryFn: () =>
      queueApi.getTasks({
        view: selectedProjectId || selectedLabel ? undefined : activeView,
        projectId: selectedProjectId,
        label: selectedLabel,
      }),
  });
  const tasks = tasksRes?.data || [];

  // 5. Fetch Active Task Detail if selected
  const { data: selectedTaskRes } = useQuery({
    queryKey: ['queue-task-detail', selectedTaskId],
    queryFn: () => queueApi.getTask(selectedTaskId!),
    enabled: !!selectedTaskId,
  });
  const selectedTask = selectedTaskRes?.data || null;

  // MUTATIONS

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => queueApi.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-overview'] });
      queryClient.invalidateQueries({ queryKey: ['queue-areas'] });
      toast.success('Task captured');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  // 1-Click Toggle Task Mutation with Optimistic Update
  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: string) => queueApi.toggleTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['queue-tasks'] });
      const previousTasks = queryClient.getQueryData<{
        success: boolean;
        data: QueueTask[];
      }>(['queue-tasks', activeView, selectedProjectId, selectedLabel]);

      if (previousTasks?.data) {
        queryClient.setQueryData(
          ['queue-tasks', activeView, selectedProjectId, selectedLabel],
          {
            ...previousTasks,
            data: previousTasks.data.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: t.status === 'DONE' ? 'TODO' : 'DONE',
                    completedAt: t.status === 'DONE' ? null : new Date().toISOString(),
                  }
                : t
            ),
          }
        );
      }
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['queue-tasks', activeView, selectedProjectId, selectedLabel],
          context.previousTasks
        );
      }
      toast.error('Failed to update task status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-overview'] });
      queryClient.invalidateQueries({ queryKey: ['queue-areas'] });
    },
  });

  // Update Task Mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: UpdateTaskPayload;
    }) => queueApi.updateTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-task-detail'] });
      queryClient.invalidateQueries({ queryKey: ['queue-overview'] });
      toast.success('Task updated');
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => queueApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-overview'] });
      queryClient.invalidateQueries({ queryKey: ['queue-areas'] });
      toast.success('Task deleted');
      if (selectedTaskId) setSelectedTaskId(null);
    },
  });

  // Subtask Mutations
  const createSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      queueApi.createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-task-detail'] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => queueApi.toggleSubtask(subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-task-detail'] });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => queueApi.deleteSubtask(subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['queue-task-detail'] });
    },
  });

  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; areaId?: string }) =>
      queueApi.createProject(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['queue-areas'] });
      toast.success('Project created');
      if (res.data?.id) {
        setSelectedProjectId(res.data.id);
        setActiveView('all');
      }
    },
  });

  // Global Keyboard Listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for Views
  const handleSelectView = (
    view: 'inbox' | 'today' | 'upcoming' | 'all' | 'completed'
  ) => {
    setSelectedProjectId(undefined);
    setSelectedLabel(undefined);
    setActiveView(view);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedLabel(undefined);
    setSelectedProjectId(projectId);
  };

  const handleSelectLabel = (labelName: string) => {
    setSelectedProjectId(undefined);
    setSelectedLabel(labelName);
  };

  // Active Title Computation
  const currentViewTitle = useMemo(() => {
    if (selectedProjectId) {
      const proj = allProjects.find((p) => p.id === selectedProjectId);
      return proj ? `Project: ${proj.name}` : 'Project Tasks';
    }
    if (selectedLabel) {
      return `Label: #${selectedLabel}`;
    }
    switch (activeView) {
      case 'inbox':
        return 'Inbox';
      case 'today':
        return 'Today';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'all':
        return 'All Tasks';
    }
  }, [selectedProjectId, selectedLabel, activeView, allProjects]);

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between bg-brand-canvas px-4 py-8 font-mono select-none md:px-12">
      {/* Top Header */}
      <ModuleContainer>
        <StandardWorkspaceHeader
          moduleName="Queue"
          moduleBadge="TASKFLOW · 05"
          moduleSubtitle="Gustam Platform · Execution Queue"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAiDecomposeOpen(true)}
                className="hidden sm:flex h-8 items-center gap-1.5 rounded-none border-brand-border px-2.5 font-mono text-[10px] uppercase font-semibold text-brand-charcoal hover:bg-brand-charcoal hover:text-white"
              >
                <Sparkle className="size-3.5 text-amber-500" />
                <span>AI Goal</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex h-8 items-center gap-1.5 rounded-none border-brand-border px-2.5 font-mono text-[10px] uppercase font-semibold text-brand-charcoal hover:bg-brand-charcoal hover:text-white"
              >
                <Command className="size-3.5 text-brand-muted" />
                <span className="hidden md:inline">Command Palette</span>
                <kbd className="hidden sm:inline border border-brand-border bg-brand-canvas px-1 py-0.2 text-[9px] text-brand-muted">
                  ⌘K
                </kbd>
              </Button>
            </div>
          }
        />
      </ModuleContainer>

      {/* Main Workspace Layout */}
      <ModuleContainer className="flex flex-1 flex-col md:flex-row gap-8 py-8">
        {/* Left Sidebar */}
        <QueueSidebar
          activeView={activeView}
          selectedProjectId={selectedProjectId}
          selectedLabel={selectedLabel}
          overview={overview}
          areas={areas}
          labels={labels}
          onSelectView={handleSelectView}
          onSelectProject={handleSelectProject}
          onSelectLabel={handleSelectLabel}
          onOpenCreateProject={(areaId) => {
            setTargetAreaIdForProject(areaId);
            setIsCreateProjectOpen(true);
          }}
        />

        {/* Right Focus Execution Stream */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Header of Active Stream */}
          <div className="flex items-baseline justify-between border-b border-brand-border pb-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                {currentViewTitle}
              </h2>
              <p className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in queue
              </p>
            </div>
          </div>

          {/* Inline Quick Capture Input with NLP Tokenizer */}
          <QuickCaptureInput
            onAddTask={async (taskData) => {
              await createTaskMutation.mutateAsync({
                ...taskData,
                projectId: taskData.projectId || selectedProjectId,
              });
            }}
            projects={allProjects}
            defaultProjectId={selectedProjectId}
            onOpenAiDecompose={() => setIsAiDecomposeOpen(true)}
          />

          {/* Grouped Task Stream */}
          {isTasksLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-xs text-brand-muted space-y-2 font-mono">
              <Clock className="size-5 animate-spin text-brand-charcoal" />
              <span>Loading execution stream...</span>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              viewTitle={currentViewTitle}
              onToggle={(id) => toggleTaskMutation.mutate(id)}
              onSelect={(id) => setSelectedTaskId(id)}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
            />
          )}
        </main>
      </ModuleContainer>

      {/* Slide-out Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        isOpen={!!selectedTaskId}
        projects={allProjects}
        onClose={() => setSelectedTaskId(null)}
        onUpdateTask={async (taskId, data) => {
          await updateTaskMutation.mutateAsync({ taskId, payload: data });
        }}
        onToggleTask={async (taskId) => {
          await toggleTaskMutation.mutateAsync(taskId);
        }}
        onDeleteTask={async (taskId) => {
          await deleteTaskMutation.mutateAsync(taskId);
        }}
        onAddSubtask={async (taskId, title) => {
          await createSubtaskMutation.mutateAsync({ taskId, title });
        }}
        onToggleSubtask={async (subtaskId) => {
          await toggleSubtaskMutation.mutateAsync(subtaskId);
        }}
        onDeleteSubtask={async (subtaskId) => {
          await deleteSubtaskMutation.mutateAsync(subtaskId);
        }}
      />

      {/* Global Command Palette (⌘K) */}
      <QueueCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        areas={areas}
        onSelectView={handleSelectView}
        onSelectProject={handleSelectProject}
        onSelectTask={(taskId) => setSelectedTaskId(taskId)}
        onQuickCreate={async (title) => {
          await createTaskMutation.mutateAsync({ title });
        }}
        onOpenAiDecompose={() => setIsAiDecomposeOpen(true)}
      />

      {/* AI Goal Decomposition Dialog */}
      <AiDecomposeDialog
        isOpen={isAiDecomposeOpen}
        onClose={() => setIsAiDecomposeOpen(false)}
        projects={allProjects}
        onTaskCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['queue-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['queue-overview'] });
        }}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={isCreateProjectOpen}
        initialAreaId={targetAreaIdForProject}
        areas={areas}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreateProject={async (data) => {
          await createProjectMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
