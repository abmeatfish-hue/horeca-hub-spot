import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore, t as tr } from "@/lib/horeca-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Users, ChefHat, LayoutDashboard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HoReCa OS — система керування рестораном" },
      { name: "description", content: "MVP системи керування для ресторанів, кафе та барів: QR-меню, зал, кухня, адмін-дашборд." },
      { property: "og:title", content: "HoReCa OS" },
      { property: "og:description", content: "Система керування рестораном: QR-меню, зал, кухня, адмін." },
    ],
  }),
  component: Index,
});

function Index() {
  const lang = useStore((s) => s.lang);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const zones = [
    {
      to: "/menu",
      icon: QrCode,
      title: T("Клієнт (QR-меню)", "Client (QR menu)"),
      desc: T("Перегляд меню, замовлення, оплата, бронювання без реєстрації.", "Browse menu, order, pay, reserve — no signup."),
      device: T("Телефон", "Phone"),
    },
    {
      to: "/waiter",
      icon: Users,
      title: T("Офіціант", "Waiter"),
      desc: T("Карта залу, робота зі столами, замовлення, рахунок.", "Floor map, tables, orders, checks."),
      device: T("Планшет", "Tablet"),
    },
    {
      to: "/kitchen",
      icon: ChefHat,
      title: T("Кухня", "Kitchen"),
      desc: T("Kanban: Нове → В роботі → Готово. Пріоритети.", "Kanban: New → In progress → Ready. Priorities."),
      device: T("Планшет / екран", "Tablet / screen"),
    },
    {
      to: "/admin",
      icon: LayoutDashboard,
      title: T("Адмін", "Admin"),
      desc: T("Меню, персонал, дашборд аналітики.", "Menu, staff, analytics dashboard."),
      device: T("Комп'ютер", "Desktop"),
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-10">
        <Badge variant="secondary" className="mb-3">MVP</Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          HoReCa OS
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {T(
            "Каркас системи керування для ресторанів, кафе, барів та мереж закладів. Оберіть робочу зону.",
            "Management system framework for restaurants, cafes and bars. Pick a zone.",
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {zones.map((z) => (
          <Link key={z.to} to={z.to} className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <z.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline">{z.device}</Badge>
                </div>
                <CardTitle className="mt-3 flex items-center justify-between">
                  {z.title}
                  <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </CardTitle>
                <CardDescription>{z.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">{T("Ролі та вхід", "Roles & sign-in")}</CardTitle>
          <CardDescription>
            {T(
              "Персонал: email + пароль або PIN-код. Клієнт: без реєстрації через QR. Роль перемикається у верхньому правому куті (демо).",
              "Staff: email + password or PIN. Client: no signup, via QR. Switch role in the top-right (demo).",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {["Суперадмін","Власник","Керуючий","Офіціант","Кухня","Касир","Клієнт"].map((r) => (
            <Badge key={r} variant="secondary">{r}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
