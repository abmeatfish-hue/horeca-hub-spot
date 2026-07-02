import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { actions, useStore, t as tr, dishName, type Dish, type StaffMember } from "@/lib/horeca-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, ShoppingBag, Users, Utensils, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Адмін — HoReCa OS" },
      { name: "description", content: "Дашборд, конструктор меню та управління персоналом." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const lang = useStore((s) => s.lang);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-2 flex items-center gap-2">
        <Link to="/">
          <Button size="icon" variant="ghost" className="h-8 w-8 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{T("Адмін-панель", "Admin panel")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {T("Аналітика, меню, персонал.", "Analytics, menu, staff.")}
      </p>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">{T("Дашборд", "Dashboard")}</TabsTrigger>
          <TabsTrigger value="menu">{T("Меню", "Menu")}</TabsTrigger>
          <TabsTrigger value="staff">{T("Персонал", "Staff")}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="menu"><MenuBuilder /></TabsContent>
        <TabsContent value="staff"><StaffManager /></TabsContent>
      </Tabs>
    </div>
  );
}

function Dashboard() {
  const lang = useStore((s) => s.lang);
  const orders = useStore((s) => s.orders);
  const dishes = useStore((s) => s.dishes);
  const tables = useStore((s) => s.tables);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const count = orders.length;
    const avg = count ? Math.round(revenue / count) : 0;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const occupancy = tables.length ? Math.round((occupied / tables.length) * 100) : 0;

    const dishStats: Record<string, number> = {};
    orders.forEach((o) => o.items.forEach((i) => {
      dishStats[i.dishId] = (dishStats[i.dishId] ?? 0) + i.qty;
    }));
    const top = Object.entries(dishStats)
      .map(([id, qty]) => ({ dish: dishes.find((d) => d.id === id), qty }))
      .filter((x) => x.dish)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { revenue, count, avg, occupancy, top };
  }, [orders, dishes, tables]);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<TrendingUp className="h-4 w-4" />}
          label={T("Виручка", "Revenue")} value={`${stats.revenue} ₴`} />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />}
          label={T("Замовлень", "Orders")} value={stats.count.toString()} />
        <StatCard icon={<Utensils className="h-4 w-4" />}
          label={T("Середній чек", "Avg check")} value={`${stats.avg} ₴`} />
        <StatCard icon={<Users className="h-4 w-4" />}
          label={T("Завантаженість", "Occupancy")} value={`${stats.occupancy}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{T("Популярні страви", "Top dishes")}</CardTitle>
          <CardDescription>{T("Топ-5 за кількістю замовлень", "Top 5 by orders")}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">{T("Немає даних", "No data")}</p>
          ) : (
            <div className="space-y-2">
              {stats.top.map(({ dish, qty }) => {
                const max = stats.top[0].qty;
                return (
                  <div key={dish!.id}>
                    <div className="flex justify-between text-sm">
                      <span>{dishName(dish!, lang)}</span>
                      <b>{qty}</b>
                    </div>
                    <div className="mt-1 h-2 rounded bg-muted">
                      <div className="h-2 rounded bg-primary" style={{ width: `${(qty / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">{icon}{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function MenuBuilder() {
  const lang = useStore((s) => s.lang);
  const dishes = useStore((s) => s.dishes);
  const categories = useStore((s) => s.categories);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const [editing, setEditing] = useState<Dish | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing({
      id: `d${Date.now()}`,
      categoryId: categories[0]?.id ?? "",
      name: "", nameEn: "", description: "", price: 0, available: true,
    });
    setOpen(true);
  };
  const openEdit = (d: Dish) => { setEditing({ ...d }); setOpen(true); };
  const save = () => {
    if (!editing) return;
    if (!editing.name) { toast.error(T("Введіть назву", "Enter name")); return; }
    actions.upsertDish(editing);
    toast.success(T("Збережено", "Saved"));
    setOpen(false);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">{T("Конструктор меню", "Menu builder")}</h2>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />{T("Додати страву","Add dish")}</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{T("Назва","Name")}</TableHead>
              <TableHead>{T("Категорія","Category")}</TableHead>
              <TableHead className="text-right">{T("Ціна","Price")}</TableHead>
              <TableHead>{T("Доступна","Available")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {dishes.map((d) => (
              <TableRow key={d.id} className="cursor-pointer" onClick={() => openEdit(d)}>
                <TableCell className="font-medium">{dishName(d, lang)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {categories.find((c) => c.id === d.categoryId)?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right">{d.price} ₴</TableCell>
                <TableCell>
                  <Badge variant={d.available ? "default" : "secondary"}>
                    {d.available ? T("Так","Yes") : T("Ні","No")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost"
                    onClick={(e) => { e.stopPropagation(); actions.removeDish(d.id); toast.success(T("Видалено","Deleted")); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{T("Страва","Dish")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{T("Назва (UA)","Name (UA)")}</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>{T("Назва (EN)","Name (EN)")}</Label>
                  <Input value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{T("Опис","Description")}</Label>
                <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{T("Категорія","Category")}</Label>
                  <Select value={editing.categoryId} onValueChange={(v) => setEditing({ ...editing, categoryId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{T("Ціна (₴)","Price (UAH)")}</Label>
                  <Input type="number" value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.available}
                  onCheckedChange={(v) => setEditing({ ...editing, available: v })} />
                <Label>{T("Доступна для замовлення","Available")}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{T("Скасувати","Cancel")}</Button>
            <Button onClick={save}>{T("Зберегти","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffManager() {
  const lang = useStore((s) => s.lang);
  const staff = useStore((s) => s.staff);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [open, setOpen] = useState(false);

  const roleLabel: Record<StaffMember["role"], string> = {
    superadmin: T("Суперадмін","Superadmin"),
    owner: T("Власник","Owner"),
    manager: T("Керуючий","Manager"),
    waiter: T("Офіціант","Waiter"),
    kitchen: T("Кухня","Kitchen"),
    cashier: T("Касир","Cashier"),
  };

  const openNew = () => {
    setEditing({
      id: `s${Date.now()}`, name: "", role: "waiter",
      email: "", pin: "0000", active: true,
    });
    setOpen(true);
  };
  const openEdit = (m: StaffMember) => { setEditing({ ...m }); setOpen(true); };
  const save = () => {
    if (!editing) return;
    if (!editing.name || !editing.email) { toast.error(T("Заповніть поля","Fill fields")); return; }
    actions.upsertStaff(editing);
    toast.success(T("Збережено","Saved"));
    setOpen(false);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">{T("Персонал","Staff")}</h2>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />{T("Додати співробітника","Add staff")}</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{T("Ім'я","Name")}</TableHead>
              <TableHead>{T("Роль","Role")}</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead>{T("Активний","Active")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => openEdit(m)}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell><Badge variant="secondary">{roleLabel[m.role]}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{m.email}</TableCell>
                <TableCell className="font-mono">••••</TableCell>
                <TableCell>{m.active ? "✓" : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost"
                    onClick={(e) => { e.stopPropagation(); actions.removeStaff(m.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{T("Співробітник","Staff member")}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>{T("Ім'я","Name")}</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{T("Роль","Role")}</Label>
                  <Select value={editing.role}
                    onValueChange={(v) => setEditing({ ...editing, role: v as StaffMember["role"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(roleLabel) as StaffMember["role"][]).map((r) => (
                        <SelectItem key={r} value={r}>{roleLabel[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PIN</Label>
                  <Input value={editing.pin} maxLength={6}
                    onChange={(e) => setEditing({ ...editing, pin: e.target.value.replace(/\D/g, "") })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>{T("Активний","Active")}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{T("Скасувати","Cancel")}</Button>
            <Button onClick={save}>{T("Зберегти","Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
