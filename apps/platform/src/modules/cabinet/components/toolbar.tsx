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
import { ButtonGroup } from '@atlas/ui/components/button-group';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
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
import { MagnifyingGlass, Plus, SquaresFour, List, Cards, Sparkle } from '@phosphor-icons/react';
import { AXIOS_INSTANCE } from '@atlas/api-client';
import { Spinner } from '@atlas/ui/components/spinner';
import { Item } from '@atlas/ui/components/item';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@atlas/ui/components/input-group';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isBookmarkModalOpen: boolean;
  setIsBookmarkModalOpen: (open: boolean) => void;
  bookmarkToEdit: any;
  bookmarkForm: any;
  folders: any[];
  resetBookmarkForm: () => void;
  viewMode: 'card' | 'list' | 'moodboard';
  onViewModeChange: (mode: 'card' | 'list' | 'moodboard') => void;
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
  viewMode,
  onViewModeChange,
}: ToolbarProps) {
  const [isScraping, setIsScraping] = React.useState(false);

  const handleScrape = async (url: string) => {
    if (!url) return;
    setIsScraping(true);
    try {
      const res = await AXIOS_INSTANCE.get('/v1/bookmarks/scrape', {
        params: { url },
      });
      const data = res.data;
      if (data && data.success && data.data) {
        const metadata = data.data;
        if (metadata.title) {
          bookmarkForm.setFieldValue('title', metadata.title);
        }
        if (metadata.description) {
          bookmarkForm.setFieldValue('description', metadata.description);
        }
        if (metadata.tags && metadata.tags.length > 0) {
          bookmarkForm.setFieldValue('tags', metadata.tags.join(', '));
        }
      }
    } catch (err) {
      console.error('Failed to scrape URL:', err);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <Item variant="outline" className="flex-col sm:flex-row gap-3 justify-between bg-white p-3.5 shadow-none rounded-none">
      <div className="flex items-center gap-3 w-full sm:flex-1">
        <InputGroup className="w-full sm:max-w-md h-9">
          <InputGroupInput
            type="text"
            placeholder="Search titles, descriptions, URLs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-xs"
          />
          <InputGroupAddon align="inline-start">
            <MagnifyingGlass className="text-brand-muted" />
          </InputGroupAddon>
        </InputGroup>

        {/* View Mode Toggle Group */}
        <ButtonGroup className="shrink-0 bg-brand-charcoal/5 border border-brand-border p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
  <Button
                onClick={() => onViewModeChange('moodboard')}
                variant={viewMode === 'moodboard' ? 'default' : 'ghost'}
                size="icon-xs"
                className="size-7"
              >
                <SquaresFour className="w-4 h-4" />
              </Button>
</TooltipTrigger>
            <TooltipContent>Moodboard View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
  <Button
                onClick={() => onViewModeChange('list')}
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon-xs"
                className="size-7"
              >
                <List className="w-4 h-4" />
              </Button>
</TooltipTrigger>
            <TooltipContent>List View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
  <Button
                onClick={() => onViewModeChange('card')}
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="icon-xs"
                className="size-7"
              >
                <Cards className="w-4 h-4" />
              </Button>
</TooltipTrigger>
            <TooltipContent>Card View</TooltipContent>
          </Tooltip>

        </ButtonGroup>
      </div>

      <Dialog open={isBookmarkModalOpen} onOpenChange={setIsBookmarkModalOpen}>
        <DialogTrigger asChild>
  <Button
            onClick={() => {
              resetBookmarkForm();
              setIsBookmarkModalOpen(true);
            }}
            className="w-full sm:w-auto h-9 flex items-center gap-1.5 text-xs font-semibold uppercase bg-brand-charcoal hover:bg-brand-charcoal/90"
          >
            <Plus className="w-4 h-4" />
            Add Bookmark
          </Button>
</DialogTrigger>

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
                     <div className="flex gap-2">
                       <Input
                         id={field.name}
                         name={field.name}
                         value={field.state.value}
                         onBlur={field.handleBlur}
                         onChange={(e) => field.handleChange(e.target.value)}
                         placeholder="https://example.com"
                         type="url"
                         required
                         className="flex-1"
                       />
                       <Button
                         type="button"
                         variant="outline"
                         disabled={!field.state.value || isScraping}
                         onClick={() => handleScrape(field.state.value)}
                         className="shrink-0 h-8 px-3 font-mono text-[10px] uppercase font-semibold flex items-center gap-1.5 border border-brand-border hover:bg-brand-canvas"
                       >
                         {isScraping ? (
                           <>
                             <Spinner className="w-3.5 h-3.5" />
                             Scraping...
                           </>
                         ) : (
                           <>
                             <Sparkle className="w-3.5 h-3.5" />
                             Auto Fill
                           </>
                         )}
                       </Button>
                     </div>
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
                        <SelectTrigger className="w-full h-10 px-3 rounded-none border border-brand-border bg-white text-brand-charcoal text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 font-medium">
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
                className="flex-1 text-xs uppercase bg-brand-charcoal hover:bg-brand-charcoal/90"
              >
                Save Bookmark
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Item>
  );
}
