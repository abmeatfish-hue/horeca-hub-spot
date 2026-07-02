// Simple in-memory + localStorage store for HoReCa OS MVP
import { useSyncExternalStore } from "react";

export type Role = "superadmin" | "owner" | "manager" | "waiter" | "kitchen" | "cashier" | "client";
export type Lang = "uk" | "en";
export type OrderStatus = "new" | "in_progress" | "ready" | "served";
export type TableStatus = "free" | "occupied" | "reserved";

export interface Category { id: string; name: string; nameEn: string; }
export interface Dish {
  id: string;
  categoryId: string;
  name: string;
  nameEn: string;
  description: string;
  price: number; // UAH
  available: boolean;
}
export interface Table {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  x: number; y: number;
  guests?: number;
}
export interface OrderItem { dishId: string; qty: number; note?: string; }
export interface Order {
  id: string;
  tableId?: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: "normal" | "high";
  createdAt: number;
  total: number;
  source: "waiter" | "qr";
}
export interface StaffMember {
  id: string;
  name: string;
  role: Exclude<Role, "client">;
  email: string;
  pin: string;
  active: boolean;
}
export interface Reservation {
  id: string;
  tableId: string;
  name: string;
  phone: string;
  time: string;
  guests: number;
}

interface State {
  lang: Lang;
  role: Role;
  categories: Category[];
  dishes: Dish[];
  tables: Table[];
  orders: Order[];
  staff: StaffMember[];
  reservations: Reservation[];
}

const KEY = "horeca-os-state-v1";

const seed = (): State => ({
  lang: "uk",
  role: "client",
  categories: [
    { id: "c1", name: "Стартери", nameEn: "Starters" },
    { id: "c2", name: "Основні страви", nameEn: "Mains" },
    { id: "c3", name: "Напої", nameEn: "Drinks" },
    { id: "c4", name: "Десерти", nameEn: "Desserts" },
  ],
  dishes: [
    { id: "d1", categoryId: "c1", name: "Борщ", nameEn: "Borscht", description: "Класичний український борщ зі сметаною", price: 180, available: true },
    { id: "d2", categoryId: "c1", name: "Салат Цезар", nameEn: "Caesar salad", description: "З куркою та пармезаном", price: 240, available: true },
    { id: "d3", categoryId: "c2", name: "Стейк Рібай", nameEn: "Ribeye steak", description: "300г, medium rare", price: 690, available: true },
    { id: "d4", categoryId: "c2", name: "Паста Карбонара", nameEn: "Carbonara", description: "З беконом і жовтком", price: 320, available: true },
    { id: "d5", categoryId: "c2", name: "Вареники з вишнею", nameEn: "Cherry dumplings", description: "Домашні, зі сметаною", price: 210, available: true },
    { id: "d6", categoryId: "c3", name: "Лимонад", nameEn: "Lemonade", description: "Домашній, 0.5л", price: 120, available: true },
    { id: "d7", categoryId: "c3", name: "Кава Латте", nameEn: "Latte", description: "Арабіка, 250мл", price: 90, available: true },
    { id: "d8", categoryId: "c4", name: "Тірамісу", nameEn: "Tiramisu", description: "Класичний рецепт", price: 180, available: true },
  ],
  tables: [
    { id: "t1", label: "1", seats: 2, status: "free", x: 10, y: 10 },
    { id: "t2", label: "2", seats: 4, status: "occupied", x: 40, y: 10, guests: 3 },
    { id: "t3", label: "3", seats: 4, status: "reserved", x: 70, y: 10 },
    { id: "t4", label: "4", seats: 2, status: "free", x: 10, y: 45 },
    { id: "t5", label: "5", seats: 6, status: "occupied", x: 40, y: 45, guests: 5 },
    { id: "t6", label: "6", seats: 2, status: "free", x: 70, y: 45 },
    { id: "t7", label: "VIP", seats: 8, status: "free", x: 10, y: 78 },
    { id: "t8", label: "8", seats: 4, status: "occupied", x: 40, y: 78, guests: 2 },
    { id: "t9", label: "9", seats: 2, status: "free", x: 70, y: 78 },
  ],
  orders: [
    { id: "o1", tableId: "t2", items: [{ dishId: "d1", qty: 2 }, { dishId: "d6", qty: 2 }], status: "in_progress", priority: "normal", createdAt: Date.now() - 600000, total: 600, source: "waiter" },
    { id: "o2", tableId: "t5", items: [{ dishId: "d3", qty: 1 }, { dishId: "d4", qty: 2 }], status: "new", priority: "high", createdAt: Date.now() - 120000, total: 1330, source: "waiter" },
    { id: "o3", tableId: "t8", items: [{ dishId: "d8", qty: 2 }, { dishId: "d7", qty: 2 }], status: "ready", priority: "normal", createdAt: Date.now() - 900000, total: 540, source: "qr" },
  ],
  staff: [
    { id: "s1", name: "Олена Ковальчук", role: "owner", email: "owner@horeca.ua", pin: "1111", active: true },
    { id: "s2", name: "Ігор Петренко", role: "manager", email: "manager@horeca.ua", pin: "2222", active: true },
    { id: "s3", name: "Марія Сидоренко", role: "waiter", email: "waiter1@horeca.ua", pin: "3333", active: true },
    { id: "s4", name: "Андрій Бондар", role: "waiter", email: "waiter2@horeca.ua", pin: "4444", active: true },
    { id: "s5", name: "Шеф Василь", role: "kitchen", email: "kitchen@horeca.ua", pin: "5555", active: true },
    { id: "s6", name: "Оксана Мельник", role: "cashier", email: "cashier@horeca.ua", pin: "6666", active: true },
  ],
  reservations: [
    { id: "r1", tableId: "t3", name: "Шевченко Т.", phone: "+380671234567", time: "19:00", guests: 4 },
  ],
});

