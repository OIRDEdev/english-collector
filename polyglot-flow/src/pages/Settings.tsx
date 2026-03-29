import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

import { SettingsSidebar, SETTINGS_TABS, TabId } from "@/components/settings/SettingsSidebar";
import { ExtensionSettings } from "@/components/settings/ExtensionSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { PaymentSettings } from "@/components/settings/PaymentSettings";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("extension");

  // Sync activeTab with URL search params
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as TabId | null;
    if (tabFromUrl && SETTINGS_TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabSelect = (tabId: TabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "extension":
        return <ExtensionSettings />;
      case "language":
        return <LanguageSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "payment":
        return <PaymentSettings />;
      default:
        return <ExtensionSettings />;
    }
  };

  const activeTabData = SETTINGS_TABS.find((t) => t.id === activeTab);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SettingsSidebar activeTab={activeTab} onTabSelect={handleTabSelect} />

        <main className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-6">
              <Menu className="h-10 w-10" />
            </SidebarTrigger>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {activeTabData?.label || "Configurações"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeTabData?.description || "Preferências"}
              </p>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 flex flex-col items-center">
            {/* Limit max width nicely for setting elements */}
            <div className="w-full max-w-4xl">
              {renderPanel()}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
