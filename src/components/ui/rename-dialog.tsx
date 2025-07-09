import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";

export function RenameDialog() {
  const { renameDialog, hideRenameDialog } = useStore();
  const [inputValue, setInputValue] = useState("");

  // Update input value when dialog opens and handle auto-select
  useEffect(() => {
    if (renameDialog.isOpen) {
      setInputValue(renameDialog.currentValue);
      // Auto-select the text when dialog opens
      setTimeout(() => {
        const input = document.querySelector(
          'input[placeholder="Session name"]'
        ) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 100);
    }
  }, [renameDialog.isOpen, renameDialog.currentValue]);

  const handleConfirm = () => {
    const trimmedValue = inputValue.trim();
    if (
      trimmedValue &&
      trimmedValue !== renameDialog.currentValue &&
      renameDialog.onConfirm
    ) {
      renameDialog.onConfirm(trimmedValue);
    }
    hideRenameDialog();
  };

  const handleCancel = () => {
    hideRenameDialog();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Dialog open={renameDialog.isOpen} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{renameDialog.title}</DialogTitle>
          <DialogDescription>
            Enter a new name for this session.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Session name"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !inputValue.trim() ||
              inputValue.trim() === renameDialog.currentValue
            }
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
