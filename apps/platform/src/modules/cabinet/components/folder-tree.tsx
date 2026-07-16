import React from 'react';
import { Button } from '@atlas/ui/components/button';
import { FolderSimple, PencilSimple, Trash, Plus } from '@phosphor-icons/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@atlas/ui/components/accordion';

interface FolderTreeProps {
  folders: any[];
  selectedFolderId?: string;
  onSelectFolder: (id: string) => void;
  onEditFolder: (folder: any) => void;
  onDeleteFolder: (id: string) => void;
  onCreateSubfolder?: (parentId: string) => void;
  parentId?: string | null;
  depth?: number;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
  onCreateSubfolder,
  parentId = null,
  depth = 0,
}: FolderTreeProps) {
  const list = folders.filter((f: any) => f.parentId === parentId);
  if (list.length === 0) return null;

  return (
    <Accordion type="multiple" className="space-y-1">
      {list.map((folder: any) => {
        const isSelected = selectedFolderId === folder.id;
        const hasChildren = folders.some((f: any) => f.parentId === folder.id);

        if (hasChildren) {
          return (
            <AccordionItem key={folder.id} value={folder.id} className="border-none">
              <div
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className={`group flex items-center justify-between rounded-none py-1.5 pr-2 text-xs transition-colors cursor-pointer ${
                  isSelected ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold' : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
                }`}
              >
                <span
                  className="flex items-center gap-2 truncate flex-1"
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <FolderSimple className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateSubfolder?.(folder.id);
                      }}
                      variant="ghost"
                      size="icon-xs"
                      title="Add subfolder"
                    >
                      <Plus className="w-3 h-3 text-brand-muted" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFolder(folder);
                      }}
                      variant="ghost"
                      size="icon-xs"
                      title="Edit folder"
                    >
                      <PencilSimple className="w-3 h-3 text-brand-muted" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      variant="ghost"
                      size="icon-xs"
                      className="hover:bg-brand-red-bg hover:text-brand-red-text"
                      title="Delete folder"
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                  <AccordionTrigger 
                    className="p-1 size-6 flex items-center justify-center hover:bg-brand-charcoal/5 focus-visible:ring-0 hover:no-underline after:hidden"
                    onClick={(e) => e.stopPropagation()} 
                  />
                </div>
              </div>
              <AccordionContent className="pb-0 pt-0.5">
                <FolderTree
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  onEditFolder={onEditFolder}
                  onDeleteFolder={onDeleteFolder}
                  onCreateSubfolder={onCreateSubfolder}
                  parentId={folder.id}
                  depth={depth + 1}
                />
              </AccordionContent>
            </AccordionItem>
          );
        }

        return (
          <div key={folder.id} className="space-y-1">
            <div
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className={`group flex items-center justify-between rounded-none py-1.5 pr-2 text-xs transition-colors cursor-pointer ${
                isSelected ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold' : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
              }`}
              onClick={() => onSelectFolder(folder.id)}
            >
              <span className="flex items-center gap-2 truncate">
                <FolderSimple className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateSubfolder?.(folder.id);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  title="Add subfolder"
                >
                  <Plus className="w-3 h-3 text-brand-muted" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFolder(folder);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  title="Edit folder"
                >
                  <PencilSimple className="w-3 h-3 text-brand-muted" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className="hover:bg-brand-red-bg hover:text-brand-red-text"
                  title="Delete folder"
                >
                  <Trash className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </Accordion>
  );
}
