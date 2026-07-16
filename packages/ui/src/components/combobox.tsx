"use client"

import * as React from "react"
import { Popover } from "radix-ui"
import { cn } from "@atlas/ui/lib/utils"
import { CaretDown, Check } from "@phosphor-icons/react"

interface ComboboxContextType {
  value: string[];
  onValueChange: (value: string[]) => void;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ComboboxContext = React.createContext<ComboboxContextType | null>(null);

function useCombobox() {
  const context = React.useContext(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be used within a Combobox");
  }
  return context;
}

function Combobox({
  value,
  onValueChange,
  inputValue,
  onInputValueChange,
  children,
  ...props
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  inputValue: string;
  onInputValueChange: (value: string) => void;
  multiple?: boolean;
  items?: any[];
  filter?: any;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <ComboboxContext.Provider
      value={{
        value,
        onValueChange,
        inputValue,
        onInputValueChange,
        open,
        setOpen,
      }}
    >
      <Popover.Root open={open} onOpenChange={setOpen}>
        {children}
      </Popover.Root>
    </ComboboxContext.Provider>
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

function ComboboxAnchor({ children, ...props }: React.ComponentProps<typeof Popover.Anchor>) {
  return <Popover.Anchor {...props}>{children}</Popover.Anchor>;
}

function ComboboxChipsInput({
  render,
  className,
  ...props
}: {
  render?: React.ReactElement;
  className?: string;
  [key: string]: any;
}) {
  const { inputValue, onInputValueChange, setOpen } = useCombobox();

  const handleFocus = () => {
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInputValueChange(e.target.value);
  };

  const inputProps = {
    value: inputValue,
    onChange: handleChange,
    onFocus: handleFocus,
    className: cn("min-w-16 flex-1 outline-none", className),
    ...props,
  };

  if (render) {
    return React.cloneElement(render, inputProps);
  }

  return <input {...inputProps} />;
}

// Alias ComboboxInput to ComboboxChipsInput for full compatibility
const ComboboxInput = ComboboxChipsInput;

function ComboboxTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { open, setOpen } = useCombobox();
  return (
    <Popover.Trigger asChild>
      <button
        type="button"
        data-slot="combobox-trigger"
        onClick={() => setOpen(!open)}
        className={cn("[&_svg:not([class*='size-'])]:size-4 flex items-center justify-center cursor-pointer", className)}
        {...props}
      >
        <CaretDown className="pointer-events-none size-4 text-brand-muted" />
      </button>
    </Popover.Trigger>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  container,
  children,
  ...props
}: React.ComponentProps<typeof Popover.Content> & {
  container?: any;
  anchor?: any;
}) {
  const content = (
    <Popover.Content
      side={side}
      sideOffset={sideOffset}
      align={align}
      onOpenAutoFocus={(e) => e.preventDefault()}
      onCloseAutoFocus={(e) => e.preventDefault()}
      className={cn(
        "z-50 min-w-32 rounded-none border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      {children}
    </Popover.Content>
  );

  if (container) {
    const containerElement = container && "current" in container ? container.current : container;
    if (containerElement) {
      return <Popover.Portal container={containerElement}>{content}</Popover.Portal>;
    }
  }

  return <Popover.Portal>{content}</Popover.Portal>;
}

function ComboboxList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[200px] overflow-y-auto overscroll-contain",
        className
      )}
      {...props}
    />
  );
}

// Re-map cmdk/diceui style names for full flexibility
const ComboboxGroup = ({ className, ...props }: React.ComponentProps<"div">) => {
  return <div className={cn("p-1", className)} {...props} />;
};

const ComboboxLabel = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn("px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    />
  );
};

function ComboboxItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<"div"> & { value?: string }) {
  const { value: selectedValues } = useCombobox();
  const isSelected = value ? selectedValues.includes(value) : false;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-default items-center rounded-none py-1.5 px-3 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="absolute right-2 flex size-4 items-center justify-center">
          <Check className="size-4" />
        </span>
      )}
    </div>
  );
}

function ComboboxEmpty({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("py-6 text-center text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ComboboxSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />;
}

// Dummy / Unused components for full backwards compatibility
const ComboboxCollection = ({ children }: { children: React.ReactNode }) => children;
const ComboboxChips = ({ children }: { children: React.ReactNode }) => children;
const ComboboxChip = ({ children }: { children: React.ReactNode }) => children;
const ComboboxValue = () => null;

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
  ComboboxAnchor,
}
