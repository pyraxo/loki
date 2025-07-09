import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function ConfirmationDialog() {
  const { confirmationDialog, hideConfirmationDialog } = useStore();

  const handleConfirm = () => {
    if (confirmationDialog.onConfirm) {
      confirmationDialog.onConfirm();
    }
    hideConfirmationDialog();
  };

  const handleCancel = () => {
    hideConfirmationDialog();
  };

  return (
    <Dialog open={confirmationDialog.isOpen} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmationDialog.title}</DialogTitle>
          <DialogDescription>
            {confirmationDialog.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
