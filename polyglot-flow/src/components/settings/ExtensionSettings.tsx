import { useState } from "react";
import { cn } from "@/lib/utils";
import { Monitor, MousePointerClick, Bell, Clock, RefreshCw } from "lucide-react";

interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          "w-11 h-6 rounded-full transition-all duration-200 relative",
          enabled ? "bg-primary" : "bg-white/10"
        )}
      >
        <div
          className={cn(
            "w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200",
            enabled ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

export function ExtensionSettings() {
  const [autoCapture, setAutoCapture] = useState(true);
  const [showPopup, setShowPopup] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [syncInterval, setSyncInterval] = useState("30");
  const [captureMode, setCaptureMode] = useState("selection");

  return (
    <div className="space-y-8">
      {/* Capture Section */}
      <section className="space-y-1">
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <MousePointerClick className="w-3.5 h-3.5" />
          Captura
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-4 space-y-1 divide-y divide-white/5">
          <Toggle
            enabled={autoCapture}
            onChange={setAutoCapture}
            label="Captura automática"
            description="Captura frases selecionadas automaticamente"
          />
          <Toggle
            enabled={showPopup}
            onChange={setShowPopup}
            label="Popup on selection"
            description="Mostrar popup ao selecionar texto"
          />

          <div className="py-3">
            <p className="text-sm font-medium text-foreground mb-2">Modo de captura</p>
            <div className="flex gap-2">
              {[
                { id: "selection", label: "Seleção" },
                { id: "shortcut", label: "Atalho" },
                { id: "both", label: "Ambos" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setCaptureMode(mode.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    captureMode === mode.id
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sync Section */}
      <section className="space-y-1">
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronização
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-4 space-y-3">
          <div className="py-2">
            <p className="text-sm font-medium text-foreground mb-2">Intervalo de sync</p>
            <div className="flex gap-2">
              {["15", "30", "60", "120"].map((val) => (
                <button
                  key={val}
                  onClick={() => setSyncInterval(val)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    syncInterval === val
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "bg-white/5 text-muted-foreground border border-white/5 hover:bg-white/10"
                  )}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-1">
        <h4 className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold flex items-center gap-2 mb-4">
          <Bell className="w-3.5 h-3.5" />
          Notificações
        </h4>

        <div className="bg-card/20 border border-white/5 rounded-xl p-4">
          <Toggle
            enabled={notifications}
            onChange={setNotifications}
            label="Notificações do navegador"
            description="Receber alertas de novas traduções e lembretes"
          />
        </div>
      </section>
    </div>
  );
}
