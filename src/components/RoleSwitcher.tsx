import { Link, useRouterState } from "@tanstack/react-router";
import { actions, useStore, t as tr } from "@/lib/horeca-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChefHat, LayoutDashboard, QrCode, Users, Globe, Home } from "lucide-react";

export function AppHeader() {
  const lang = useStore((s) => s.lang);
  const role = useStore((s) => s.role);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const T = (uk: string, en: string) => tr(lang, uk, en);

  if (path === "/menu" || path.startsWith("/menu/")) return null; // client-facing, own header

  const roleLabel: Record<string, string> = {
    superadmin: T("Суперадмін", "Superadmin"),
    owner: T("Власник", "Owner"),
    manager: T("Керуючий", "Manager"),
    waiter: T("Офіціант", "Waiter"),
    kitchen: T("Кухня", "Kitchen"),
    cashier: T("Касир", "Cashier"),
    client: T("Клієнт", "Client"),
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <ChefHat className="h-5 w-5 text-primary" />
          <span>HoReCa OS</span>
        </Link>
        <nav className="ml-6 hidden gap-1 md:flex">
          <NavLink to="/" icon={<Home className="h-4 w-4" />} label={T("Головна", "Home")} />
          <NavLink to="/waiter" icon={<Users className="h-4 w-4" />} label={T("Офіціант", "Waiter")} />
          <NavLink to="/kitchen" icon={<ChefHat className="h-4 w-4" />} label={T("Кухня", "Kitchen")} />
          <NavLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label={T("Адмін", "Admin")} />
          <NavLink to="/menu" icon={<QrCode className="h-4 w-4" />} label={T("QR-меню", "QR-menu")} />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.setLang(lang === "uk" ? "en" : "uk")}
          >
            <Globe className="mr-1 h-4 w-4" />
            {lang.toUpperCase()}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">{roleLabel[role]}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{T("Змінити роль", "Switch role")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["superadmin","owner","manager","waiter","kitchen","cashier","client"] as const).map((r) => (
                <DropdownMenuItem key={r} onClick={() => actions.setRole(r)}>
                  {roleLabel[r]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      activeProps={{ className: "bg-accent text-foreground font-medium" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon}
      {label}
    </Link>
  );
}
