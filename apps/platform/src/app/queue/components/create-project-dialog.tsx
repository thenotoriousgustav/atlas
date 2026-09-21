"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { QueueArea } from '@atlas/api-client';
import { FolderSimple, Plus } from '@phosphor-icons/react';

interface CreateProjectDialogProps {
  isOpen: boolean;
  initialAreaId?: string;
  areas: QueueArea[];
  onClose: () => void;
  onCreateProject: (data: { name: string; areaId?: string }) => Promise<void>;
}

export function CreateProjectDialog({
  isOpen,
  initialAreaId,
  areas,
  onClose,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setAreaId(initialAreaId || (areas[0]?.id || ''));
    }
  }, [isOpen, initialAreaId, areas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateProject({ name: name.trim(), areaId: areaId || undefined });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-md border border-brand-border bg-white p-6 dark:bg-card rounded-none select-none">
        <DialogHeader className="space-y-1 border-b border-brand-border pb-3">
          <DialogTitle className="flex items-center gap-2 font-serif text-xl font-medium text-brand-charcoal">
            <FolderSimple className="size-5 text-brand-charcoal" />
            <span>Create New Project</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] text-brand-muted uppercase tracking-wider">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Inovasi, Website, Finance..."
              autoFocus
              className="w-full bg-transparent border border-brand-border p-2 font-sans text-xs text-brand-charcoal focus:outline-none focus:border-brand-charcoal rounded-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-brand-muted uppercase tracking-wider">
              Target Area
            </label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full bg-transparent border border-brand-border p-2 font-mono text-xs text-brand-charcoal focus:outline-none rounded-none"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
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
              disabled={!name.trim() || isSubmitting}
              className="h-8 rounded-none bg-brand-charcoal text-white font-mono text-xs uppercase hover:bg-brand-charcoal/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
