import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Canvas from "@/components/canvas";
import LeftSidebar from "@/components/left-sidebar";
// import RightSidebar from "@/components/right-sidebar";
import AppHeader from "@/components/app-header";
import {
  useAutoSave,
  useSessionShortcuts,
  useUnsavedChangesWarning,
} from "@/lib/session-utils";

export default function Index() {
  // Enable session management features
  useAutoSave(30000); // Auto-save every 30 seconds
  useSessionShortcuts(); // Keyboard shortcuts
  useUnsavedChangesWarning(); // Warn about unsaved changes

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
