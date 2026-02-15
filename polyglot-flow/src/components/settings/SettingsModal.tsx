import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Puzzle, Globe, Palette, CreditCard } from "lucide-react";
import { ExtensionSettings } from "@/components/settings/ExtensionSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { PaymentSettings } from "@/components/settings/PaymentSettings";

const TABS = [
  { id: "extension", label: "Extensão", icon: Puzzle, description: "Configurações da extensão" },
  { id: "language", label: "Idiomas", icon: Globe, description: "Preferências de idioma" },
  { id: "appearance", label: "Aparência", icon: Palette, description: "Tema e visual" },
  { id: "payment", label: "Pagamento", icon: CreditCard, description: "Plano e faturamento" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("extension");

  if (!open) return null;

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
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[90vw] max-w-[900px] h-[80vh] max-h-[640px] bg-background border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Internal Sidebar */}
        <aside className="w-56 shrink-0 border-r border-white/5 bg-card/30 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-white/5">
            <h2 className="text-base font-bold text-foreground">Configurações</h2>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1">Preferências</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
                  <span className="truncate font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground/40 text-center">PolyGlotFlow v1.0</p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-xs text-muted-foreground/60">
                {TABS.find((t) => t.id === activeTab)?.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-auto p-6">
            {renderPanel()}
          </div>
        </div>
      </div>
    </div>
  );
}
