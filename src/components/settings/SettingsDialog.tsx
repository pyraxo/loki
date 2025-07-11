import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import ProviderSettingsTab from "./ProviderSettingsTab";
import AppearanceTab from "./AppearanceTab";
import PreferencesTab from "./PreferencesTab";
import AdvancedTab from "./AdvancedTab";

export default function SettingsDialog() {
  const { settingsDialog, closeSettingsDialog } = useStore();

  return (
    <Dialog open={settingsDialog.isOpen} onOpenChange={closeSettingsDialog}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your LLM providers, appearance, and application
            preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={settingsDialog.activeTab}
            onValueChange={(tab) => {
              // Update active tab without opening if already open
              const { settingsDialog } = useStore.getState();
              useStore.setState({
                settingsDialog: { ...settingsDialog, activeTab: tab },
              });
            }}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="providers" className="h-full m-0">
                <ProviderSettingsTab />
              </TabsContent>

              <TabsContent value="appearance" className="h-full m-0">
                <AppearanceTab />
              </TabsContent>

              <TabsContent value="preferences" className="h-full m-0">
                <PreferencesTab />
              </TabsContent>

              <TabsContent value="advanced" className="h-full m-0">
                <AdvancedTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
