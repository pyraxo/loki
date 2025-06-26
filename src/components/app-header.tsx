export default function AppHeader() {
  return (
    <header className="titlebar bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div
        data-tauri-drag-region
        className="flex h-(--header-height) w-full items-center gap-2 px-4"
      >
        <div className="flex h-8 w-8 items-center justify-center"></div>
      </div>
    </header>
  );
}
