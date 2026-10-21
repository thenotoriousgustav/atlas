# Cabinet design system

The application uses the existing shadcn/Radix components, Geist interface text, an Instrument Serif identity, Phosphor icons, and semantic light/dark tokens. Local component styling is authoritative; the registry preset is not a reason to restore square controls.

## Shape tokens

Defined once in `apps/web/src/app/globals.css` and mapped to Tailwind utilities:

| Role | Token | Utility | Uses |
| --- | --- | --- | --- |
| Small details | `--radius-chip: 4px` | `rounded-sm` | Badges, tags, checkboxes, small thumbnails |
| Controls | `--radius-control: 6px` | `rounded-md` | Buttons, inputs, command/menu/select items, segmented-control outer edges |
| Panels | `--radius-panel: 8px` | `rounded-lg` | Cards, menus, popovers, alerts, skeleton panels |
| Overlays | `--radius-overlay: 12px` | `rounded-xl` | Dialogs and confirmation dialogs; exposed drawer/sheet corners |

`--radius` remains an 8px compatibility alias for existing editor styles. Editor buttons, menu items, hover indicators and link inputs use the control token. Do not force an unrelated radius with `!important` or a dialog-descendant override.

### Intentional square interiors

Not every DOM element is a surface. The following remain flat deliberately:

- Inner inputs/textareas inside an already rounded InputGroup.
- Inner seams of connected ToggleGroup/ButtonGroup controls. The first/last exposed edges are rounded.
- Middle cells of a continuous calendar range; selected endpoints use the control radius.
- Images clipped by an already rounded Card.
- The tooltip arrow and the transparent underline-tab track.
- Document tables, resize indicators, and editor geometry are content/tools, not application panels.

`test/design-system.test.mjs` permits only the reviewed `rounded-none` cases. Adding an exception requires updating that test and explaining its purpose.

## Typography and colour

- Interface text and menu items: 14px. Labels and secondary metadata: 12px. Modal titles: 16px. Collection title: 24px.
- Inputs use 16px on small screens to avoid browser focus zoom; desktop inputs use 14px.
- Monospace belongs to code/technical content, not navigation or ordinary metadata.
- Use `background`, `card`, `popover`, `foreground`, `muted-foreground`, `border`, `input`, `primary`, `destructive`, and `positive` tokens.
- Primary and sidebar chrome remain neutral. Olive marks focus/selection and content state.
- Rich-text colours, syntax highlighting, image pixels and external websites are user content and are not recoloured to imitate chrome.
- Do not redefine Tailwind's white token in dark mode. The iframe's white background is an intentional external-document fallback.
- Resting panels have a quiet border or tone step; shadows are reserved for floating overlays. Reduced motion is supported globally.

## Native shadcn sidebar

`components/ui/sidebar.tsx` and `hooks/use-mobile.ts` were taken from the configured official shadcn registry using its CLI. Existing Button, Input, Sheet, Tooltip and Skeleton files were preserved rather than overwritten. The registry's `cn` import is mapped to the existing `@/lib/utils`; no extra package is needed.

Composition in Cabinet:

```text
SidebarProvider
  Sortable drag context
    Sidebar (offcanvas)
      SidebarHeader: Cabinet identity and tagline
      SidebarContent: native groups, menus, badges, folder tree, tags and import
      SidebarFooter: account/settings menu
    SidebarInset
      WorkspaceHeader: SidebarTrigger, search and Add
      Bookmark collection
```

The provider owns `Cmd/Ctrl+B` and mobile Sheet state. Do not add a second sidebar shortcut listener. Desktop collapsed state retains the existing local storage preference. Mobile bottom-nav destinations open the same sidebar, not a duplicate filter drawer. Selecting a folder clears incompatible type/status scopes; selecting a mobile destination closes the Sheet. The folder tree retains its existing drag/drop targets and permission guards.

## Audit and checks

The audit covers shared primitives, app-level overrides, login/invitation/public collection surfaces, bulk actions, folder/tag/bookmark/media dialogs, and editor controls. Source checks reject new unreviewed square-corner overrides, sub-11px utility labels and undefined legacy colour tokens.

Run from `apps/web`:

```bash
pnpm exec tsc --noEmit
pnpm test
node test/design-system.browser.mjs
node test/cabinet-comfort.browser.mjs
node test/cabinet-productivity.browser.mjs
node test/moodboard.browser.mjs
node test/folder-collaboration.browser.mjs
node test/shared-collection.browser.mjs
pnpm exec next build
```

The component browser check loads actual primitives and verifies computed radii in both themes at desktop/phone widths, keyboard command selection, menus/selects, dialogs/confirmations, drawer/sheet edges, tooltips, connected controls, calendar selection, and media-format state. The Cabinet browser check additionally verifies the real application shell, one sidebar implementation, identity placement, collapsed-state persistence, keyboard shortcuts and mobile navigation.

Editor inputs and tabs now reuse the shared Input/Tabs primitives, including responsive input typography, visible focus, roving keyboard navigation and ARIA relationships. Small controls retain the 6px control radius; only badges/details use 4px. Semantic destructive text and button backgrounds are verified for readable contrast in the component browser check.

The productivity browser check additionally covers serial Inspector autosave, explicit field clears, navigation flush, offline retry and draft recovery; global paginated search; desktop/mobile duplicate notices; clipboard Edit and Unsorted movement; and slow/blocked-preview alternatives. These checks cover specific states, not a blanket guarantee that every possible application state is visually compliant.

Browser fixtures are isolated under `test/fixtures/`. They are not application routes and do not modify real account data. Live database/OAuth integrations are separate checks.
