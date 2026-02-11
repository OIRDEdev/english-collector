import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Languages, Settings, Shield, BarChart3, Layers, Brain } from "lucide-react";

interface Grupo {
  nome: string;
  cor: string;
  count: number;
}

interface DashboardSidebarProps {
  grupos: Grupo[];
  activeGroup: string | null;
  onGroupSelect: (group: string | null) => void;
  totalPhrases: number;
}

export function DashboardSidebar({
  grupos,
  activeGroup,
  onGroupSelect,
}: DashboardSidebarProps) {
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Languages className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">PolyGlotFlow</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === '/dashboard' && !activeGroup}
                  onClick={() => onGroupSelect(null)}
                  asChild={location.pathname !== '/dashboard'}
                  className="cursor-pointer"
                >
                  {location.pathname !== '/dashboard' ? (
                    <Link to="/dashboard">
                      <Layers className="w-4 h-4" />
                      <span>Todas as Frases</span>
                    </Link>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Todas as Frases</span>
                    </>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/exercises'}>
                  <Link to="/exercises">
                    <Brain className="w-4 h-4" />
                    <span>Exercícios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <BarChart3 className="w-4 h-4" />
                    <span>Estatísticas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Language Groups */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider">
            Grupos Linguísticos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {grupos.map((grupo) => (
                <SidebarMenuItem key={grupo.nome}>
                  <SidebarMenuButton
                    isActive={activeGroup === grupo.nome}
                    onClick={() => onGroupSelect(grupo.nome)}
                    className="cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: grupo.cor }}
                    />
                    <span>{grupo.nome}</span>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {grupo.count}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 text-xs uppercase tracking-wider">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <Shield className="w-4 h-4" />
                    <span>Sites Bloqueados</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <Settings className="w-4 h-4" />
                    <span>Preferências</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Usuário</p>
            <p className="text-xs text-muted-foreground truncate">usuario@email.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
