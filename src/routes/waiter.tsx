import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { actions, dishName, useStore, t as tr, type Table as HTable } from "@/lib/horeca-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Minus, Receipt, Users2, ArrowRightLeft } from "lucide-react";

export const Route = createFileRoute("/waiter")({
  head: () => ({
    meta: [
      { title: "Офіціант — HoReCa OS" },
      { name: "description", content: "Карта залу, робота зі столами, замовлення та рахунки." },
    ],
  }),
  component: WaiterPage,
});

const statusColor = {
  free: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
  occupied: "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400",
  reserved: "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400",
} as const;

function WaiterPage() {
  const lang = useStore((s) => s.lang);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tables.find((t) => t.id === selectedId) ?? null;

  const statusLabel: Record<Table["status"], string> = {
    free: T("Вільний", "Free"),
    occupied: T("Зайнятий", "Occupied"),
    reserved: T("Бронь", "Reserved"),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{T("Карта залу", "Floor plan")}</h1>
          <p className="text-sm text-muted-foreground">
            {T("Оберіть стіл для роботи із замовленням.", "Tap a table to manage the order.")}
          </p>
        </div>
        <div className="flex gap-2">
          {(["free","occupied","reserved"] as const).map((s) => (
            <Badge key={s} variant="outline" className={statusColor[s]}>
              {statusLabel[s]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Floor plan */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border bg-muted/30">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={`absolute flex h-[22%] w-[20%] flex-col items-center justify-center rounded-lg border-2 p-2 text-left transition-transform hover:scale-105 ${statusColor[t.status]}`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >
            <div className="text-xs opacity-80">{T("Стіл", "Table")}</div>
            <div className="text-2xl font-bold">№{t.label}</div>
            <div className="text-xs">
              {t.status === "occupied" && t.guests ? `${t.guests}/${t.seats}` : `${t.seats} ${T("місць","seats")}`}
            </div>
          </button>
        ))}
      </div>

      <TableDialog
        table={selected}
        onClose={() => setSelectedId(null)}
        allTables={tables}
        orders={orders}
      />
    </div>
  );
}

function TableDialog({
  table, onClose, allTables, orders,
}: {
  table: Table | null;
  onClose: () => void;
  allTables: Table[];
  orders: ReturnType<typeof useStore<typeof import("@/lib/horeca-store").store extends never ? never : any>> extends never ? never : any;
}) {
  const lang = useStore((s) => s.lang);
  const dishes = useStore((s) => s.dishes);
  const categories = useStore((s) => s.categories);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const [guests, setGuests] = useState(2);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [moveTo, setMoveTo] = useState<string>("");

  const tableOrders = useMemo(
    () => (orders as ReturnType<typeof useStore<any>>[]).filter?.((o: any) => o.tableId === table?.id) as any[] ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, table?.id],
  );

  if (!table) return null;

  const cartItems = Object.entries(cart).filter(([, q]) => q > 0);
  const total = cartItems.reduce((s, [id, q]) => s + (dishes.find((d) => d.id === id)?.price ?? 0) * q, 0);

  const openTable = () => {
    actions.setTableStatus(table.id, "occupied", guests);
    toast.success(T("Стіл відкрито", "Table opened"));
  };
  const closeTable = () => {
    actions.setTableStatus(table.id, "free", undefined);
    toast.success(T("Стіл закрито", "Table closed"));
    onClose();
  };
  const sendOrder = () => {
    if (cartItems.length === 0) return;
    actions.addOrder({
      tableId: table.id,
      items: cartItems.map(([dishId, qty]) => ({ dishId, qty })),
      status: "new",
      priority: "normal",
      total,
      source: "waiter",
    });
    if (table.status !== "occupied") actions.setTableStatus(table.id, "occupied", guests);
    setCart({});
    toast.success(T("Замовлення відправлено на кухню", "Order sent to kitchen"));
  };
  const moveTable = () => {
    if (!moveTo) return;
    actions.setTableStatus(moveTo, "occupied", table.guests ?? guests);
    actions.setTableStatus(table.id, "free", undefined);
    toast.success(T("Гостей перенесено", "Guests moved"));
    onClose();
  };
  const printBill = () => {
    const sum = tableOrders.reduce((s, o) => s + (o?.total ?? 0), 0);
    toast.success(T(`Рахунок: ${sum} ₴`, `Bill: ${sum} UAH`));
  };

  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {T("Стіл", "Table")} №{table.label}
            <Badge variant="secondary" className="ml-2">{table.seats} {T("місць","seats")}</Badge>
          </DialogTitle>
          <DialogDescription>
            {T("Керування столом та замовленням", "Manage table and order")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="order">
          <TabsList>
            <TabsTrigger value="order">{T("Замовлення", "Order")}</TabsTrigger>
            <TabsTrigger value="manage">{T("Керування", "Manage")}</TabsTrigger>
            <TabsTrigger value="bill">{T("Рахунок", "Bill")}</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="space-y-3">
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    {lang === "uk" ? c.name : c.nameEn}
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {dishes.filter((d) => d.categoryId === c.id && d.available).map((d) => {
                      const q = cart[d.id] ?? 0;
                      return (
                        <div key={d.id} className="flex items-center gap-2 rounded border p-2">
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{dishName(d, lang)}</div>
                            <div className="text-xs text-muted-foreground">{d.price} ₴</div>
                          </div>
                          {q === 0 ? (
                            <Button size="sm" onClick={() => setCart((c2) => ({ ...c2, [d.id]: 1 }))}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="outline" className="h-8 w-8"
                                onClick={() => setCart((c2) => ({ ...c2, [d.id]: Math.max(0, q - 1) }))}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center text-sm">{q}</span>
                              <Button size="icon" className="h-8 w-8"
                                onClick={() => setCart((c2) => ({ ...c2, [d.id]: q + 1 }))}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded bg-muted p-3">
              <span className="text-sm">{T("Разом", "Total")}: <b>{total} ₴</b></span>
              <Button size="lg" disabled={total === 0} onClick={sendOrder}>
                {T("Відправити на кухню", "Send to kitchen")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label><Users2 className="mr-1 inline h-4 w-4" />{T("Кількість гостей", "Guests")}</Label>
                <Input type="number" min={1} max={table.seats} value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)} />
              </div>
              <Button size="lg" onClick={openTable}>{T("Відкрити стіл", "Open table")}</Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label><ArrowRightLeft className="mr-1 inline h-4 w-4" />{T("Перенести на стіл", "Move to table")}</Label>
                <select
                  className="mt-1 w-full rounded border bg-background p-2"
                  value={moveTo}
                  onChange={(e) => setMoveTo(e.target.value)}
                >
                  <option value="">—</option>
                  {allTables.filter((t) => t.id !== table.id && t.status === "free").map((t) => (
                    <option key={t.id} value={t.id}>№{t.label} · {t.seats} {T("місць","seats")}</option>
                  ))}
                </select>
              </div>
              <Button size="lg" variant="outline" disabled={!moveTo} onClick={moveTable}>
                {T("Перенести", "Move")}
              </Button>
            </div>
            <Button size="lg" variant="destructive" className="w-full" onClick={closeTable}>
              {T("Закрити стіл", "Close table")}
            </Button>
          </TabsContent>

          <TabsContent value="bill" className="space-y-2">
            {tableOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{T("Немає замовлень на цьому столі.", "No orders on this table.")}</p>
            ) : tableOrders.map((o: any) => (
              <Card key={o.id}>
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>#{o.id.slice(-4)} · <Badge variant="outline">{o.status}</Badge></span>
                    <span className="font-bold">{o.total} ₴</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-1 text-xs text-muted-foreground">
                  {o.items.map((i: any) => {
                    const d = dishes.find((x) => x.id === i.dishId);
                    return <div key={i.dishId}>{d ? dishName(d, lang) : i.dishId} × {i.qty}</div>;
                  })}
                </CardContent>
              </Card>
            ))}
            <Button size="lg" className="w-full" onClick={printBill} disabled={tableOrders.length === 0}>
              <Receipt className="mr-2 h-4 w-4" />
              {T("Сформувати рахунок", "Print bill")}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{T("Закрити", "Close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
