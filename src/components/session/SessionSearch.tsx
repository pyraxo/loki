import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

interface SessionSearchProps {
  placeholder?: string;
  className?: string;
}

export default function SessionSearch({
  placeholder = "Search sessions...",
  className = "",
}: SessionSearchProps) {
  const { searchQuery, setSearchQuery } = useStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, setSearchQuery]);

  // Sync with store updates
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {localQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
