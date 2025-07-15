import SidebarFooterComponent from "@/components/sidebar-footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NodeLibrary from "./session/NodeLibrary";
import SessionList from "./session/SessionList";

export default function LeftSidebar() {
  return (
    <Sidebar className="select-none" collapsible="offcanvas">
      <SidebarHeader className="pt-4"></SidebarHeader>

      <SidebarContent className="p-0">
        <Tabs defaultValue="sessions" className="h-full flex flex-col">
          <div className="px-4 pt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="sessions" className="h-full m-0 p-0">
              <SessionList />
            </TabsContent>

            <TabsContent value="nodes" className="h-full m-0 p-0">
              <NodeLibrary />
            </TabsContent>
          </div>
        </Tabs>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarFooterComponent />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
