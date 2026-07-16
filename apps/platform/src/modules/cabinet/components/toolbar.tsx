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
import { MagnifyingGlass, Plus, SquaresFour, List, Cards, Sparkle, CaretDown } from '@phosphor-icons/react';
import { AXIOS_INSTANCE } from '@atlas/api-client';
import { Spinner } from '@atlas/ui/components/spinner';
import { Item } from '@atlas/ui/components/item';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@atlas/ui/components/input-group';
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxChipsInput,
  ComboboxTrigger,
  useComboboxAnchor,
  ComboboxAnchor,
} from '@atlas/ui/components/combobox';
import {
  TagsInput,
  TagsInputList,
  TagsInputInput,
  TagsInputItem,
} from '@atlas/ui/components/tags-input';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isBookmarkModalOpen: boolean;
  setIsBookmarkModalOpen: (open: boolean) => void;
  bookmarkToEdit: any;
  bookmarkForm: any;
  folders: any[];
  tags?: any[];
  resetBookmarkForm: () => void;
  viewMode: 'list' | 'moodboard';
  onViewModeChange: (mode: 'list' | 'moodboard') => void;
  columnCount?: number;
  onColumnCountChange?: (count: number) => void;
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  isBookmarkModalOpen,
  setIsBookmarkModalOpen,
  bookmarkToEdit,
  bookmarkForm,
  folders,
  tags = [],
  resetBookmarkForm,
  viewMode,
  onViewModeChange,
  columnCount = 3,
  onColumnCountChange = () => {},
}: ToolbarProps) {
  const [isScraping, setIsScraping] = React.useState(false);
  const [tagInputValue, setTagInputValue] = React.useState('');
  const filteredTags = React.useMemo(() => {
    const query = tagInputValue.trim().toLowerCase().replace(/^#/, '');
    if (!query) return tags;
    return tags.filter((t: any) => t.name.toLowerCase().includes(query));
  }, [tags, tagInputValue]);
  const anchorRef = useComboboxAnchor();
  const handleScrape = async (url: string) => {
    if (!url) return;
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
      bookmarkForm.setFieldValue('url', targetUrl);
    }
    setIsScraping(true);
    try {
      const res = await AXIOS_INSTANCE.get('/v1/bookmarks/scrape', {
        params: { url: targetUrl },
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

        </ButtonGroup>

        {viewMode === 'moodboard' && (
          <Select
            value={columnCount.toString()}
            onValueChange={(val) => onColumnCountChange(parseInt(val, 10))}
          >
            <SelectTrigger className="h-8 border-brand-border bg-white text-[10px] tracking-wider uppercase font-bold text-brand-charcoal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-charcoal/30 rounded-none w-24 px-2">
              <SelectValue placeholder="COLUMNS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Col</SelectItem>
              <SelectItem value="2">2 Cols</SelectItem>
              <SelectItem value="3">3 Cols</SelectItem>
              <SelectItem value="4">4 Cols</SelectItem>
            </SelectContent>
          </Select>
        )}
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

        <DialogContent className="sm:max-w-2xl">
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
                      <FieldLabel htmlFor={field.name}>Tags</FieldLabel>
                      <Combobox
                        value={field.state.value || []}
                        onValueChange={(val) => {
                          const formatted = val.map((t: string) => (t.startsWith('#') ? t : `#${t}`));
                          field.handleChange(formatted);
                          setTagInputValue('');
                        }}
                        inputValue={tagInputValue}
                        onInputValueChange={setTagInputValue}
                      >
                        <ComboboxAnchor className="w-full">
                          <TagsInput
                            value={field.state.value || []}
                            onValueChange={(val) => {
                              const formatted = val.map((t: string) => (t.startsWith('#') ? t : `#${t}`));
                              field.handleChange(formatted);
                              setTagInputValue('');
                            }}
                            className="w-full gap-0"
                          >
                            <TagsInputList className="w-full min-h-10 px-3 py-1.5 rounded-none border border-brand-border bg-white text-brand-charcoal text-sm focus-within:ring-1 focus-within:ring-brand-charcoal/30 flex flex-wrap items-center gap-1.5">
                              {(field.state.value || []).map((tag: string) => (
                                <TagsInputItem
                                  key={tag}
                                  value={tag}
                                  className="bg-brand-charcoal/5 border-brand-border text-brand-charcoal rounded-none text-xs py-0.5 px-2 gap-1"
                                >
                                  {tag}
                                </TagsInputItem>
                              ))}
                              <ComboboxChipsInput
                                render={
                                  <TagsInputInput
                                    placeholder="Select or add tags..."
                                    className="text-xs text-brand-charcoal placeholder:text-brand-muted outline-none focus:outline-none flex-1"
                                  />
                                }
                              />
                            </TagsInputList>
                          </TagsInput>
                        </ComboboxAnchor>
                        <ComboboxContent className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto bg-white border border-brand-border rounded-none shadow-sm z-50 p-1">
                          <ComboboxList className="no-scrollbar max-h-[200px] overflow-y-auto overscroll-contain">
                            {filteredTags.length === 0 ? (
                              <ComboboxEmpty className="py-4 text-center text-xs text-brand-muted">
                                {tagInputValue.trim() ? `Press enter to create "${tagInputValue}"` : 'No tags found.'}
                              </ComboboxEmpty>
                            ) : (
                              <ComboboxGroup>
                                {filteredTags.map((tag: any) => {
                                  const tagValue = `#${tag.name}`;
                                  const isSelected = (field.state.value || []).includes(tagValue);
                                  return (
                                    <ComboboxItem
                                      key={tag.id}
                                      value={tagValue}
                                      onClick={() => {
                                        const nextValue = isSelected
                                          ? field.state.value.filter((v: string) => v !== tagValue)
                                          : [...(field.state.value || []), tagValue];
                                        field.handleChange(nextValue);
                                        setTagInputValue('');
                                      }}
                                      className="cursor-pointer hover:bg-brand-canvas text-xs px-3 py-2 text-brand-charcoal flex justify-between items-center"
                                    >
                                      <span>{tagValue}</span>
                                    </ComboboxItem>
                                  );
                                })}
                              </ComboboxGroup>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
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
              <bookmarkForm.Subscribe
                selector={(state: any) => [state.isSubmitting]}
                children={([isSubmitting]: [boolean]) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 text-xs uppercase bg-brand-charcoal hover:bg-brand-charcoal/90 gap-1.5 flex items-center justify-center"
                  >
                    {isSubmitting && <Spinner className="w-3.5 h-3.5" />}
                    Save Bookmark
                  </Button>
                )}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Item>
  );
}
