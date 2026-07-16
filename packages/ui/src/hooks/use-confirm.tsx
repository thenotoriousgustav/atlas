"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@atlas/ui/components/alert-dialog";

interface ConfirmOptions {
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    cancelLabel: string;
    variant: "default" | "destructive";
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        title: options.title || "Are you sure?",
        description: options.description || "This action cannot be undone.",
        actionLabel: options.actionLabel || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    if (state) {
      state.resolve(false);
      setState(null);
    }
  };

  const handleConfirm = () => {
    if (state) {
      state.resolve(true);
      setState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <AlertDialog
          open={state.isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{state.title}</AlertDialogTitle>
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>
                {state.cancelLabel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                variant={state.variant === "destructive" ? "destructive" : "default"}
              >
                {state.actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
