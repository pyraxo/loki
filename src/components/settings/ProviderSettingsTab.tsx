import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { PROVIDER_METADATA, type LLMProvider } from "@/types/settings";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  TestTube2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export default function ProviderSettingsTab() {
  const { settings, updateProviderSettings, setApiKey, getApiKey } = useStore();
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  // Load API key for display
  const loadApiKey = async (provider: LLMProvider) => {
    const key = await getApiKey(provider);
    if (key) {
      setApiKeys((prev) => ({ ...prev, [provider]: key }));
    }
  };

  const handleProviderToggle = async (
    provider: LLMProvider,
    enabled: boolean
  ) => {
    await updateProviderSettings(provider, { enabled });
  };

  const handleApiKeyChange = (provider: LLMProvider, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleApiKeySave = async (provider: LLMProvider) => {
    const key = apiKeys[provider];
    if (key) {
      setSavingProvider(provider);
      setSaveErrors((prev) => ({ ...prev, [provider]: "" }));
      setSaveSuccess((prev) => ({ ...prev, [provider]: false }));

      try {
        await setApiKey(provider, key);
        setSaveSuccess((prev) => ({ ...prev, [provider]: true }));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess((prev) => ({ ...prev, [provider]: false }));
        }, 3000);
      } catch (error) {
        console.error("Failed to save API key:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save API key";
        setSaveErrors((prev) => ({ ...prev, [provider]: errorMessage }));
      } finally {
        setSavingProvider(null);
      }
    }
  };

  const toggleApiKeyVisibility = async (provider: LLMProvider) => {
    const isVisible = showApiKeys[provider];
    if (!isVisible && !apiKeys[provider]) {
      await loadApiKey(provider);
    }
    setShowApiKeys((prev) => ({ ...prev, [provider]: !isVisible }));
  };

  const testConnection = async (provider: LLMProvider) => {
    setTestingProvider(provider);
    setSaveErrors((prev) => ({ ...prev, [provider]: "" }));
    setSaveSuccess((prev) => ({ ...prev, [provider]: false }));

    try {
      // Import settingsService to test connection
      const { settingsService } = await import("@/lib/settings-service");
      const isValid = await settingsService.testProviderConnection(provider);

      if (isValid) {
        setSaveSuccess((prev) => ({ ...prev, [provider]: true }));
        setTimeout(() => {
          setSaveSuccess((prev) => ({ ...prev, [provider]: false }));
        }, 3000);
      } else {
        setSaveErrors((prev) => ({
          ...prev,
          [provider]: "Connection test failed. Please check your API key.",
        }));
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setSaveErrors((prev) => ({
        ...prev,
        [provider]: "Connection test failed. Please check your API key.",
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const getProviderIcon = (provider: LLMProvider) => {
    const enabled = settings.providers[provider].enabled;
    if (testingProvider === provider) {
      return <TestTube2 className="h-4 w-4 animate-spin" />;
    }
    return enabled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );
  };

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Configure your LLM providers. API keys are stored securely and never
          leave your device.
        </div>

        {Object.entries(PROVIDER_METADATA).map(([provider, metadata]) => {
          const providerKey = provider as LLMProvider;
          const config = settings.providers[providerKey];
          const isVisible = showApiKeys[provider];
          const currentApiKey = apiKeys[provider] || "";

          return (
            <Card key={provider} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(providerKey)}
                    <div>
                      <CardTitle className="text-base">
                        {metadata.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {metadata.description}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {config.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Enabled
                      </Badge>
                    )}
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled: boolean) =>
                        handleProviderToggle(providerKey, enabled)
                      }
                    />
                  </div>
                </div>
              </CardHeader>

              {config.enabled && (
                <CardContent className="space-y-4">
                  {metadata.requiresApiKey && (
                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${provider}`}>API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={`api-key-${provider}`}
                            type={isVisible ? "text" : "password"}
                            placeholder={`Enter your ${metadata.name} API key`}
                            value={currentApiKey}
                            onChange={(e) =>
                              handleApiKeyChange(providerKey, e.target.value)
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleApiKeyVisibility(providerKey)}
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleApiKeySave(providerKey)}
                          disabled={
                            !currentApiKey || savingProvider === provider
                          }
                          size="sm"
                          variant={
                            saveSuccess[provider] ? "default" : "outline"
                          }
                        >
                          {savingProvider === provider ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : saveSuccess[provider] ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Saved!
                            </>
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                      {saveErrors[provider] && (
                        <p className="text-xs text-red-500">
                          {saveErrors[provider]}
                        </p>
                      )}
                      {!saveErrors[provider] && !saveSuccess[provider] && (
                        <p className="text-xs text-muted-foreground">
                          Save your API key, then test the connection to
                          validate it works
                        </p>
                      )}
                      {saveSuccess[provider] && (
                        <p className="text-xs text-green-600">
                          ✓ API key saved successfully
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Available Models</Label>
                    <div className="flex flex-wrap gap-1">
                      {metadata.models.map((model) => (
                        <Badge
                          key={model}
                          variant="outline"
                          className="text-xs"
                        >
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(providerKey)}
                      disabled={testingProvider === provider || !currentApiKey}
                    >
                      {testingProvider === provider ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
