import ThemeToggle from "@/components/theme-toggle";

export default function AppHeader() {
  return (
    <header className="titlebar bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div
        data-tauri-drag-region
        className="flex h-10 w-full items-center justify-between gap-2 px-4"
      >
        {/* Left side - Logo/Icon area */}
        <div className="flex h-8 w-8 items-center justify-center">
          {/* Icon/Logo placeholder */}
        </div>

        {/* Right side - Theme toggle (not draggable) */}
        <div className="flex items-center gap-2" data-tauri-drag-region="false">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
