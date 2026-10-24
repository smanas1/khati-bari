"use client";

import React, { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  updateOrderStatusAction,
  updateTenantSettingsAction,
  logoutAdminAction,
  sendTestNotificationAction,
} from "@/app/actions";
import {
  Package,
  ShoppingBag,
  Settings,
  Layers,
  MessageCircle,
  Trash2,
  LogOut,
  ExternalLink,
  Store,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  X,
  Plus,
  Minus,
  AlertTriangle,
  BarChart3,
  Filter,
  RefreshCw,
  Truck,
  Ban,
  Send,
  Bell,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TenantProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  isSeasonal: boolean;
  icon: string;
  image?: string | null;
  variants?: string | null;
  description: string | null;
  createdAt?: string | Date;
}

interface OrderItemData {
  id?: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface TenantOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryArea: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string | Date;
  items: OrderItemData[];
}

interface TenantData {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  whatsapp: string;
  fbPageUrl: string | null;
  deliveryLocal: number;
  deliveryDhaka: number;
  deliveryOutside: number;
  products: TenantProduct[];
  orders: TenantOrder[];
}

type ToastType = "success" | "error" | "info";
interface Toast { id: number; msg: string; type: ToastType }
interface VariantRow { unit: string; price: string }

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bn: string; color: string; icon: React.ElementType }> = {
  PENDING:   { bn: "অপেক্ষমান",        color: "bg-amber-50 text-amber-800 border-amber-200",   icon: Clock },
  CONFIRMED: { bn: "কনফার্মড",          color: "bg-blue-50 text-blue-800 border-blue-200",      icon: CheckCircle2 },
  SHIPPED:   { bn: "পাঠানো হয়েছে",     color: "bg-purple-50 text-purple-800 border-purple-200", icon: Truck },
  DELIVERED: { bn: "ডেলিভারড",          color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  CANCELLED: { bn: "বাতিল",             color: "bg-rose-50 text-rose-800 border-rose-200",      icon: Ban },
};

const ORDERS_PER_PAGE = 15;

// ─── Helper Functions ──────────────────────────────────────────────────────────
function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "এইমাত্র";
  if (diffMins < 60) return `${diffMins} মিনিট আগে`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} দিন আগে`;
  return d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminClient({ tenant }: { tenant: TenantData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const addProductFormRef = useRef<HTMLFormElement>(null);

  // ── Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  function addToast(msg: string, type: ToastType = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }

  // ── Notification testing state
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  async function handleSendTestNotification() {
    setIsTestingNotif(true);
    try {
      const res = await sendTestNotificationAction();
      if (res.success) {
        addToast(res.message, "success");
      } else {
        addToast(res.message, "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "টেস্ট নোটিফিকেশন পাঠাতে ত্রুটি হয়েছে!";
      addToast(msg, "error");
    } finally {
      setIsTestingNotif(false);
    }
  }

  // ── Order status controlled state (fix defaultValue bug)
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>(
    Object.fromEntries(tenant.orders.map((o) => [o.id, o.status]))
  );

  // ── Order filter/search/pagination
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Product inline edit
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // ── Variant builder
  const [variants, setVariants] = useState<VariantRow[]>([{ unit: "", price: "" }]);

  // ─── Computed stats
  const totalRevenue = tenant.orders.reduce(
    (sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0
  );
  const pendingCount = tenant.orders.filter((o) => o.status === "PENDING").length;
  const deliveredCount = tenant.orders.filter((o) => o.status === "DELIVERED").length;
  const lowStockCount = tenant.products.filter((p) => p.stock <= 5).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = tenant.orders.filter((o) => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0
  );

  // ─── Filtered & paginated orders
  const filteredOrders = tenant.orders.filter((o) => {
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.orderNumber.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ORDERS_PER_PAGE,
    safeCurrentPage * ORDERS_PER_PAGE
  );

  // ─── Handlers
  async function handleLogout() {
    await logoutAdminAction();
    router.refresh();
  }

  function handleStatusChange(orderId: string, newStatus: string) {
    setOrderStatuses((prev) => ({ ...prev, [orderId]: newStatus }));
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, newStatus, tenant.slug);
        addToast(`অর্ডার স্ট্যাটাস "${STATUS_CONFIG[newStatus]?.bn || newStatus}" করা হয়েছে।`);
      } catch (err) {
        addToast("স্ট্যাটাস আপডেট ব্যর্থ হয়েছে!", "error");
      }
    });
  }

  function startEditProduct(p: TenantProduct) {
    setEditingProductId(p.id);
    setEditStock(String(p.stock));
    setEditPrice(String(p.price));
  }

  function saveProductEdit(productId: string) {
    startTransition(async () => {
      try {
        await updateProductAction(productId, tenant.slug, {
          stock: Number(editStock),
          price: Number(editPrice),
        });
        setEditingProductId(null);
        addToast("পণ্যের স্টক ও মূল্য আপডেট হয়েছে।");
      } catch (err) {
        addToast("আপডেট ব্যর্থ হয়েছে!", "error");
      }
    });
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { unit: "", price: "" }]);
  }

  function removeVariantRow(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateVariantRow(idx: number, field: "unit" | "price", value: string) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }

  function buildVariantsJSON(): string {
    const valid = variants.filter((v) => v.unit.trim() && v.price.trim());
    if (valid.length === 0) return "";
    return JSON.stringify(valid.map((v) => ({ unit: v.unit.trim(), price: Number(v.price) })));
  }

  function handleFilterChange(status: string) {
    setFilterStatus(status);
    setCurrentPage(1);
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setCurrentPage(1);
  }

  // ─── Metric cards data
  const metrics = [
    { label: "মোট অর্ডার", value: `${tenant.orders.length} টি`, sub: "", icon: ShoppingBag, color: "bg-emerald-50 text-emerald-800", border: "border-stone-200" },
    { label: "আজকের অর্ডার", value: `${todayOrders.length} টি`, sub: `৳${todayRevenue} আয়`, icon: BarChart3, color: "bg-blue-50 text-blue-700", border: "border-blue-100" },
    { label: "অপেক্ষমান", value: `${pendingCount} টি`, sub: "প্রসেস করুন", icon: Clock, color: "bg-amber-50 text-amber-700", border: "border-amber-100" },
    { label: "ডেলিভারড", value: `${deliveredCount} টি`, sub: "সম্পন্ন অর্ডার", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700", border: "border-emerald-100" },
    { label: "মোট বিক্রয়", value: `৳${totalRevenue.toLocaleString()}`, sub: "সামগ্রিক রাজস্ব", icon: TrendingUp, color: "bg-purple-50 text-purple-800", border: "border-purple-100" },
    { label: "কম স্টক", value: `${lowStockCount} টি`, sub: "পণ্য রিস্টক করুন", icon: AlertTriangle, color: lowStockCount > 0 ? "bg-rose-50 text-rose-700" : "bg-stone-50 text-stone-500", border: lowStockCount > 0 ? "border-rose-200" : "border-stone-200" },
  ];

  // ─── Render
  return (
    <div className="min-h-screen bg-[#f5f6f8] text-stone-900 font-sans flex flex-col">

      {/* ── Toast Container ──────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md max-w-sm animate-in slide-in-from-right transition-all ${
              t.type === "success"
                ? "bg-emerald-950/95 border-emerald-600/30 text-white"
                : t.type === "error"
                ? "bg-rose-950/95 border-rose-600/30 text-rose-100"
                : "bg-stone-900/95 border-stone-700/30 text-white"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : t.type === "error" ? (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ── Admin Navbar ──────────────────────────────────────────────────── */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-lg shadow">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight">{tenant.name}</h1>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  অ্যাডমিন
                </span>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingCount} নতুন
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-300 font-mono">/{tenant.slug}/admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href={`/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-700/60 transition shadow-sm"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">স্টোর দেখুন</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 text-xs font-bold px-3 py-2 rounded-xl border border-rose-800/60 transition shadow-sm active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">

        {/* ── Metric Cards (6 cards) ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className={`bg-white rounded-2xl p-4 border ${m.border} shadow-sm flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider leading-tight">{m.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${m.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black text-stone-900 leading-none">{m.value}</span>
                {m.sub && <span className="text-[10px] text-stone-400 font-medium leading-none">{m.sub}</span>}
              </div>
            );
          })}
        </div>

        {/* ── Main Grid: Left (Forms) + Right (Orders + Inventory) ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Add Product Form */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100 bg-stone-50/60">
                <Package className="w-4.5 h-4.5 text-emerald-800" />
                <h3 className="font-extrabold text-base text-emerald-950">নতুন পণ্য যোগ করুন</h3>
              </div>
              <div className="p-5">
                <form
                  ref={addProductFormRef}
                  action={async (formData) => {
                    // Inject built variants JSON
                    const builtVariants = buildVariantsJSON();
                    if (builtVariants) {
                      formData.set("variants", builtVariants);
                    }
                    startTransition(async () => {
                      try {
                        await createProductAction(tenant.id, tenant.slug, formData);
                        addProductFormRef.current?.reset();
                        setVariants([{ unit: "", price: "" }]);
                        addToast("পণ্য সফলভাবে যুক্ত হয়েছে!");
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : "পণ্য যোগ করতে ব্যর্থ হয়েছে!";
                        addToast(msg, "error");
                      }
                    });
                  }}
                  className="space-y-3 text-sm"
                >
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">পণ্যের নাম *</label>
                    <input
                      name="name"
                      required
                      placeholder="যেমন: লিচু ফুলের খাঁটি মধু"
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-stone-50 focus:bg-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ক্যাটাগরি</label>
                      <select
                        name="category"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      >
                        <option value="মধু">মধু</option>
                        <option value="আম">আম</option>
                        <option value="গুড়">গুড়</option>
                        <option value="অন্যান্য">অন্যান্য</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ডিফল্ট ইউনিট *</label>
                      <input
                        name="unit"
                        required
                        placeholder="৫০০ মিলি"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">মূল্য (৳) *</label>
                      <input
                        name="price"
                        type="number"
                        required
                        placeholder="৬৫০"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">স্টক *</label>
                      <input
                        name="stock"
                        type="number"
                        required
                        defaultValue="20"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ছবির পাথ</label>
                      <input
                        name="image"
                        placeholder="/products/honey.jpg"
                        className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-600 mb-1 block">ইমোজি</label>
                      <input
                        name="icon"
                        defaultValue="🍯"
                        className="w-full border border-stone-200 rounded-xl px-2 py-2 text-center text-lg bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">বিবরণ</label>
                    <textarea
                      rows={2}
                      name="description"
                      placeholder="পণ্য সম্পর্কে সংক্ষেপে লিখুন..."
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-sm bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* ── Inline Variant Builder ──────────────────────────────── */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-stone-600">সাইজ ভ্যারিয়েন্টস</label>
                      <button
                        type="button"
                        onClick={addVariantRow}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition"
                      >
                        <Plus className="w-3 h-3" /> সাইজ যোগ করুন
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {variants.map((v, idx) => (
                        <div key={idx} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={v.unit}
                            onChange={(e) => updateVariantRow(idx, "unit", e.target.value)}
                            placeholder="যেমন: ৫০০ মিলি"
                            className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs bg-stone-50 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => updateVariantRow(idx, "price", e.target.value)}
                            placeholder="৳ মূল্য"
                            className="w-20 border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-stone-50 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariantRow(idx)}
                              className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center flex-shrink-0 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      সাইজ না দিলে ক্যাটাগরি অনুযায়ী অটো-ডিফল্ট ব্যবহার হবে।
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input type="checkbox" name="isSeasonal" className="w-4 h-4 rounded accent-emerald-700" />
                    সিজনাল পণ্য
                  </label>

                  <button
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold py-2.5 rounded-xl transition shadow disabled:opacity-50 text-sm"
                  >
                    {isPending ? "সেভ হচ্ছে..." : "+ পণ্য যোগ করুন"}
                  </button>
                </form>
              </div>
            </div>

            {/* Tenant Settings */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100 bg-stone-50/60">
                <Settings className="w-4.5 h-4.5 text-emerald-800" />
                <h3 className="font-extrabold text-base text-emerald-950">স্টোর সেটিংস</h3>
              </div>
              <div className="p-5">
                <form
                  action={async (formData) => {
                    startTransition(async () => {
                      try {
                        await updateTenantSettingsAction(tenant.id, tenant.slug, formData);
                        addToast("সেটিংস আপডেট হয়েছে!");
                      } catch (err: unknown) {
                        const msg = err instanceof Error ? err.message : "সেটিংস আপডেট ব্যর্থ হয়েছে!";
                        addToast(msg, "error");
                      }
                    });
                  }}
                  className="space-y-3 text-sm"
                >
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">স্টোরের নাম</label>
                    <input
                      name="name"
                      defaultValue={tenant.name}
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">ট্যাগলাইন / স্লোগান</label>
                    <input
                      name="tagline"
                      defaultValue={tenant.tagline || ""}
                      placeholder="যেমন: ১০০% খাঁটি ও নির্ভেজাল"
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">WhatsApp নাম্বার</label>
                    <input
                      name="whatsapp"
                      defaultValue={tenant.whatsapp}
                      placeholder="8801700000000"
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-600 mb-1 block">ডেলিভারি চার্জ (৳)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: "deliveryLocal", label: "রাজশাহী", val: tenant.deliveryLocal },
                        { name: "deliveryDhaka", label: "ঢাকা", val: tenant.deliveryDhaka },
                        { name: "deliveryOutside", label: "অন্যান্য", val: tenant.deliveryOutside },
                      ].map((f) => (
                        <div key={f.name}>
                          <span className="text-[10px] text-stone-500 block mb-0.5">{f.label}</span>
                          <input
                            name={f.name}
                            type="number"
                            defaultValue={f.val}
                            className="w-full border border-stone-200 rounded-xl px-2 py-1.5 text-center text-xs bg-stone-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    disabled={isPending}
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 font-bold py-2 rounded-xl transition shadow-sm disabled:opacity-50 text-sm"
                  >
                    {isPending ? "আপডেট হচ্ছে..." : "সেটিংস সেভ করুন"}
                  </button>
                </form>
              </div>
            </div>

            {/* Instant Order Notification Alerts (Telegram & WhatsApp) */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-800/50 shadow-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/40 bg-emerald-950/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">অর্ডার ইনস্ট্যান্ট নোটিফিকেশন</h3>
                    <p className="text-[10px] text-emerald-300">Telegram & WhatsApp অ্যালার্ট</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-sm">
                  অটোমেশন
                </span>
              </div>
              <div className="p-5 space-y-4 text-xs">
                <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-xl p-3 text-[11px] leading-relaxed text-emerald-100">
                  <p className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                    <span>💡</span> টেলিগ্রাম কেন সেরা?
                  </p>
                  <p>
                    টেলিগ্রাম বট <strong>১০০% ফ্রি</strong> এবং আনলিমিটেড। একটি টেলিগ্রাম গ্রুপ বানিয়ে বটটি অ্যাড করলেই <strong>একাধিক ব্যক্তি বা মোবাইল নম্বরে</strong> সাথে সাথে রিয়েল-টাইম সাউন্ড অ্যালার্ট চলে যাবে।
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] text-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>কনফিগারেশন: <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">.env</code> ফাইল</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>সাপোর্ট: সিঙ্গেল চ্যাট বা আনলিমিটেড মেম্বার গ্রুপ</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isTestingNotif}
                  onClick={handleSendTestNotification}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-bold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingNotif ? "animate-spin" : ""}`} />
                  <span>{isTestingNotif ? "টেস্ট মেসেজ পাঠানো হচ্ছে..." : "🚀 টেস্ট অ্যালার্ট পাঠান"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Orders Panel ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4.5 h-4.5 text-emerald-800" />
                    <h3 className="font-extrabold text-base text-emerald-950">কাস্টমার অর্ডার সমূহ</h3>
                    <span className="bg-emerald-100 text-emerald-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {filteredOrders.length}/{tenant.orders.length}
                    </span>
                  </div>
                  {/* Search */}
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="নাম, ফোন বা অর্ডার নং..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl pl-8 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => {
                    const count = s === "ALL"
                      ? tenant.orders.length
                      : tenant.orders.filter((o) => o.status === s).length;
                    const isActive = filterStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleFilterChange(s)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          isActive
                            ? "bg-emerald-800 text-white shadow-sm"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                        }`}
                      >
                        {s === "ALL" ? "সব" : STATUS_CONFIG[s]?.bn || s}
                        <span className={`${isActive ? "bg-emerald-700 text-emerald-100" : "bg-stone-200 text-stone-600"} px-1 rounded text-[10px] font-black`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orders List */}
              <div className="p-4">
                {paginatedOrders.length === 0 ? (
                  <div className="text-center py-10 text-stone-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">
                      {searchQuery || filterStatus !== "ALL"
                        ? "এই ফিল্টারে কোনো অর্ডার নেই।"
                        : "এখনো কোনো অর্ডার আসেনি।"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedOrders.map((o) => {
                      const currentStatus = orderStatuses[o.id] || o.status;
                      const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG["PENDING"];
                      const StatusIcon = cfg.icon;
                      return (
                        <div
                          key={o.id}
                          className="border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition shadow-sm space-y-2.5 p-4"
                        >
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-emerald-950 font-mono">
                                  #{o.orderNumber}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2 py-0.5 rounded-full ${cfg.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {cfg.bn}
                                </span>
                                <span className="text-[11px] text-stone-400 font-medium">{formatRelativeTime(o.createdAt)}</span>
                              </div>
                              <div className="mt-0.5">
                                <span className="font-bold text-sm text-stone-900">{o.customerName}</span>
                                <span className="text-stone-400 mx-1.5">·</span>
                                <span className="text-xs text-stone-500 font-medium">{o.customerPhone}</span>
                              </div>
                            </div>

                            {/* Status Selector */}
                            <select
                              value={currentStatus}
                              onChange={(e) => handleStatusChange(o.id, e.target.value)}
                              disabled={isPending}
                              className={`text-xs font-bold border-2 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer ${cfg.color} disabled:opacity-50`}
                            >
                              {Object.entries(STATUS_CONFIG).map(([val, sc]) => (
                                <option key={val} value={val}>{sc.bn}</option>
                              ))}
                            </select>
                          </div>

                          {/* Address & Payment */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-600">
                            <div>
                              <span className="font-semibold text-stone-700">📍 ঠিকানা: </span>
                              {o.shippingAddress}
                              <span className="text-stone-400 ml-1">
                                ({o.deliveryArea === "LOCAL" ? "রাজশাহী" : o.deliveryArea === "DHAKA" ? "ঢাকা" : "অন্যান্য"})
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-stone-700">💳 পেমেন্ট: </span>
                              {o.paymentMethod}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="bg-white rounded-xl border border-stone-200/70 px-3 py-2 text-xs text-stone-800 space-y-1">
                            {o.items.map((i, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{i.productName} ({i.unit}) × {i.quantity}</span>
                                <span className="font-bold">৳{i.unitPrice * i.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-0.5">
                            <div className="text-sm font-extrabold text-emerald-950">
                              সর্বমোট: <span className="text-amber-700 font-mono">৳{o.totalAmount}</span>
                              <span className="text-xs text-stone-400 font-normal ml-1.5">(ডেলিভারি ৳{o.deliveryCharge})</span>
                            </div>
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={`https://wa.me/88${o.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `আসসালামু আলাইকুম ${o.customerName}, "${tenant.name}" থেকে আপনার অর্ডার (${o.orderNumber}) এখন "${cfg.bn}" পর্যায়ে রয়েছে।`
                              )}`}
                              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Pagination ──────────────────────────────────────────── */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
                    <span className="text-xs text-stone-500">
                      পৃষ্ঠা {safeCurrentPage} / {totalPages} ({filteredOrders.length} অর্ডার)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safeCurrentPage === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, safeCurrentPage - 2);
                        if (page > totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                              page === safeCurrentPage
                                ? "bg-emerald-800 text-white"
                                : "border border-stone-200 text-stone-600 hover:bg-stone-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Product Inventory with Inline Stock Edit ─────────────────── */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-emerald-800" />
                  <h3 className="font-extrabold text-base text-emerald-950">পণ্য ও স্টক তালিকা</h3>
                </div>
                <div className="flex items-center gap-2">
                  {lowStockCount > 0 && (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      {lowStockCount}টি কম স্টক
                    </span>
                  )}
                  <span className="text-xs text-stone-400">মোট: {tenant.products.length}</span>
                </div>
              </div>

              <div className="divide-y divide-stone-100">
                {tenant.products.map((p) => {
                  const isEditing = editingProductId === p.id;
                  const isLowStock = p.stock <= 5;
                  return (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        {/* Product Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{p.icon || "📦"}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-stone-900 text-sm block truncate">{p.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-stone-500">{p.unit}</span>
                              <span className="text-[11px] font-bold text-amber-700">৳{p.price}</span>
                              <span className={`text-[11px] font-bold ${isLowStock ? "text-rose-600" : "text-emerald-700"}`}>
                                {isLowStock && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                                স্টক: {p.stock}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => isEditing ? setEditingProductId(null) : startEditProduct(p)}
                            className={`p-2 rounded-lg text-xs font-bold transition ${
                              isEditing
                                ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`"${p.name}" মুছে ফেলতে নিশ্চিত?`)) {
                                startTransition(async () => {
                                  try {
                                    await deleteProductAction(p.id, tenant.slug);
                                    addToast("পণ্য মুছে ফেলা হয়েছে।");
                                  } catch {
                                    addToast("মুছতে ব্যর্থ হয়েছে!", "error");
                                  }
                                });
                              }
                            }}
                            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Panel */}
                      {isEditing && (
                        <div className="mt-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex flex-wrap items-end gap-2">
                          <div className="flex-1 min-w-[80px]">
                            <label className="text-[10px] font-bold text-stone-500 block mb-0.5">স্টক আপডেট</label>
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                            />
                          </div>
                          <div className="flex-1 min-w-[80px]">
                            <label className="text-[10px] font-bold text-stone-500 block mb-0.5">মূল্য (৳)</label>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                            />
                          </div>
                          <button
                            onClick={() => saveProductEdit(p.id)}
                            disabled={isPending}
                            className="flex-1 min-w-[80px] bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            সেভ করুন
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
