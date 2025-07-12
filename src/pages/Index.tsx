import Canvas from "@/components/canvas";
import LeftSidebar from "@/components/left-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import RightSidebar from "@/components/right-sidebar";
import AppHeader from "@/components/app-header";
import { useThemeSync } from "@/hooks/use-theme-sync";
import {
  useAutoSave,
  useSessionShortcuts,
  useUnsavedChangesWarning,
} from "@/lib/session-utils";
import { useStore } from "@/lib/store";

export default function Index() {
  // Get autosave interval from settings
  const { settings } = useStore();

  // Enable session management features
  useAutoSave(settings.autoSaveInterval * 1000); // Convert seconds to milliseconds
  useSessionShortcuts(); // Keyboard shortcuts
  useUnsavedChangesWarning(); // Warn about unsaved changes

  // Enable theme synchronization
  useThemeSync(); // Sync themes between next-themes and store

  return (
    <SidebarProvider className="flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <LeftSidebar />
        <SidebarInset>
          <Canvas />
        </SidebarInset>
        {/* <RightSidebar /> */}
      </div>
    </SidebarProvider>
  );
}
