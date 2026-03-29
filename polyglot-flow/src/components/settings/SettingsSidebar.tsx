import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { ArrowLeft, Puzzle, Globe, Palette, CreditCard } from "lucide-react";

export const SETTINGS_TABS = [
  { id: "extension", label: "Extensão", icon: Puzzle, description: "Configurações da extensão", path: "/settings" },
  { id: "language", label: "Idiomas", icon: Globe, description: "Preferências de idioma", path: "/settings?tab=language" },
  { id: "appearance", label: "Aparência", icon: Palette, description: "Tema e visual", path: "/settings?tab=appearance" },
  { id: "payment", label: "Pagamento", icon: CreditCard, description: "Plano e faturamento", path: "/settings?tab=payment" },
] as const;

export type TabId = (typeof SETTINGS_TABS)[number]["id"];

interface SettingsSidebarProps {
  activeTab: TabId;
  onTabSelect: (tabId: TabId) => void;
}

export function SettingsSidebar({ activeTab, onTabSelect }: SettingsSidebarProps) {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const handleTabClick = (tabId: TabId) => {
    onTabSelect(tabId);
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Voltar ao Dashboard</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      isActive={activeTab === tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className="cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 w-full text-center">
             <p className="text-[10px] text-muted-foreground/40">PolyGlotFlow v1.0</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