let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    return { ...seed(), ...JSON.parse(raw) };
  } catch { return seed(); }
}
function persist() {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* noop */ }
}
function emit() { persist(); listeners.forEach((l) => l()); }

export const store = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  set(patch: Partial<State> | ((s: State) => Partial<State>)) {
    const p = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...p };
    emit();
  },
  reset() { state = seed(); emit(); },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => selector(store.get()),
    () => selector(seed()),
  );
}

// Actions
export const actions = {
  setLang: (lang: Lang) => store.set({ lang }),
  setRole: (role: Role) => store.set({ role }),
  setTableStatus: (id: string, status: TableStatus, guests?: number) =>
    store.set((s) => ({ tables: s.tables.map((t) => t.id === id ? { ...t, status, guests } : t) })),
  addOrder: (o: Omit<Order, "id" | "createdAt">) => {
    const order: Order = { ...o, id: `o${Date.now()}`, createdAt: Date.now() };
    store.set((s) => ({ orders: [order, ...s.orders] }));
    return order.id;
  },
  updateOrderStatus: (id: string, status: OrderStatus) =>
    store.set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, status } : o) })),
  toggleOrderPriority: (id: string) =>
    store.set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, priority: o.priority === "high" ? "normal" : "high" } : o) })),
  upsertDish: (d: Dish) =>
    store.set((s) => ({ dishes: s.dishes.some((x) => x.id === d.id) ? s.dishes.map((x) => x.id === d.id ? d : x) : [...s.dishes, d] })),
  removeDish: (id: string) => store.set((s) => ({ dishes: s.dishes.filter((d) => d.id !== id) })),
  addCategory: (c: Category) => store.set((s) => ({ categories: [...s.categories, c] })),
  upsertStaff: (m: StaffMember) =>
    store.set((s) => ({ staff: s.staff.some((x) => x.id === m.id) ? s.staff.map((x) => x.id === m.id ? m : x) : [...s.staff, m] })),
  removeStaff: (id: string) => store.set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),
  addReservation: (r: Reservation) =>
    store.set((s) => ({
      reservations: [...s.reservations, r],
      tables: s.tables.map((t) => t.id === r.tableId ? { ...t, status: "reserved" as const } : t),
    })),
};

// i18n
export const t = (lang: Lang, uk: string, en: string) => lang === "uk" ? uk : en;
export const dishName = (d: Dish, lang: Lang) => lang === "uk" ? d.name : d.nameEn;
export const catName = (c: Category, lang: Lang) => lang === "uk" ? c.name : c.nameEn;
