import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@atlas/ui/components/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isBookmarkModalOpen: boolean;
  setIsBookmarkModalOpen: (open: boolean) => void;
  bookmarkToEdit: any;
  bookmarkForm: any;
  folders: any[];
  resetBookmarkForm: () => void;
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  isBookmarkModalOpen,
  setIsBookmarkModalOpen,
  bookmarkToEdit,
  bookmarkForm,
  folders,
  resetBookmarkForm,
}: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-none border border-brand-border shadow-sm">
      <div className="relative w-full sm:max-w-xs">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlass className="w-4 h-4 text-[#787774]" />
        </span>
        <Input
          type="text"
          placeholder="Search titles, descriptions, URLs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
        <DialogTrigger render={
          <Button
            onClick={() => {
              resetBookmarkForm();
              setIsBookmarkModalOpen(true);
            }}
            className="w-full sm:w-auto h-9 flex items-center gap-1.5 text-xs font-semibold uppercase bg-[#111111] hover:bg-[#111111]/90"
          >
            <Plus className="w-4 h-4" />
            Add Bookmark
          </Button>
        } />

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{bookmarkToEdit ? 'Edit Bookmark' : 'New Bookmark'}</DialogTitle>
            <DialogDescription>Resource collection</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              bookmarkForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <FieldGroup>
              <bookmarkForm.Field
                name="url"
                children={(field: any) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com"
                      type="url"
                      required
                    />
                  </Field>
                )}
              />

              <bookmarkForm.Field
                name="title"
                children={(field: any) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Title (Optional)</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Leave blank to fetch from URL metadata"
                    />
                  </Field>
                )}
              />

              <bookmarkForm.Field
                name="description"
                children={(field: any) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Description (Optional)</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional notes or details"
                    />
                  </Field>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <bookmarkForm.Field
                  name="folderId"
                  children={(field: any) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Folder</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(val) => field.handleChange(val)}
                      >
                        <SelectTrigger className="w-full h-10 px-3 rounded-none border border-brand-border bg-white text-[#111111] text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-medium">
                          <SelectValue placeholder="None (Root)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (Root)</SelectItem>
                          {folders.map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <bookmarkForm.Field
                  name="tags"
                  children={(field: any) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Tags (Comma-separated)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="react, tailwind, guide"
                      />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBookmarkModalOpen(false)}
                className="flex-1 text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-xs uppercase bg-[#111111] hover:bg-[#111111]/90"
              >
                Save Bookmark
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
