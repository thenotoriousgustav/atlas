"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { queueApi, DecomposeGoalResponse, QueueProject } from '@atlas/api-client';
import { Sparkle, Check, ArrowRight, FolderSimple, Flag } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface AiDecomposeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projects: QueueProject[];
  onTaskCreated: () => void;
}

export function AiDecomposeDialog({
  isOpen,
  onClose,
  projects,
  onTaskCreated,
}: AiDecomposeDialogProps) {
  const [prompt, setPrompt] = useState('Buatkan task untuk menyelesaikan fitur login minggu ini');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<DecomposeGoalResponse | null>(null);

  const handleDecompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const selectedProjectName = projects.find((p) => p.id === selectedProjectId)?.name;
      const res = await queueApi.decomposeGoal(prompt.trim(), selectedProjectName);
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      toast.error('Failed to decompose goal with AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDecomposedTask = async () => {
    if (!result) return;
    setIsCreating(true);
    try {
      const targetProjectId =
        selectedProjectId ||
        (result.project?.id ? result.project.id : undefined);

      // Create parent task
      const taskRes = await queueApi.createTask({
        title: result.suggestedTitle,
        projectId: targetProjectId,
        priority: result.suggestedPriority,
      });

      if (taskRes.success && taskRes.data) {
        const taskId = taskRes.data.id;
        // Create subtasks sequentially
        for (const sub of result.subtasks) {
          await queueApi.createSubtask(taskId, sub.title);
        }
        toast.success('Task and subtasks created successfully!');
        onTaskCreated();
        onClose();
        setResult(null);
      }
    } catch (err: any) {
      toast.error('Failed to create decomposed task');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-lg border border-brand-border bg-white p-6 dark:bg-card rounded-none select-none">
        <DialogHeader className="space-y-1 border-b border-brand-border pb-3">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl font-medium text-brand-charcoal">
            <Sparkle className="size-5 text-amber-500" />
            <span>AI Task Decomposition</span>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-brand-muted">
            Describe your high-level goal. The AI will decompose it into structured, executable subtasks.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleDecompose} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">
                Goal / Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Buatkan task untuk menyelesaikan fitur login minggu ini..."
                className="w-full bg-transparent border border-brand-border p-2.5 font-sans text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">
                Optional Project Context
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-transparent border border-brand-border p-2 font-mono text-xs text-brand-charcoal focus:outline-none rounded-none"
              >
                <option value="">Auto-detect from prompt or default</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-8 rounded-none border-brand-border font-mono text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="h-8 rounded-none bg-brand-charcoal text-white font-mono text-xs uppercase hover:bg-brand-charcoal/90"
              >
                {isLoading ? 'Decomposing...' : 'Decompose Goal'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 pt-2 font-mono">
            <div className="space-y-1.5 border border-brand-border p-3 bg-brand-canvas">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-brand-muted uppercase">Proposed Task:</span>
                <Badge
                  variant="outline"
                  className="rounded-none bg-[#FDEBEC] text-[#9F2F2D] border-[#FDEBEC] text-[9px] uppercase"
                >
                  {result.suggestedPriority}
                </Badge>
              </div>
              <p className="font-serif text-base font-semibold text-brand-charcoal">
                {result.suggestedTitle}
              </p>
              {result.project && (
                <div className="flex items-center gap-1 text-[10px] text-brand-muted">
                  <FolderSimple className="size-3" />
                  <span>Project: {result.project.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] text-brand-muted uppercase tracking-wider">
                Generated Action Checklist ({result.subtasks.length} items):
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.subtasks.map((sub, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 border border-brand-border bg-white px-2.5 py-1.5 text-xs font-sans dark:bg-card"
                  >
                    <div className="size-3.5 border border-brand-charcoal/40 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono text-brand-muted">{idx + 1}</span>
                    </div>
                    <span className="flex-1 truncate text-brand-charcoal">{sub.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResult(null)}
                className="h-8 rounded-none border-brand-border font-mono text-xs uppercase"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleCreateDecomposedTask}
                disabled={isCreating}
                className="h-8 rounded-none bg-brand-charcoal text-white font-mono text-xs uppercase hover:bg-brand-charcoal/90"
              >
                {isCreating ? 'Creating...' : 'Create Task with Checklist'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
