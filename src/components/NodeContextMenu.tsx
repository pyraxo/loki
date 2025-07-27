import { Copy } from "lucide-react";
import { useStore } from "@/lib/store";
import type { CustomNode } from "@/types/nodes";
import { useEffect, useRef } from "react";

interface NodeContextMenuProps {
  node: CustomNode;
  onClose: () => void;
  x: number;
  y: number;
}

export function NodeContextMenu({ node, onClose, x, y }: NodeContextMenuProps) {
  const { duplicateNode } = useStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDuplicate = () => {
    duplicateNode(node.id);
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Use setTimeout to ensure event listeners are added after the current event loop
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover text-popover-foreground shadow-md border rounded-md p-1 w-48"
      style={{ left: x, top: y }}
    >
      <div
        className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
        onClick={handleDuplicate}
      >
        <Copy className="w-4 h-4 mr-2" />
        <span>Duplicate</span>
      </div>
    </div>
  );
}