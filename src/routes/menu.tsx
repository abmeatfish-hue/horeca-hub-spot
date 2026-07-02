import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { actions, catName, dishName, useStore, t as tr, type OrderItem } from "@/lib/horeca-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChefHat, Globe, Minus, Plus, ShoppingCart, CalendarClock, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "QR-меню — HoReCa OS" },
      { name: "description", content: "Клієнтське QR-меню: перегляд страв, замовлення, оплата, бронювання столика." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const lang = useStore((s) => s.lang);
  const categories = useStore((s) => s.categories);
  const dishes = useStore((s) => s.dishes);
  const tables = useStore((s) => s.tables);
  const T = (uk: string, en: string) => tr(lang, uk, en);

  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id ?? "");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [tableId, setTableId] = useState<string>("t1");

  const cartItems: OrderItem[] = useMemo(
    () => Object.entries(cart).filter(([, q]) => q > 0).map(([dishId, qty]) => ({ dishId, qty })),
    [cart],
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const total = cartItems.reduce((s, i) => {
    const d = dishes.find((x) => x.id === i.dishId);
    return s + (d?.price ?? 0) * i.qty;
  }, 0);

  const inc = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const dec = (id: string) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }));

  const submitOrder = () => {
    if (cartItems.length === 0) return;
    actions.addOrder({
      tableId, items: cartItems, status: "new", priority: "normal", total, source: "qr",
    });
    setCart({});
    toast.success(T("Замовлення відправлено на кухню", "Order sent to kitchen"));
  };

  const filteredDishes = dishes.filter((d) => d.categoryId === activeCat && d.available);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Client-facing header */}
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <Link to="/">
            <Button size="icon" variant="ghost" className="h-8 w-8 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <ChefHat className="h-5 w-5 text-primary" />
          <div className="text-sm font-semibold">HoReCa OS</div>
          <Badge variant="secondary" className="ml-1 text-[10px]">
            {T("Стіл", "Table")} №{tables.find((t) => t.id === tableId)?.label ?? "—"}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => actions.setLang(lang === "uk" ? "en" : "uk")}
          >
            <Globe className="mr-1 h-4 w-4" />
            {lang.toUpperCase()}
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{T("Меню", "Menu")}</h1>
            <p className="text-xs text-muted-foreground">
              {T("Оберіть страви та оформіть замовлення", "Pick dishes and place your order")}
            </p>
          </div>
          <ReservationDialog />
        </div>

        {/* Category chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
                activeCat === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-accent"
              }`}
            >
              {catName(c, lang)}
            </button>
          ))}
        </div>

        {/* Table select */}
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground">{T("Ваш стіл", "Your table")}</Label>
          <Select value={tableId} onValueChange={setTableId}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {T("Стіл", "Table")} №{t.label} · {t.seats} {T("місць", "seats")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dish list */}
        <div className="space-y-3">
          {filteredDishes.map((d) => {
            const q = cart[d.id] ?? 0;
            return (
              <Card key={d.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{dishName(d, lang)}</div>
                    <div className="line-clamp-2 text-xs text-muted-foreground">{d.description}</div>
                    <div className="mt-1 text-sm font-semibold">{d.price} ₴</div>
                  </div>
                  {q === 0 ? (
                    <Button size="sm" onClick={() => inc(d.id)}>
                      <Plus className="mr-1 h-4 w-4" />{T("Додати", "Add")}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" onClick={() => dec(d.id)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center font-medium">{q}</span>
                      <Button size="icon" onClick={() => inc(d.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card p-3">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">
                {cartCount} {T("позицій", "items")}
              </div>
              <div className="text-lg font-bold">{total} ₴</div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button size="lg">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {T("Оформити", "Checkout")}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{T("Ваше замовлення", "Your order")}</SheetTitle>
                  <SheetDescription>
                    {T("Стіл", "Table")} №{tables.find((t) => t.id === tableId)?.label}
                  </SheetDescription>
                </SheetHeader>
                <div className="my-4 space-y-2">
                  {cartItems.map((i) => {
                    const d = dishes.find((x) => x.id === i.dishId)!;
                    return (
                      <div key={i.dishId} className="flex items-center justify-between text-sm">
                        <span>{dishName(d, lang)} × {i.qty}</span>
                        <span className="font-medium">{d.price * i.qty} ₴</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>{T("Разом", "Total")}</span>
                    <span>{total} ₴</span>
                  </div>
                </div>
                <SheetFooter className="flex-col gap-2 sm:flex-col">
                  <Button size="lg" onClick={submitOrder}>
                    <ChefHat className="mr-2 h-4 w-4" />
                    {T("Надіслати на кухню", "Send to kitchen")}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      submitOrder();
                      toast.success(T("Оплата прийнята (демо)", "Payment accepted (demo)"));
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {T("Оплатити карткою", "Pay by card")} · {total} ₴
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </div>
  );
}

function ReservationDialog() {
  const lang = useStore((s) => s.lang);
  const tables = useStore((s) => s.tables);
  const T = (uk: string, en: string) => tr(lang, uk, en);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [tableId, setTableId] = useState<string>(tables.find((t) => t.status === "free")?.id ?? "");

  const submit = () => {
    if (!name || !phone || !tableId) {
      toast.error(T("Заповніть всі поля", "Fill all fields")); return;
    }
    actions.addReservation({
      id: `r${Date.now()}`, tableId, name, phone, time, guests,
    });
    toast.success(T("Столик заброньовано", "Table reserved"));
    setOpen(false);
    setName(""); setPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="mr-1 h-4 w-4" />
          {T("Бронювання", "Reserve")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{T("Бронювання столика", "Reserve a table")}</DialogTitle>
          <DialogDescription>
            {T("Залиште контакти, ми підтвердимо бронь.", "Leave your contacts, we'll confirm.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{T("Ім'я", "Name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{T("Телефон", "Phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{T("Час", "Time")}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <Label>{T("Гостей", "Guests")}</Label>
              <Input type="number" min={1} max={20} value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div>
            <Label>{T("Стіл", "Table")}</Label>
            <Select value={tableId} onValueChange={setTableId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tables.filter((t) => t.status !== "occupied").map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {T("Стіл", "Table")} №{t.label} · {t.seats} {T("місць", "seats")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>{T("Підтвердити", "Confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
