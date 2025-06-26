import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Canvas from "@/components/canvas";
import LeftSidebar from "@/components/left-sidebar";
// import RightSidebar from "@/components/right-sidebar";
import AppHeader from "@/components/app-header";

export default function Index() {
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
