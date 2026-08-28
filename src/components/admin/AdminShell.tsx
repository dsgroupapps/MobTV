import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Ban,
  BarChart3,
  CalendarDays,
  Clock,
  DollarSign,
  FileCheck2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Megaphone,
  Menu,
  Monitor,
  MonitorPlay,
  Plus,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { logout } from "@/lib/auth/functions";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

type AdminShellProps = { user: AuthUser; children: ReactNode };
type AdminPath =
  | "/admin"
  | "/admin/usuarios"
  | "/admin/campanhas"
  | "/admin/campanhas/nova"
  | "/admin/inventario"
  | "/admin/inventario/ativos"
  | "/admin/formatos"
  | "/admin/horarios"
  | "/admin/precos"
  | "/admin/bloqueios"
  | "/admin/moderacao"
  | "/admin/players"
  | "/admin/analytics";
type NavigationItem = {
  label: string;
  to: AdminPath;
  icon: LucideIcon;
  adminOnly?: boolean;
  exact?: boolean;
};

const NAVIGATION: NavigationItem[] = [
  { label: "Visão geral", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Usuários", to: "/admin/usuarios", icon: Users, adminOnly: true },
  { label: "Campanhas", to: "/admin/campanhas", icon: Megaphone },
  { label: "Inventário", to: "/admin/inventario", icon: CalendarDays, exact: true },
  { label: "Ativos", to: "/admin/inventario/ativos", icon: Monitor },
  { label: "Formatos", to: "/admin/formatos", icon: Settings },
  { label: "Horários", to: "/admin/horarios", icon: Clock },
  { label: "Preços", to: "/admin/precos", icon: DollarSign },
  { label: "Bloqueios", to: "/admin/bloqueios", icon: Ban },
  { label: "Moderação", to: "/admin/moderacao", icon: FileCheck2 },
  { label: "Players", to: "/admin/players", icon: MonitorPlay },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AdminNavigation({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const items = NAVIGATION.filter((item) => !item.adminOnly || user.roles.includes("admin"));

  return (
    <nav className="flex flex-1 flex-col" aria-label="Navegação da área administrativa">
      <div className="space-y-1 px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.to || pathname === `${item.to}/`
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-white/68 transition-colors hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                isActive && "bg-white/10 text-gold",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>

      {user.roles.includes("admin") && (
        <div className="mx-4 mt-6 border-t border-white/10 pt-6">
          <Link
            to="/admin/campanhas/nova"
            onClick={onNavigate}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-4 text-sm font-semibold text-navy transition-colors hover:bg-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Criar campanha
          </Link>
        </div>
      )}
    </nav>
  );
}

function SidebarContent({ user, onNavigate }: { user: AuthUser; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-7">
        <Link to="/admin" onClick={onNavigate} aria-label="Ir para a visão geral administrativa">
          <Logo variant="light" className="h-8" />
        </Link>
      </div>
      <div className="flex flex-1 flex-col py-6">
        <p className="mb-3 px-7 font-mono text-[11px] font-medium uppercase text-white/45">
          Área administrativa
        </p>
        <AdminNavigation user={user} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const signOut = useServerFn(logout);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setLogoutError(null);
    try {
      const result = await signOut();
      queryClient.clear();
      await router.invalidate();
      await navigate({ to: result.redirectTo });
    } catch {
      setLogoutError("Não foi possível sair agora. Tente novamente.");
    } finally {
      setIsSigningOut(false);
    }
  }

  const roleLabel = user.role === "admin" ? "Administrador" : "Operador";

  return (
    <div className="min-h-screen bg-off-white text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <SidebarContent user={user} />
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-off-white/95 backdrop-blur-sm">
          <div className="flex h-20 items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-white text-navy transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
                    aria-label="Abrir navegação administrativa"
                  >
                    <Menu className="h-5 w-5" aria-hidden />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  hideClose
                  className="w-[min(86vw,18rem)] border-r border-white/10 bg-navy p-0"
                >
                  <SheetTitle className="sr-only">Navegação da área administrativa</SheetTitle>
                  <SidebarContent user={user} onNavigate={() => setIsMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
                <p className="truncate text-xs text-ink-soft">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden rounded-md border border-gold/50 bg-gold/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase text-gold-deep sm:inline-flex">
                {roleLabel}
              </span>
              <div
                className="hidden h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white sm:flex"
                aria-hidden
              >
                {getInitials(user.name)}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                title="Sair da conta"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-navy transition-colors hover:border-gold hover:text-gold-deep disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-4"
              >
                {isSigningOut ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden />
                )}
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
          {logoutError && (
            <p
              className="border-t border-red/20 bg-red/8 px-5 py-2 text-center text-xs text-red"
              role="alert"
            >
              {logoutError}
            </p>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
