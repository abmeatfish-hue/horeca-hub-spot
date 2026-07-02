import { createFileRoute } from "@tanstack/react-router";
import { actions, dishName, useStore, t as tr, type Order, type OrderStatus } from "@/lib/horeca-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, ArrowLeft, Flame, Clock, Home } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Кухня — HoReCa OS" },
      { name: "description", content: "Kanban дошка замовлень: Нове → В роботі → Готово." },
    ],
  }),
  component: KitchenPage,
});

const COLS: { id: OrderStatus; uk: string; en: string; accent: string }[] = [
  { id: "new", uk: "Нове", en: "New", accent: "border-t-blue-500" },
  { id: "in_progress", uk: "В роботі", en: "In progress", accent: "border-t-amber-500" },
  { id: "ready", uk: "Готово", en: "Ready", accent: "border-t-emerald-500" },
];

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  new: "in_progress", in_progress: "ready", ready: "served", served: null,
};
const PREV: Record<OrderStatus, OrderStatus | null> = {
  new: null, in_progress: "new", ready: "in_progress", served: "ready",
};

function KitchenPage() {
  const lang = useStore((s) => s.lang);
  const orders = useStore((s) => s.orders);
  const tables = useStore((s) => s.tables);
  const dishes = useStore((s) => s.dishes);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-2 flex items-center gap-2">
        <Link to="/">
          <Button size="icon" variant="ghost" className="h-8 w-8 -ml-2">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{T("Кухня", "Kitchen")}</h1>
        <p className="text-sm text-muted-foreground">
          {T("Kanban замовлень. Тягніть картки вперед/назад кнопками.", "Order kanban. Move cards with arrow buttons.")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLS.map((col) => {
          const list = orders
            .filter((o) => o.status === col.id)
            .sort((a, b) => (b.priority === "high" ? 1 : 0) - (a.priority === "high" ? 1 : 0) || a.createdAt - b.createdAt);
          return (
            <div key={col.id} className={`rounded-lg border border-t-4 bg-card p-3 ${col.accent}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{T(col.uk, col.en)}</h2>
                <Badge variant="secondary">{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.length === 0 && (
                  <p className="rounded border border-dashed p-6 text-center text-xs text-muted-foreground">
                    {T("Порожньо", "Empty")}
                  </p>
                )}
                {list.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    tableLabel={tables.find((t) => t.id === o.tableId)?.label ?? "—"}
                    dishLookup={(id) => dishes.find((d) => d.id === id)}
                    lang={lang}
                    T={T}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order, tableLabel, dishLookup, lang, T,
}: {
  order: Order;
  tableLabel: string;
  dishLookup: (id: string) => import("@/lib/horeca-store").Dish | undefined;
  lang: "uk" | "en";
  T: (uk: string, en: string) => string;
}) {
  const minsAgo = Math.max(0, Math.floor((Date.now() - order.createdAt) / 60000));
  const next = NEXT[order.status];
  const prev = PREV[order.status];

  return (
    <Card className={order.priority === "high" ? "border-red-500/60 shadow-red-500/10" : ""}>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>
            #{order.id.slice(-4)}
            <Badge variant="outline" className="ml-2">{T("Стіл", "Table")} №{tableLabel}</Badge>
          </span>
          <Button
            size="icon"
            variant={order.priority === "high" ? "destructive" : "ghost"}
            className="h-7 w-7"
            onClick={() => actions.toggleOrderPriority(order.id)}
            title={T("Пріоритет", "Priority")}
          >
            {order.priority === "high" ? <Flame className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ul className="mb-2 space-y-0.5 text-sm">
          {order.items.map((i) => {
            const d = dishLookup(i.dishId);
            return (
              <li key={i.dishId} className="flex justify-between">
                <span>{d ? dishName(d, lang) : i.dishId}</span>
                <b>× {i.qty}</b>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{minsAgo} {T("хв","min")}</span>
          <div className="flex gap-1">
            {prev && (
              <Button size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => actions.updateOrderStatus(order.id, prev)}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            {next && (
              <Button size="sm" className="h-7"
                onClick={() => actions.updateOrderStatus(order.id, next)}>
                {next === "in_progress" ? T("Взяти","Take")
                  : next === "ready" ? T("Готово","Ready")
                  : T("Видано","Served")}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
