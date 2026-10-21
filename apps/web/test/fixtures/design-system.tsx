// Test-only component catalogue. Not an application route or production data.
import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Button } from "../../src/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../../src/components/ui/card"
import { Input } from "../../src/components/ui/input"
import { InputGroup, InputGroupInput, InputGroupAddon } from "../../src/components/ui/input-group"
import { Textarea } from "../../src/components/ui/textarea"
import { Badge } from "../../src/components/ui/badge"
import { Checkbox } from "../../src/components/ui/checkbox"
import { Switch } from "../../src/components/ui/switch"
import { Alert, AlertDescription } from "../../src/components/ui/alert"
import { Skeleton } from "../../src/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "../../src/components/ui/toggle-group"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../src/components/ui/tabs"
import { Calendar } from "../../src/components/ui/calendar"
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from "../../src/components/ui/command"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "../../src/components/ui/dropdown-menu"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "../../src/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "../../src/components/ui/popover"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../../src/components/ui/tooltip"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "../../src/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel } from "../../src/components/ui/alert-dialog"
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription } from "../../src/components/ui/drawer"
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "../../src/components/ui/sheet"
import { DownloadMediaDialog } from "../../src/app/cabinet/components/download-media-dialog"

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
for (const id of [1, 2]) client.setQueryData(["cabinet-media-extract", `https://vimeo.com/fixture-${id}`], {
  title: `Typography study ${id}`, author: "Reading studio", duration: 125, thumbnail: null, platform: "Vimeo",
  formats: [
    { formatId: `v${id}`, ext: "mp4", resolution: "1080p", filesize: 1048576, note: "Video", hasVideo: true, hasAudio: true },
    { formatId: `a${id}`, ext: "mp3", resolution: "Audio", filesize: 524288, note: "Audio", hasVideo: false, hasAudio: true },
  ],
})
function Catalogue() {
  const [command, setCommand] = React.useState(false)
  const [chosen, setChosen] = React.useState("")
  const [media, setMedia] = React.useState<any>(null)
  return <QueryClientProvider client={client}><TooltipProvider><main className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-2">
    <h1 className="text-2xl font-semibold md:col-span-2">Component checks</h1>
    <Card><CardHeader className="p-4"><CardTitle>Controls</CardTitle></CardHeader><CardContent className="flex flex-col gap-3 p-4">
      <Input aria-label="Plain input" placeholder="Input" /><InputGroup><InputGroupInput aria-label="Grouped input" placeholder="Grouped input" /><InputGroupAddon>URL</InputGroupAddon></InputGroup>
      <Textarea aria-label="Text area" placeholder="Text area" /><div className="flex flex-wrap items-center gap-3"><Checkbox aria-label="Checkbox" /><Switch aria-label="Switch" /><Badge>Saved</Badge><Button size="icon-xs" aria-label="Icon action">×</Button><Button variant="destructive">Delete item</Button><Button disabled>Disabled</Button></div>
      <Alert variant="success"><AlertDescription>Preferences saved.</AlertDescription></Alert><Skeleton className="h-4 w-32" />
    </CardContent></Card>
    <Card><CardHeader className="p-4"><CardTitle>Menus and overlays</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3 p-4">
      <Button onClick={() => setCommand(true)}>Open commands</Button>
      <CommandDialog open={command} onOpenChange={setCommand}><CommandInput aria-label="Find command" /><CommandList><CommandGroup heading="Actions"><CommandItem onSelect={() => { setChosen("bookmark"); setCommand(false) }}>Save bookmark</CommandItem><CommandItem onSelect={() => { setChosen("folder"); setCommand(false) }}>Create folder</CommandItem></CommandGroup></CommandList></CommandDialog>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Open menu</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuGroup><DropdownMenuItem>Menu action</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
      <Select defaultValue="one"><SelectTrigger size="sm" aria-label="Small select"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="one">One</SelectItem><SelectItem value="two">Two</SelectItem></SelectGroup></SelectContent></Select>
      <Popover><PopoverTrigger asChild><Button variant="outline">Open popover</Button></PopoverTrigger><PopoverContent>Popover content</PopoverContent></Popover>
      <Tooltip><TooltipTrigger asChild><Button variant="outline">Hover help</Button></TooltipTrigger><TooltipContent>Help text</TooltipContent></Tooltip>
      <Dialog><DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger><DialogContent><DialogTitle>Dialog title</DialogTitle><DialogDescription>Dialog description.</DialogDescription></DialogContent></Dialog>
      <AlertDialog><AlertDialogTrigger asChild><Button variant="outline">Open confirmation</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Confirm action</AlertDialogTitle><AlertDialogDescription>No data will be changed.</AlertDialogDescription><AlertDialogCancel>Cancel confirmation</AlertDialogCancel></AlertDialogContent></AlertDialog>
      <Drawer><DrawerTrigger asChild><Button variant="outline">Open drawer</Button></DrawerTrigger><DrawerContent><DrawerTitle>Drawer title</DrawerTitle><DrawerDescription>Drawer description.</DrawerDescription></DrawerContent></Drawer>
      <Sheet><SheetTrigger asChild><Button variant="outline">Open sheet</Button></SheetTrigger><SheetContent><SheetTitle>Sheet title</SheetTitle><SheetDescription>Sheet description.</SheetDescription></SheetContent></Sheet>
      {[1, 2].map((id) => <Button key={id} variant="outline" onClick={() => setMedia({ id, title: `Typography study ${id}`, url: `https://vimeo.com/fixture-${id}` })}>Open media {id}</Button>)}
      <DownloadMediaDialog bookmark={media} isOpen={!!media} onClose={() => setMedia(null)} />
      <output id="chosen">{chosen}</output>
    </CardContent></Card>
    <Card><CardHeader className="p-4"><CardTitle>Connected controls</CardTitle></CardHeader><CardContent className="flex flex-col gap-4 p-4">
      <ToggleGroup type="single" spacing={0} variant="outline" defaultValue="one" aria-label="Connected choices"><ToggleGroupItem value="one">First</ToggleGroupItem><ToggleGroupItem value="two">Last</ToggleGroupItem></ToggleGroup>
      <Tabs defaultValue="one"><TabsList><TabsTrigger value="one">First tab</TabsTrigger><TabsTrigger value="two">Second tab</TabsTrigger></TabsList><TabsContent value="one">First panel</TabsContent><TabsContent value="two">Second panel</TabsContent></Tabs>
    </CardContent></Card>
    <Card><CardContent className="p-4"><Calendar mode="single" defaultMonth={new Date(2026, 9, 1)} selected={new Date(2026, 9, 20)} /></CardContent></Card>
  </main></TooltipProvider></QueryClientProvider>
}
createRoot(document.getElementById("root")!).render(<Catalogue />)
