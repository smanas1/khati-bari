"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { placeOrderAction } from "@/app/actions";
import {
  ShoppingBag,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Sparkles,
  Phone,
  MessageCircle,
  Heart,
  Crown,
  Leaf,
  Trash2,
  Search,
  X,
  Package,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowUp,
  FileText,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Award,
  Check,
  Calculator,
  MapPin,
  Scale,
  ArrowRight,
  Flame,
  Zap,
} from "lucide-react";
import {
  COURIER_SERVICES,
  CourierId,
  DeliveryAreaKey,
  DELIVERY_AREAS,
  estimateWeightKg,
  calculateCourierCharge,
  compareAllCouriers,
  POPULAR_PRODUCT_PRESETS,
  parseEnabledCouriers,
} from "@/lib/courierPricing";

interface TenantProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  isSeasonal: boolean;
  isComingSoon?: boolean;
  icon: string;
  image?: string | null;
  variants?: string | null;
  description: string | null;
  createdAt?: string | Date;
}

export interface ProductVariant {
  unit: string;
  price: number;
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
  enabledCouriers?: string | null;
  products: TenantProduct[];
  orders: TenantOrder[];
}

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  icon: string;
  image?: string | null;
  qty: number;
  variants: ProductVariant[];
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export function parseVariants(p: TenantProduct): ProductVariant[] {
  if (p.variants) {
    try {
      const parsed = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          unit: String(item.unit || p.unit),
          price: Number(item.price || p.price),
        }));
      }
    } catch {
      // fallback
    }
  }

  // Fallback defaults if variants are not specified
  if (p.category === "মধু" || p.name.includes("মধু")) {
    return [
      { unit: "৫০০ মিলি", price: 650 },
      { unit: "১ লিটার", price: 1250 },
      { unit: "২ লিটার", price: 2400 },
    ];
  } else if (p.category === "আম" || p.name.includes("আম")) {
    return [
      { unit: "৫ কেজি", price: 450 },
      { unit: "১০ কেজি", price: 850 },
      { unit: "২০ কেজি", price: 1600 },
    ];
  } else if (p.category === "গুড়" || p.name.includes("গুড়")) {
    return [
      { unit: "পাটালি (৫০০ গ্রাম)", price: 220 },
      { unit: "পাটালি (১ কেজি)", price: 420 },
      { unit: "ঝোলা গুড় (১ কেজি)", price: 450 },
      { unit: "দানা গুড় (১ কেজি)", price: 450 },
    ];
  }
  return [{ unit: p.unit, price: p.price }];
}

export function getDefaultVariant(p: TenantProduct, variants: ProductVariant[]): ProductVariant {
  if (p.category === "মধু" || p.name.includes("মধু")) {
    const v500 = variants.find((v) => v.unit.includes("৫০০"));
    if (v500) return v500;
  }
  return variants[0] || { unit: p.unit, price: p.price };
}

function formatPhoneDisplay(phoneStr: string): string {
  const clean = phoneStr.replace(/\D/g, "");
  if (clean.startsWith("880") && clean.length === 13) {
    return `+880 ${clean.slice(3, 7)}-${clean.slice(7)}`;
  }
  if (clean.startsWith("01") && clean.length === 11) {
    return `+88 ${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return phoneStr;
}

export default function StorefrontClient({ tenant }: { tenant: TenantData }) {
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Checkout form states
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNote, setCustNote] = useState("");
  const [deliveryArea, setDeliveryArea] = useState<DeliveryAreaKey>("DHAKA");
  const [selectedCourier, setSelectedCourier] = useState<CourierId>("steadfast");
  const [manualCourierOverride, setManualCourierOverride] = useState(false);
  const [showCourierPicker, setShowCourierPicker] = useState(false);
  const [showSpecialNote, setShowSpecialNote] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [savedInfoLoaded, setSavedInfoLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ক্যাশ অন ডেলিভারি (COD)");

  // Courier Calculator Modal States
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [modalArea, setModalArea] = useState<DeliveryAreaKey>("DHAKA");
  const [modalWeight, setModalWeight] = useState<number>(1.4);
  const [modalCustomWeight, setModalCustomWeight] = useState<string>("");

  // Toast Helper
  const addToast = (type: "success" | "error" | "warning" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // LocalStorage Cart, Wishlist & Saved Customer Hydration (SSR safe)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(`khati_cart_${tenant.slug}`);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
      const savedWishlist = localStorage.getItem(`khati_wishlist_${tenant.slug}`);
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (typeof parsed === "object" && parsed !== null) setWishlist(parsed);
      }
      const savedCustomer = localStorage.getItem(`khati_customer_info`);
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        if (parsed.name) setCustName(parsed.name);
        if (parsed.phone) setCustPhone(parsed.phone);
        if (parsed.address) setCustAddress(parsed.address);
        if (parsed.deliveryArea) setDeliveryArea(parsed.deliveryArea);
        if (parsed.name && parsed.phone) setSavedInfoLoaded(true);
      }
    } catch {
      // fallback
    }
    setIsHydrated(true);
  }, [tenant.slug]);

  // Sync to LocalStorage on updates
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(`khati_cart_${tenant.slug}`, JSON.stringify(cart));
    } catch {
      // storage full / disabled
    }
  }, [cart, isHydrated, tenant.slug]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(`khati_wishlist_${tenant.slug}`, JSON.stringify(wishlist));
    } catch {
      // storage full / disabled
    }
  }, [wishlist, isHydrated, tenant.slug]);

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleWishlist(id: string) {
    setWishlist((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        addToast("info", "পণ্যটি আপনার পছন্দের তালিকায় যোগ করা হয়েছে।");
      }
      return { ...prev, [id]: nextState };
    });
  }

  function toggleDescription(id: string) {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function updateCardQty(productId: string, delta: number, maxStock: number = 99) {
    setCardQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  }

  // Weight calculation for cart items
  const totalCartWeightKg = cart.reduce((sum, item) => {
    return sum + estimateWeightKg(item.unit, item.name) * item.qty;
  }, 0);

  const effectiveCartWeightKg = totalCartWeightKg > 0 ? totalCartWeightKg : 1.0;

  const enabledCouriersList = parseEnabledCouriers(tenant.enabledCouriers);

  // Default courier is always first available enabled courier (preferably Steadfast)
  useEffect(() => {
    if (manualCourierOverride || cart.length === 0) return;
    const defaultCourier = enabledCouriersList.includes("steadfast")
      ? "steadfast"
      : enabledCouriersList[0] || "steadfast";
    setSelectedCourier(defaultCourier);
  }, [cart, manualCourierOverride, tenant.enabledCouriers]);

  // If currently selected courier is disabled, switch to first active courier
  useEffect(() => {
    if (!enabledCouriersList.includes(selectedCourier)) {
      setSelectedCourier(enabledCouriersList[0] || "steadfast");
    }
  }, [tenant.enabledCouriers, selectedCourier]);

  const currentCourierCalculation = calculateCourierCharge(
    selectedCourier,
    deliveryArea,
    effectiveCartWeightKg
  );

  const deliveryCharge = cart.length > 0 ? currentCourierCalculation.charge : 0;
  const subTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const grandTotal = cart.length > 0 ? subTotal + deliveryCharge : 0;
  const totalCartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Dynamic Categories & counts
  const rawCategories = Array.from(new Set(tenant.products.map((p) => p.category)));
  const categoriesList = ["ALL", ...Array.from(new Set(["মধু", "আম", "গুড়", ...rawCategories]))];

  const getCategoryCount = (cat: string) => {
    if (cat === "ALL") return tenant.products.length;
    return tenant.products.filter((p) => p.category === cat).length;
  };

  const filteredProducts = tenant.products.filter((p) => {
    const matchCat = selectedCat === "ALL" || p.category === selectedCat;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Ensure Honey products appear first
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.category === "মধু" && b.category !== "মধু") return -1;
    if (b.category === "মধু" && a.category !== "মধু") return 1;
    return 0;
  });

  const heroProduct = tenant.products[0];
  const heroImage = heroProduct?.image || "/products/honey.jpg";

  function addToCart(
    product: TenantProduct,
    variant?: ProductVariant,
    qtyToAdd: number = 1,
    openDrawer: boolean = false
  ) {
    if (product.isComingSoon) {
      addToast("info", `"${product.name}" কামিং সুন (শীঘ্রই আসছে)! অগ্রিম বুকিং করতে WhatsApp বাটনে ক্লিক করুন।`);
      return;
    }
    if (product.stock <= 0) {
      addToast("error", `দুঃখিত, "${product.name}" বর্তমানে স্টক আউট!`);
      return;
    }
    const allVariants = parseVariants(product);
    const activeVar = variant || selectedVariants[product.id] || getDefaultVariant(product, allVariants);
    const cartKey = `${product.id}_${activeVar.unit}`;

    let reachedMax = false;

    setCart((prev) => {
      const exists = prev.find((item) => item.cartKey === cartKey);
      if (exists) {
        const nextQty = exists.qty + qtyToAdd;
        if (nextQty > product.stock) {
          reachedMax = true;
          return prev;
        }
        return prev.map((item) =>
          item.cartKey === cartKey ? { ...item, qty: nextQty } : item
        );
      }
      return [
        ...prev,
        {
          cartKey,
          productId: product.id,
          name: product.name,
          category: product.category,
          unit: activeVar.unit,
          price: activeVar.price,
          stock: product.stock,
          icon: product.icon,
          image: product.image,
          qty: qtyToAdd,
          variants: allVariants,
        },
      ];
    });

    if (reachedMax) {
      addToast("warning", `সর্বোচ্চ স্টক সীমা (${product.stock} টি) কার্টে রয়েছে!`);
      return;
    }

    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      setAddedItemKey(cartKey);
      addToast("success", `"${product.name} (${activeVar.unit})" কার্টে যোগ করা হয়েছে!`);
      setTimeout(() => {
        setAddedItemKey(null);
      }, 1500);
    }
  }

  function handleDirectOrder(
    product: TenantProduct,
    variant?: ProductVariant,
    qtyToAdd: number = 1
  ) {
    if (product.isComingSoon) {
      addToast("info", `"${product.name}" কামিং সুন (শীঘ্রই আসছে)! অগ্রিম বুকিং করতে WhatsApp বাটনে ক্লিক করুন।`);
      return;
    }
    if (product.stock <= 0) {
      addToast("error", `দুঃখিত, "${product.name}" বর্তমানে স্টক আউট!`);
      return;
    }
    const allVariants = parseVariants(product);
    const activeVar = variant || selectedVariants[product.id] || getDefaultVariant(product, allVariants);
    addToCart(product, activeVar, qtyToAdd, true);
    if (savedInfoLoaded && custName && custPhone) {
      addToast("success", `"${product.name}" যোগ হয়েছে। আপনার ঠিকানা সংরক্ষিত আছে, সরাসরি অর্ডার নিশ্চিত করুন।`);
    } else {
      addToast("info", `"${product.name}" অর্ডারের জন্য প্রস্তুত। আপনার ডেলিভারি তথ্য দিন।`);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 250);
    }
  }

  function updateQty(cartKey: string, delta: number) {
    let warningMsg: string | null = null;
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.qty + delta;
            if (nextQty > item.stock) {
              warningMsg = `স্টকে কেবল ${item.stock} টি অবশিষ্ট আছে!`;
              return item;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
    if (warningMsg) {
      addToast("warning", warningMsg);
    }
  }

  function removeFromCart(cartKey: string) {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
    addToast("info", "পণ্যটি কার্ট থেকে সরানো হয়েছে।");
  }

  function changeCartItemVariant(currentCartKey: string, newUnit: string) {
    setCart((prev) => {
      const itemIndex = prev.findIndex((i) => i.cartKey === currentCartKey);
      if (itemIndex === -1) return prev;
      const currentItem = prev[itemIndex];
      const newVariant = currentItem.variants.find((v) => v.unit === newUnit);
      if (!newVariant) return prev;

      const newCartKey = `${currentItem.productId}_${newUnit}`;
      if (newCartKey === currentCartKey) return prev;

      const existingTargetIndex = prev.findIndex((i) => i.cartKey === newCartKey);
      if (existingTargetIndex !== -1) {
        return prev
          .filter((_, idx) => idx !== itemIndex)
          .map((item) =>
            item.cartKey === newCartKey
              ? { ...item, qty: Math.min(item.qty + currentItem.qty, item.stock) }
              : item
          );
      }

      return prev.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              cartKey: newCartKey,
              unit: newVariant.unit,
              price: newVariant.price,
            }
          : item
      );
    });
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      addToast("warning", "কার্ট খালি! অনুগ্রহ করে প্রথমে পণ্য যোগ করুন।");
      return;
    }
    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      addToast("error", "অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা প্রদান করুন।");
      return;
    }

    // Phone validation (Bangladesh 11 digit format: 017, 018, 019, 016, 015, 014, 013 + Teletalk 015)
    const cleanPhone = custPhone.replace(/\D/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone) && !/^01[2]\d{8}$/.test(cleanPhone)) {
      addToast("error", "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      return;
    }

    setLoading(true);
    try {
      const courierNote = `[কুরিয়ার: ${COURIER_SERVICES[selectedCourier].banglaName} (${COURIER_SERVICES[selectedCourier].shortDeliveryType}) | ওজন: ~${effectiveCartWeightKg.toFixed(1)} কেজি | চার্জ: ৳${deliveryCharge}]`;
      const fullShippingAddress = [
        custAddress.trim(),
        courierNote,
        custNote.trim() ? `[নির্দেশনা: ${custNote.trim()}]` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const deliveryAreaLabel = `${DELIVERY_AREAS[deliveryArea].name} - ${COURIER_SERVICES[selectedCourier].banglaName}`;

      const res = await placeOrderAction({
        tenantId: tenant.id,
        slug: tenant.slug,
        customerName: custName.trim(),
        customerPhone: cleanPhone,
        shippingAddress: fullShippingAddress,
        deliveryArea: deliveryAreaLabel,
        deliveryCharge,
        paymentMethod,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.name,
          unit: c.unit,
          quantity: c.qty,
          unitPrice: c.price,
        })),
      });

      setCart([]);
      setIsCartOpen(false);
      setOrderSuccessMsg(
        `আলহামদুলিল্লাহ! আপনার অর্ডার (${res.orderNumber}) সফলভাবে গৃহীত হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনার নম্বরে যোগাযোগ করবেন।`
      );
      addToast("success", `অর্ডার সফল! অর্ডার নম্বর: ${res.orderNumber}`);

      // Persist customer information so future orders are 1-click
      try {
        localStorage.setItem(
          `khati_customer_info`,
          JSON.stringify({
            name: custName.trim(),
            phone: cleanPhone,
            address: custAddress.trim(),
            deliveryArea,
          })
        );
        setSavedInfoLoaded(true);
      } catch {
        // ignore
      }
      setCustNote("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "অর্ডার প্রক্রিয়াকরণে সমস্যা হয়েছে";
      addToast("error", "ত্রুটি: " + message);
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppOrder() {
    if (cart.length === 0) {
      addToast("warning", "প্রথমে কার্টে পণ্য যোগ করুন!");
      return;
    }

    if (!custName.trim() || !custPhone.trim() || !custAddress.trim()) {
      addToast("info", "সহজ ডেলিভারির জন্য নাম, ফোন ও ঠিকানা পূরণ করার পরামর্শ দেওয়া হলো।");
    }

    const lines = cart
      .map((i) => `• ${i.name} (${i.unit}) x ${i.qty} = ৳${i.price * i.qty}`)
      .join("%0A");

    const courierInfo = `${COURIER_SERVICES[selectedCourier].banglaName} (${COURIER_SERVICES[selectedCourier].shortDeliveryType})`;
    const notePart = custNote.trim() ? `%0A*বিশেষ নির্দেশনা:* ${encodeURIComponent(custNote.trim())}` : "";
    const msg = `আসসালামু আলাইকুম *${tenant.name}*,%0Aআমি নাটোর থেকে নিচের পণ্যগুলো অর্ডার করতে চাই:%0A${lines}%0A%0A*গন্তব্য:* ${encodeURIComponent(DELIVERY_AREAS[deliveryArea].name)}%0A*নির্বাচিত কুরিয়ার:* ${encodeURIComponent(courierInfo)}%0A*পার্সেলের আনুমানিক ওজন:* ${effectiveCartWeightKg.toFixed(1)} কেজি%0A*ডেলিভারি চার্জ:* ৳${deliveryCharge}%0A*সর্বমোট বিল:* ৳${grandTotal}%0A%0A*নাম:* ${encodeURIComponent(custName.trim() || "উল্লেখ করা হয়নি")}%0A*মোবাইল:* ${encodeURIComponent(custPhone.trim() || "উল্লেখ করা হয়নি")}%0A*ঠিকানা:* ${encodeURIComponent(custAddress.trim() || "উল্লেখ করা হয়নি")}${notePart}`;

    window.open(`https://wa.me/${tenant.whatsapp}?text=${msg}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white relative">
      {/* ==================== TOAST NOTIFICATION CONTAINER ==================== */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-fadeIn ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/50 text-white"
                : toast.type === "error"
                ? "bg-rose-950/95 border-rose-500/50 text-white"
                : toast.type === "warning"
                ? "bg-amber-950/95 border-amber-500/50 text-white"
                : "bg-stone-900/95 border-stone-700 text-white"
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white transition p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Customer Announcement Bar */}
      <div className="bg-emerald-950 text-emerald-200 text-xs px-3 sm:px-4 py-2 border-b border-emerald-900 shadow-inner">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Single-line View */}
          <div className="sm:hidden flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-[11px] font-bold text-amber-300 truncate">
                প্রাকৃতিক ও নির্ভেজাল খাদ্যোপাদান
              </span>
            </div>
            <a
              href={`https://wa.me/${tenant.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-200 bg-emerald-900/90 hover:bg-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-700/80 transition flex-shrink-0"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>যোগাযোগ</span>
            </a>
          </div>

          {/* Desktop Rich Layout */}
          <div className="hidden sm:flex justify-between items-center gap-4 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full text-[11px] shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-950" />
                প্রাকৃতিক ও নির্ভেজাল
              </span>
              <span className="text-emerald-100 font-medium">
                সরাসরি মৌয়াল ও রাজশাহীর নিজস্ব বাগান থেকে সংগৃহীত প্রাকৃতিক খাদ্যোপাদান
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-emerald-200 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>সারাদেশে দ্রুত ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>হটলাইন: {formatPhoneDisplay(tenant.whatsapp)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center gap-2 sm:gap-4">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 border border-emerald-500/30 group flex-shrink-0">
              <Leaf className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-emerald-200 group-hover:rotate-6 transition-transform duration-300 drop-shadow" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-emerald-950" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-1.5 truncate">
                <span>{tenant.name}</span>
                {tenant.slug !== "khatibari" && tenant.name !== "খাঁটি বাড়ি" ? (
                  <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    খাঁটি বাড়ি
                  </span>
                ) : (
                  <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    অফিসিয়াল
                  </span>
                )}
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-500 font-medium truncate">
                {tenant.tagline || "প্রাকৃতিক ও নির্ভেজাল খাদ্যের বিশ্বস্ত প্রতিষ্ঠান"}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCourierModalOpen(true)}
              title="নাটোর কুরিয়ার ডেলিভারি চার্জ জানুন"
              aria-label="কুরিয়ার চার্জ"
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-950 border border-amber-300 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
              <span className="hidden sm:inline">নাটোর ডেলিভারি চার্জ</span>
              <span className="sm:hidden text-[11px]">কুরিয়ার চার্জ</span>
            </button>

            <a
              href={`https://wa.me/${tenant.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:scale-[1.02]"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-1 sm:gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-emerald-950 font-black px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all border border-amber-600/30 cursor-pointer whitespace-nowrap flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-950 flex-shrink-0" />
              <span className="text-xs sm:text-sm">কার্ট</span>
              {totalCartCount > 0 && (
                <span className="bg-emerald-950 text-amber-300 text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold shadow">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Order Success Banner */}
      {orderSuccessMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4 w-full animate-fadeIn">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold">{orderSuccessMsg}</p>
            </div>
            <button
              onClick={() => setOrderSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg hover:bg-emerald-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== STOREFRONT MAIN ==================== */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Hero Banner with Dynamic Images & Social Proof */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-[#063828] to-stone-950 text-white rounded-3xl p-6 sm:p-10 lg:p-12 mb-8 shadow-2xl border border-emerald-800/40">
          <div className="absolute top-0 right-1/4 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading, Value Proposition & Action CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 text-xs font-black px-4 py-1.5 rounded-full mb-4 shadow-md w-fit">
                <Sparkles className="w-3.5 h-3.5 text-emerald-950" />
                <span>প্রাকৃতিক ও দেশীয় উপাদানের খাঁটি নিশ্চয়তা</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-black leading-[1.25] tracking-tight text-white">
                খাঁটি <span className="text-amber-300 underline decoration-amber-400/50 decoration-wavy">মধু</span>, রাজশাহীর <span className="text-amber-300">মিষ্টি আম</span> ও ভেজালমুক্ত <span className="text-amber-300">গুড়ের</span> বিশ্বস্ত প্রতিষ্ঠান
              </h2>

              <p className="text-emerald-100/90 text-sm sm:text-base mt-4 leading-relaxed max-w-xl font-normal">
                গ্রাম-বাংলার প্রাকৃতিক মৌচাক, বিশ্বস্ত মৌয়াল ও রাজশাহীর নিজস্ব বাগান থেকে সংগৃহীত সম্পূর্ণ নির্ভেজাল খাদ্যোপাদান। কোনো প্রকার কেমিক্যাল বা প্রিজারভেটিভ ছাড়া খাঁটি স্বাদের সর্বোচ্চ নিশ্চয়তা।
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 mt-6">
                <button
                  onClick={() => {
                    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-emerald-950 font-black px-6 py-3.5 rounded-2xl text-sm sm:text-base shadow-xl shadow-amber-950/30 transition-all hover:scale-[1.02]"
                >
                  <ShoppingBag className="w-5 h-5 text-emerald-950" />
                  <span>পণ্যসমূহ দেখুন ও অর্ডার করুন</span>
                </button>

                <a
                  href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম ${tenant.name}, আমি আপনাদের পণ্য অর্ডার সংক্রান্ত বিষয়ে জানতে চাচ্ছি।`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-900/80 hover:bg-emerald-800/90 active:scale-95 text-emerald-100 border border-emerald-600/50 backdrop-blur-md font-bold px-5 py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-md hover:scale-[1.02]"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>WhatsApp-এ কথা বলুন</span>
                </a>
              </div>

              {/* Guarantees Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-emerald-800/60 text-xs text-emerald-200 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>শতভাগ কেমিক্যালমুক্ত</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>ক্যাশ অন ডেলিভারি</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>দ্রুততম হোম ডেলিভারি</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Product Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
              <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-emerald-400/40 shadow-2xl bg-emerald-900/50 backdrop-blur-md group ring-4 ring-emerald-500/20">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                  <Image
                    src={heroImage}
                    alt={heroProduct?.name || "Featured Product"}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 text-[11px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-amber-200">
                    <Flame className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950" />
                    <span>হট বেস্টসেলার • প্রাকৃতিক চাকের মধু</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 bg-stone-950/85 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/15 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        রেডি স্টক • লাইভ ডেলিভারি
                      </p>
                      <p className="text-xs font-black text-white">প্রাকৃতিক চাকের খাঁটি মধু (কাঁচা)</p>
                    </div>
                    <span className="text-[11px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      স্টকে রেডি
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Mango Card */}
              <div className="absolute -top-3 -left-2 sm:-left-6 bg-white/95 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl shadow-xl border border-stone-200/90 flex items-center gap-2 sm:gap-2.5 z-20 hover:scale-105 transition-transform">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden relative border border-stone-200 flex-shrink-0 bg-stone-100">
                  <Image
                    src="/products/mango.jpg"
                    alt="Mango"
                    fill
                    sizes="44px"
                    priority
                    className="object-cover opacity-90"
                  />
                </div>
                <div className="pr-1.5 sm:pr-2">
                  <span className="text-[9px] sm:text-[10px] text-stone-500 font-bold block">সিজনাল • শীঘ্রই আসছে</span>
                  <span className="text-[11px] sm:text-xs font-black text-stone-800 block">মিষ্টি পাকা আম 🥭</span>
                </div>
              </div>

              {/* Floating Gur Card (Hidden on mobile screens to prevent overlap with rating badge) */}
              <div className="hidden sm:flex absolute -bottom-3 -left-4 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-stone-200/90 items-center gap-2.5 z-20 hover:scale-105 transition-transform">
                <div className="w-11 h-11 rounded-xl overflow-hidden relative border border-stone-200 flex-shrink-0 bg-stone-100">
                  <Image
                    src="/products/gur.jpg"
                    alt="Gur"
                    fill
                    sizes="44px"
                    priority
                    className="object-cover opacity-90"
                  />
                </div>
                <div className="pr-2">
                  <span className="text-[10px] text-stone-500 font-bold block">ঐতিহ্যবাহী • শীঘ্রই আসছে</span>
                  <span className="text-xs font-black text-stone-800 block">খাঁটি খেজুরের গুড় 🏺</span>
                </div>
              </div>

              {/* Social Proof Badge */}
              <div className="absolute -bottom-3 -right-2 sm:-right-4 bg-emerald-950/95 backdrop-blur-md text-white px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-2xl border border-emerald-700/70 z-20 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-sm sm:text-base shadow flex-shrink-0">
                  ★
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px] sm:text-xs">
                    <span>৪.৯ / ৫.০</span>
                    <span className="text-stone-300 font-normal text-[10px] sm:text-[11px]">(সন্তুষ্ট ক্রেতা)</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-emerald-200 font-medium">প্রাকৃতিক ও সেরা গুণমান</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== NATORE COURIER PRICING & COMPARISON QUICK BANNER ==================== */}
        <div className="bg-gradient-to-br from-emerald-950 via-[#063828] to-stone-900 text-white rounded-3xl p-4 sm:p-6 mb-8 border border-emerald-800/60 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  নাটোর হাব থেকে সারা দেশে ডেলিভারি
                </span>
                <span className="text-emerald-200 text-xs flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  উৎস: নাটোর (রাজশাহী বিভাগ)
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white">
                📦 কোন কুরিয়ারে কত ডেলিভারি চার্জ? ৪টি কুরিয়ারের সহজ তুলনা
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
                পণ্যের সাইজ ও ওজন অনুযায়ী সবচেয়ে সাশ্রয়ী কুরিয়ার বেছে নিন। মধুর জন্য <span className="text-amber-300 font-bold">স্টেডফাস্ট ও পাঠাও</span> হোম ডেলিভারি, এবং আম ও ভারী পার্সেলের জন্য <span className="text-amber-300 font-bold">সুন্দরবন ও এস এ পরিবহন</span> কাউন্টারে খরচ অর্ধেকেরও কম!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 active:scale-95 text-emerald-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-950/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-emerald-950" />
                <span>ডেলিভারি ক্যালকুলেটর খুলুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Courier Rates Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-emerald-800/50 text-[11px]">
            <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-700/50">
              <div className="font-bold text-emerald-200 flex items-center gap-1">
                <span>🚚 স্টেডফাস্ট কুরিয়ার</span>
              </div>
              <span className="text-[10px] text-emerald-300 block font-medium">হোম ডেলিভারি (২-৩ দিন)</span>
              <p className="text-stone-300 text-[10px] mt-1">মধু/গুড় ১ কেজি: ৳১১০ (ঢাকা) / ৳১৩০ (অন্য জেলা)</p>
            </div>

            <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-700/50">
              <div className="font-bold text-rose-300 flex items-center gap-1">
                <span>🔴 পাঠাও কুরিয়ার</span>
              </div>
              <span className="text-[10px] text-rose-200 block font-medium">স্মার্ট হোম ডেলিভারি</span>
              <p className="text-stone-300 text-[10px] mt-1">ছোট পার্সেল (০.৫-১ কেজি): ৳১১০-৳১৩০ (ঢাকা)</p>
            </div>

            <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-amber-500/40 relative">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <span>📦 সুন্দরবন কুরিয়ার</span>
              </div>
              <span className="text-[10px] text-amber-200 block font-medium">শাখা/কাউন্টার ডেলিভারি</span>
              <p className="text-amber-100 text-[10px] mt-1 font-semibold">আম ১০ কেজি: মাত্র ৳১৫০ | ২০ কেজি: মাত্র ৳২৭০!</p>
            </div>

            <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-sky-500/40">
              <div className="font-bold text-sky-300 flex items-center gap-1">
                <span>⚡ এস এ পরিবহন</span>
              </div>
              <span className="text-[10px] text-sky-200 block font-medium">দ্রুততম শাখা ডেলিভারি</span>
              <p className="text-stone-300 text-[10px] mt-1">২৪ ঘণ্টায় শাখা ডেলিভারি: ৫-১০ কেজি ৳১৫০-৳২০০</p>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div id="products-section" className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          {/* Category Pills with Dynamic Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categoriesList.map((cat) => {
              const count = getCategoryCount(cat);
              const label = cat === "ALL" ? "সব পণ্য" : cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCat === cat
                      ? "bg-emerald-800 text-white shadow-md scale-[1.02]"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCat === cat
                        ? "bg-emerald-950 text-amber-300"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              id="product-search"
              aria-label="পণ্য খুঁজুন"
              placeholder="পণ্য বা বিবরণ খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center my-6">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-700">কোনো পণ্য পাওয়া যায়নি!</h3>
            <p className="text-sm text-stone-500 mt-1">অন্য ক্যাটাগরি বা নামে অনুসন্ধান করে দেখুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((p) => {
              const productVariants = parseVariants(p);
              const activeVariant = selectedVariants[p.id] || getDefaultVariant(p, productVariants);
              const cardQty = cardQuantities[p.id] || 1;
              const isWishlisted = !!wishlist[p.id];
              const isComingSoon = Boolean(p.isComingSoon);
              const isOutOfStock = !isComingSoon && p.stock <= 0;
              const isLowStock = !isComingSoon && !isOutOfStock && p.stock <= 5;
              const isInStock = !isComingSoon && !isOutOfStock;
              const isExpanded = !!expandedDesc[p.id];

              return (
                <div
                  key={p.id}
                  className={`relative rounded-3xl p-4 sm:p-5 flex flex-col justify-between group transition-all duration-300 bg-white border ${
                    isInStock
                      ? "border-emerald-200/90 shadow-sm hover:shadow-xl hover:border-emerald-500/50"
                      : isComingSoon
                      ? "border-stone-200/90 shadow-xs opacity-90 hover:opacity-100"
                      : "border-stone-200/80 opacity-75"
                  }`}
                >
                  <div>
                    {/* Product Image Container with Next.js Image */}
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-4">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                            isOutOfStock ? "grayscale-[40%]" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 text-6xl">
                          {p.icon || "🍯"}
                        </div>
                      )}

                      {/* Top-Left Category / Status Badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        {isInStock ? (
                          <span className="bg-emerald-900/90 backdrop-blur-md text-emerald-100 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-emerald-700/60">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>স্টকে আছে</span>
                          </span>
                        ) : isComingSoon ? (
                          <span className="bg-stone-900/80 backdrop-blur-md text-stone-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-stone-700/60">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>শীঘ্রই আসছে</span>
                          </span>
                        ) : isOutOfStock ? (
                          <span className="bg-rose-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>স্টক শেষ</span>
                          </span>
                        ) : p.isSeasonal ? (
                          <span className="bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>সিজনাল</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-100 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            {p.category}
                          </span>
                        )}
                      </div>

                      {/* Top-Right Heart Wishlist Button */}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(p.id)}
                        aria-label="Wishlist"
                        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-stone-600 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isWishlisted ? "fill-rose-500 text-rose-500" : "text-stone-600"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Title */}
                    <h3 className="font-extrabold text-lg text-stone-900 group-hover:text-emerald-900 transition-colors">
                      {p.name}
                    </h3>

                    {/* Product Description with Expand Toggle */}
                    <div className="mt-1">
                      <p
                        className={`text-xs text-stone-500 leading-relaxed ${
                          isExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {p.description || "সম্পূর্ণ নির্ভেজাল ও স্বাস্থ্যসম্মত খাঁটি দেশীয় পণ্য।"}
                      </p>
                      {p.description && p.description.length > 70 && (
                        <button
                          type="button"
                          onClick={() => toggleDescription(p.id)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 mt-0.5 inline-flex items-center gap-0.5"
                        >
                          <span>{isExpanded ? "সংক্ষেপ করুন" : "আরো পড়ুন"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Size Selector Pills (or out of stock notification) */}
                    <div className="mt-3.5">
                      {isOutOfStock ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>এই পণ্যটি বর্তমানে অনুপলব্ধ। দ্রুত পুনরায় স্টকে আনা হবে।</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                              {p.category === "গুড়" || p.name.includes("গুড়")
                                ? "ধরণ ও সাইজ"
                                : "সাইজ নির্বাচন"}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              {activeVariant.unit}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {productVariants.map((v) => {
                              const isSelected = activeVariant.unit === v.unit;
                              return (
                                <button
                                  key={v.unit}
                                  type="button"
                                  onClick={() =>
                                    setSelectedVariants((prev) => ({ ...prev, [p.id]: v }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isSelected
                                      ? "bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700/30 scale-[1.02]"
                                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                                  }`}
                                >
                                  <span>{v.unit}</span>
                                  <span
                                    className={`text-[10px] ${
                                      isSelected
                                        ? "text-emerald-200 font-extrabold"
                                        : "text-stone-500"
                                    }`}
                                  >
                                    ৳{v.price}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Area: Pricing, Quantity Stepper & Buttons */}
                  <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-3">
                    {/* Price & Stock Indicator Row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-emerald-950 tracking-tight">
                            ৳{activeVariant.price}
                          </span>
                          <span className="text-xs text-stone-500 font-medium">
                            / {activeVariant.unit}
                          </span>
                        </div>

                        {/* If Qty > 1, show multiplied total */}
                        {cardQty > 1 && !isOutOfStock && !isComingSoon ? (
                          <div className="text-[11px] font-bold text-amber-800">
                            মোট: ৳{activeVariant.price * cardQty} ({cardQty} টি)
                          </div>
                        ) : (
                          /* Accurate Stock Status */
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
                            {isComingSoon ? (
                              <span className="text-stone-500">সিজন এলে পাওয়া যাবে</span>
                            ) : isOutOfStock ? (
                              <span className="text-rose-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                স্টক শেষ
                              </span>
                            ) : isLowStock ? (
                              <span className="text-amber-700 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                মাত্র {p.stock} টি অবশিষ্ট
                              </span>
                            ) : (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                স্টকে আছে ({p.stock} টি)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity Stepper (hidden if out of stock or coming soon) */}
                      {!isOutOfStock && !isComingSoon && (
                        <div className="flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200/70">
                          <button
                            type="button"
                            onClick={() => updateCardQty(p.id, -1, p.stock)}
                            className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition active:scale-90 text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-black text-stone-900 font-mono">
                            {cardQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCardQty(p.id, 1, p.stock)}
                            className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition active:scale-90 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: WhatsApp (icon), Cart (icon), Direct Order (clean primary) */}
                    <div className="flex items-center gap-2">
                      {/* WhatsApp Order Button */}
                      <a
                        href={
                          isComingSoon
                            ? `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                                `আসসালামু আলাইকুম, আমি "${p.name} (${activeVariant.unit})" আসার পর অগ্রিম বুকিং / কিনতে আগ্রহী। পণ্যটি কবে নাগাদ স্টকে পাওয়া যাবে?`
                              )}`
                            : isOutOfStock
                            ? "#"
                            : `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                                `আসসালামু আলাইকুম, আমি "${p.name} (${activeVariant.unit}) x ${cardQty} = ৳${activeVariant.price * cardQty}" অর্ডার করতে চাচ্ছি।`
                              )}`
                        }
                        target={isOutOfStock && !isComingSoon ? "_self" : "_blank"}
                        rel="noreferrer"
                        title={isComingSoon ? "WhatsApp-এ যোগাযোগ" : isOutOfStock ? "পণ্যটি স্টকে নেই" : "WhatsApp-এ অর্ডার"}
                        aria-label={isComingSoon ? "WhatsApp-এ যোগাযোগ" : "WhatsApp-এ অর্ডার"}
                        onClick={(e) => {
                          if (isOutOfStock && !isComingSoon) {
                            e.preventDefault();
                            addToast("error", `দুঃখিত, "${p.name}" বর্তমানে স্টক শেষ!`);
                          }
                        }}
                        className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-95 text-emerald-700 flex items-center justify-center transition shadow-xs flex-shrink-0"
                      >
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                      </a>

                      {/* Compact Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => addToCart(p, activeVariant, cardQty, false)}
                        disabled={isOutOfStock || isComingSoon}
                        title={isComingSoon ? "শীঘ্রই আসছে" : isOutOfStock ? "স্টক শেষ" : "কার্টে যোগ করুন"}
                        aria-label="কার্টে যোগ করুন"
                        className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl border flex items-center justify-center transition shadow-xs active:scale-95 flex-shrink-0 ${
                          isComingSoon || isOutOfStock
                            ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                            : addedItemKey === `${p.id}_${activeVariant.unit}`
                            ? "border-amber-400 bg-amber-100 text-emerald-950 scale-105"
                            : "border-stone-200 bg-white hover:bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {addedItemKey === `${p.id}_${activeVariant.unit}` ? (
                          <Check className="w-5 h-5 text-emerald-800" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-emerald-800" />
                        )}
                      </button>

                      {/* Large Primary "Order Now" Button / Pre-Order button */}
                      {isComingSoon ? (
                        <a
                          href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
                            `আসসালামু আলাইকুম, আমি "${p.name} (${activeVariant.unit})" আসার পর অগ্রিম বুকিং / প্রি-অর্ডার করতে চাই। পণ্যটি কবে নাগাদ স্টকে আসবে?`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-11 sm:h-12 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300"
                        >
                          <Clock className="w-4 h-4 text-stone-500" />
                          <span>শীঘ্রই আসছে — অগ্রিম বুকিং</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDirectOrder(p, activeVariant, cardQty)}
                          disabled={isOutOfStock}
                          aria-label="অর্ডার করুন"
                          className={`flex-1 h-11 sm:h-12 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
                            isOutOfStock
                              ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                              : "bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-950/20 hover:shadow-lg"
                          }`}
                        >
                          {isOutOfStock ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-stone-400" />
                              <span>স্টক শেষ</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                              <span>অর্ডার করুন</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== JSON-LD STRUCTURED DATA (SEO & AI OVERVIEWS) ==================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "OnlineStore",
              "@id": "https://khatibari.smanas.net/#store",
              name: tenant.name || "খাঁটি বাড়ি",
              alternateName: [
                "Khati Bari",
                "খাঁটি বাড়ি",
                "খাঁটি বাড়ি বাংলাদেশ",
                "khatibari",
                "খাঁটি বাড়ি অনলাইন শপ",
              ],
              url: "https://khatibari.smanas.net",
              logo: "https://khatibari.smanas.net/products/honey.jpg",
              image: "https://khatibari.smanas.net/products/honey.jpg",
              description:
                tenant.tagline ||
                "খাঁটি প্রাকৃতিক মধু, রাজশাহীর মিষ্টি আম ও খাঁটি খেজুরের গুড়ের বিশ্বস্ত অনলাইন শপ।",
              telephone: tenant.whatsapp || "+8801700000000",
              priceRange: "৳৳",
              currenciesAccepted: "BDT",
              paymentAccepted: "Cash on Delivery, bKash, Nagad",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Rajshahi",
                addressRegion: "Rajshahi",
                addressCountry: "BD",
              },
              areaServed: {
                "@type": "Country",
                name: "Bangladesh",
              },
              knowsAbout: [
                "খাঁটি প্রাকৃতিক মধু (Pure Natural Honey)",
                "প্রাকৃতিক চাকের খাঁটি মধু",
                "গ্রাম-বাংলার প্রাকৃতিক মৌচাক",
                "গাছ থেকে সংগৃহীত চাকের মধু",
                "সরিষা ফুলের মধু",
                "লিচু ফুলের মধু",
                "কালোজিরা মধু",
                "রাজশাহীর মিষ্টি আম (Rajshahi Mango)",
                "হিমসাগর আম",
                "ল্যাংড়া আম",
                "আম্রপালি",
                "খাঁটি খেজুরের গুড় (Pure Khejur Gur)",
                "পাটালি গুড়",
                "প্রাকৃতিক ও অর্গানিক খাদ্যোপাদান",
              ],
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "খাঁটি বাড়ি — প্রাকৃতিক ও নির্ভেজাল পণ্য তালিকা",
              itemListElement: tenant.products.map((p, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                item: {
                  "@type": "Product",
                  name: p.name,
                  image: p.image
                    ? p.image.startsWith("http")
                      ? p.image
                      : `https://khatibari.smanas.net${p.image}`
                    : "https://khatibari.smanas.net/products/honey.jpg",
                  description:
                    p.description ||
                    `${p.name} — খাঁটি, প্রাকৃতিক ও রাসায়নিকমুক্ত নির্ভেজাল দেশীয় উপাদান।`,
                  sku: `KB-${p.id}`,
                  brand: {
                    "@type": "Brand",
                    name: "খাঁটি বাড়ি",
                  },
                  offers: {
                    "@type": "Offer",
                    url: "https://khatibari.smanas.net",
                    priceCurrency: "BDT",
                    price: p.price,
                    availability:
                      p.stock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    itemCondition: "https://schema.org/NewCondition",
                    priceValidUntil: "2027-12-31",
                    seller: {
                      "@type": "Organization",
                      name: tenant.name,
                    },
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "4.9",
                    reviewCount: "148",
                    bestRating: "5",
                  },
                },
              })),
            }),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "খাঁটি মধু (Pure Honey) কীভাবে চিনবেন এবং কেন খাঁটি বাড়ি (khatibari.smanas.net)-এর মধু সেরা?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "খাঁটি মধু পানিতে দিলে সহজে দ্রবীভূত না হয়ে নিচে গিয়ে জমাট বাঁধে। খাঁটি বাড়ি কোনো কৃত্রিম বা চাষের মধু দেয় না, বরং প্রাকৃতিকভাবে মৌমাছিদের তৈরি গ্রাম-বাংলার আসল বুনো মৌচাক থেকে সরাসরি কাঁচা, অপরিশোধিত ও চিনি ছাড়া প্রাকৃতিক চাকের মধু ক্যাশ অন ডেলিভারিতে সরবরাহ করে।",
                  },
                },
                {
                  "@type": "Question",
                  name: "রাজশাহীর মিষ্টি আম (হিমসাগর, ল্যাংড়া, আম্রপালি) কীভাবে কার্বাইড ও কেমিক্যালমুক্ত অবস্থায় অনলাইনে কিনবেন?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "খাঁটি বাড়ি সরাসরি রাজশাহীর ঐতিহ্যবাহী বাগান থেকে প্রাকৃতিকভাবে গাছপাকা আম সংগ্রহ করে। কোনো কৃত্রিম কার্বাইড বা ফরমালিন দেওয়া হয় না। বিশেষ বায়ুরোধী ঝুড়ি ও অক্ষত প্যাকিংয়ে সারা বাংলাদেশে হোম ডেলিভারি দেওয়া হয়।",
                  },
                },
                {
                  "@type": "Question",
                  name: "খাঁটি খেজুরের গুড় ও পাটালি গুড়ের বৈশিষ্ট্য কী এবং নির্ভেজাল গুড় কীভাবে চেনা যায়?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "খাঁটি খেজুরের গুড়ে কোনো চিনি, ফিটকিরি বা কৃত্রিম রঙ মেশানো হয় না। এর ঘ্রাণ অত্যন্ত মিষ্টি ও স্বাভাবিক এবং মুখে দিলে সহজে মিলিয়ে যায়। খাঁটি বাড়ির গুড় রাজশাহীর অভিজ্ঞ গাছিদের খাঁটি রস দিয়ে তৈরি।",
                  },
                },
                {
                  "@type": "Question",
                  name: "khatibari.smanas.net থেকে কীভাবে ক্যাশ অন ডেলিভারিতে অর্ডার করবেন?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "khatibari.smanas.net ওয়েবসাইটে গিয়ে পণ্য কার্টে যোগ করুন। চেকআউট ফর্মে আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে 'অর্ডার কনফার্ম করুন' বাটনে ক্লিক করুন। এছাড়া সরাসরি WhatsApp-এও অর্ডার করতে পারেন। পণ্য হাতে পেয়ে চেক করে টাকা দেওয়ার সুযোগ রয়েছে।",
                  },
                },
              ],
            }),
          }}
        />

        {/* ==================== SEMANTIC SEO & GOOGLE AI KNOWLEDGE SECTION ==================== */}
        <section
          id="seo-guide"
          aria-label="খাঁটি প্রাকৃতিক খাদ্য ও সচরাচর জিজ্ঞাসা"
          className="mt-14 mb-8 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-sm"
        >
          {/* Section Header with Semantic H2 */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 mb-3 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>খাঁটি ও বিশ্বস্ত প্রাকৃতিক উৎস</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-snug">
              খাঁটি মধু, রাজশাহীর আম ও খাঁটি গুড় — কেন{" "}
              <span className="text-emerald-800 underline decoration-amber-400 decoration-wavy">
                {tenant.name || "খাঁটি বাড়ি"}
              </span>{" "}
              সেরা?
            </h2>
            <p className="text-sm text-stone-600 mt-3 leading-relaxed">
              আমরা কোনো প্রকার কৃত্রিম রঙ, কেমিক্যাল বা প্রিজারভেটিভ ছাড়া সরাসরি মূল উৎপাদক থেকে খাদ্যপণ্য আপনার ঘরে পৌঁছে দিই।
            </p>
          </div>

          {/* 3 Pillars of Authenticity (Semantic Content) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🍯
              </div>
              <h3 className="font-extrabold text-base text-stone-900 mb-2">
                প্রাকৃতিক চাকের খাঁটি মধু (Pure Wild Bee Honey)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                প্রাকৃতিকভাবে মৌমাছির তৈরি গাছ ও আসল মৌচাক থেকে বিশ্বস্ত মৌয়ালদের সহায়তায় সংগৃহীত খাঁটি চাকের মধু। কোনো প্রকার চাষের ভেজাল, হিটিং প্রসেসিং বা কৃত্রিম চিনি ছাড়া সম্পূর্ণ কাঁচা (Raw) ও পুষ্টিকর মধু যা রোগ প্রতিরোধ ক্ষমতা বাড়ায়।
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🥭
              </div>
              <h3 className="font-extrabold text-base text-stone-900 mb-2">
                রাজশাহীর মিষ্টি আম (Chemical-Free Mango)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                গাছপাকা হিমসাগর, ল্যাংড়া, আম্রপালি ও ফজলি আম। কোনো প্রকার ক্ষতিকারক কার্বাইড বা ফরমালিন দেওয়া হয় না। সরাসরি রাজশাহীর বাগান থেকে অক্ষত অবস্থায় সরবরাহ করা হয়।
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-2xl mb-4 shadow-xs">
                🏺
              </div>
              <h3 className="font-extrabold text-base text-stone-900 mb-2">
                ঐতিহ্যবাহী খাঁটি খেজুরের গুড় (Pure Khejur Gur)
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                কোনো প্রকার চিনি, হাইড্রোজ বা কৃত্রিম ফ্লেভার ছাড়া খাঁটি খেজুরের রস জ্বাল দিয়ে তৈরি পাটালি ও ঝোলা গুড়। শীতকালীন আসল ঐতিহ্যবাহী পিঠাপুলির স্বাদ ফিরিয়ে দেয়।
              </p>
            </div>
          </div>

          {/* Interactive FAQ Accordion (Extracted by Google AI & Gemini Overviews) */}
          <div className="border-t border-stone-200 pt-8">
            <h3 className="text-lg font-black text-stone-900 text-center mb-6 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-700" />
              <span>সচরাচর জিজ্ঞাসা (Frequently Asked Questions)</span>
            </h3>

            <div className="space-y-3 max-w-3xl mx-auto">
              {[
                {
                  q: "খাঁটি মধু চেনার উপায় কি এবং খাঁটি বাড়ি-এর মধু কোথা থেকে সংগ্রহ করা হয়?",
                  a: "খাঁটি মধু পানিতে দিলে সঙ্গে সঙ্গে গলে যায় না, বরং সুতার মতো নিচে গিয়ে জমাট বাঁধে। খাঁটি বাড়ি কোনো কৃত্রিম বা চাষের মধু দেয় না; প্রাকৃতিকভাবে বুনো মৌমাছিদের তৈরি গ্রাম-বাংলার আসল প্রাকৃতিক মৌচাক থেকে বিশ্বস্ত মৌয়ালদের সহায়তায় খাঁটি ও অপরিশোধিত চাকের মধু সংগ্রহ করে, যাতে কোনো ধরনের কৃত্রিম মিষ্টি, হিটিং বা প্রিজারভেটিভ থাকে না।",
                },
                {
                  q: "রাজশাহীর আম কীভাবে অক্ষত ও ফরমালিনমুক্ত ডেলিভারি করা হয়?",
                  a: "আমরা গাছ থেকে আম পাড়ার পর কোনো প্রকার কার্বাইড বা কেমিক্যাল ব্যবহার করি না। প্রতিটি আম সাবধানে বাছাই করে ফোম ও ক্যারেটে প্যাকিং করে সরাসরি কুরিয়ারের মাধ্যমে পাঠানো হয়, যাতে গ্রাহক ঘরে বসেই বাগানের আসল স্বাদ পান।",
                },
                {
                  q: "খেজুরের গুড়ে কি চিনি বা কেমিক্যাল মেশানো থাকে?",
                  a: "একদমই না। খাঁটি বাড়ির খেজুরের গুড় ও পাটালি গুড় সম্পূর্ণ চিনি ও ক্ষতিকর রঙ মুক্ত। অভিজ্ঞ গাছিরা সনাতন পদ্ধতিতে গাছ থেকে রস সংগ্রহ করে চুলোয় জ্বাল দিয়ে আসল গুড় তৈরি করেন।",
                },
                {
                  q: "অর্ডার করার নিয়ম এবং ডেলিভারি চার্জ কত?",
                  a: "পণ্য নির্বাচন করে কার্টে যুক্ত করে চেকআউট করুন। রাজশাহী সিটিতে ডেলিভারি চার্জ মাত্র ৳৬০, ঢাকা সিটিতে ৳১০০ এবং সারা বাংলাদেশে ৳১৫০। পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ (ক্যাশ অন ডেলিভারি) করতে পারবেন।",
                },
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-stone-200 rounded-2xl overflow-hidden transition-all bg-stone-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 font-bold text-sm text-stone-900 hover:text-emerald-900 transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{faq.q}</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 bg-white">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ==================== CART DRAWER ==================== */}
      {isCartOpen && (
        <div
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md h-full p-4 sm:p-6 flex flex-col justify-between overflow-y-auto shadow-2xl border-l border-stone-200"
          >
            <div>
              {/* Cart Drawer Header */}
              <div className="flex justify-between items-center border-b border-stone-100 pb-3 sm:pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-800" />
                  <h3 className="font-extrabold text-lg sm:text-xl text-stone-900">অর্ডার ও চেকআউট</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  aria-label="Close cart"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Items List */}
              {cart.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-stone-600">কার্ট খালি রয়েছে</p>
                  <p className="text-xs text-stone-400 mt-1">দয়া করে স্টোর থেকে পণ্য যোগ করুন।</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 my-3 sm:my-4 max-h-[36vh] sm:max-h-[42vh] overflow-y-auto pr-1 space-y-1">
                  {cart.map((c) => (
                    <div key={c.cartKey} className="py-3 space-y-2">
                      <div className="flex justify-between items-start gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 flex items-center justify-center relative">
                            {c.image ? (
                              <Image
                                src={c.image}
                                alt={c.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-xl">{c.icon || "🍯"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">{c.name}</div>
                            <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                              একক মূল্য: <span className="font-bold text-emerald-900">৳{c.price}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(c.cartKey)}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="কার্ট থেকে মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Responsive Size Selector & Quantity Counter */}
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 space-y-2">
                        {/* Row 1: Size dropdown & Item Subtotal */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <label className="text-[11px] font-bold text-stone-600 whitespace-nowrap">সাইজ:</label>
                            <select
                              value={c.unit}
                              onChange={(e) => changeCartItemVariant(c.cartKey, e.target.value)}
                              className="bg-white border border-stone-300 text-emerald-950 text-xs font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-700 focus:outline-none shadow-sm cursor-pointer w-full max-w-[170px] truncate"
                            >
                              {c.variants.map((v) => (
                                <option key={v.unit} value={v.unit}>
                                  {v.unit} — ৳{v.price}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Line Total (Never truncated) */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] text-stone-400 block font-normal leading-tight">মোট</span>
                            <span className="text-sm font-black text-emerald-950 font-mono leading-tight whitespace-nowrap">
                              ৳{c.price * c.qty}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Quantity Stepper */}
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-200/60 text-xs">
                          <span className="text-[11px] text-stone-500 font-medium">পরিমাণ পরিবর্তন:</span>
                          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shadow-sm">
                            <button
                              type="button"
                              onClick={() => updateQty(c.cartKey, -1)}
                              className="w-6 h-6 bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700 transition active:scale-95 text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-black text-stone-900">{c.qty} টি</span>
                            <button
                              type="button"
                              onClick={() => updateQty(c.cartKey, 1)}
                              className="w-6 h-6 bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700 transition active:scale-95 text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="space-y-3.5 border-t border-stone-200 pt-4 pb-8 sm:pb-4 text-sm">
                {/* Saved Info Banner (If Returning Customer) */}
                {savedInfoLoaded && (
                  <div className="bg-emerald-50 border border-emerald-300/80 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 font-black" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-emerald-950 block">আপনার পূর্ববর্তী তথ্য লোড হয়েছে</span>
                        <span className="text-[10px] text-emerald-800">সরাসরি অর্ডার কনফার্ম করতে পারবেন</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustName("");
                        setCustPhone("");
                        setCustAddress("");
                        setSavedInfoLoaded(false);
                        try { localStorage.removeItem("khati_customer_info"); } catch {}
                      }}
                      className="text-[11px] font-bold text-stone-500 hover:text-rose-600 underline whitespace-nowrap cursor-pointer"
                    >
                      নতুন তথ্য দিন
                    </button>
                  </div>
                )}

                {/* 1. Customer Name */}
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    আপনার পুরো নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    required
                    autoComplete="name"
                    placeholder="যেমন: মোঃ আব্দুল্লাহ"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none transition shadow-xs"
                  />
                </div>

                {/* 2. Customer Phone */}
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    pattern="01[3-9][0-9]{8}"
                    maxLength={11}
                    placeholder="১১ ডিজিট (যেমন: 017XXXXXXXX)"
                    value={custPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 11) setCustPhone(val);
                    }}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none transition shadow-xs"
                  />
                  <span className="text-[10px] text-stone-400 pl-1 mt-0.5 block">
                    সঠিক ১১ ডিজিটের সচল মোবাইল নম্বর দিন (অর্ডার কনফার্মেশনের জন্য)
                  </span>
                </div>

                {/* 3. Delivery Address */}
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    সম্পূর্ণ ডেলিভারি ঠিকানা (জেলা ও থানা সহ) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    autoComplete="street-address"
                    placeholder="যেমন: হাউজ ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা (অথবা গ্রাম, ডাকঘর, থানা ও জেলা)"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:bg-white focus:outline-none transition shadow-xs"
                  />
                </div>

                {/* Optional Note Toggle */}
                <div>
                  {!showSpecialNote && !custNote ? (
                    <button
                      type="button"
                      onClick={() => setShowSpecialNote(true)}
                      className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ বিশেষ কোনো নির্দেশনা বা বিকল্প নম্বর আছে?</span>
                    </button>
                  ) : (
                    <div className="animate-fadeIn">
                      <input
                        placeholder="বিকল্প ফোন নম্বর বা ডেলিভারির বিশেষ নির্দেশনা (ঐচ্ছিক)"
                        value={custNote}
                        onChange={(e) => setCustNote(e.target.value)}
                        className="w-full border border-stone-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-stone-50"
                      />
                    </div>
                  )}
                </div>

                {/* Destination Area with Live Delivery Charges on Buttons */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-stone-800 block">
                      ডেলিভারি গন্তব্য এলাকা
                    </label>
                    <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      নাটোর হাব থেকে প্রেরিত
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "DHAKA" as DeliveryAreaKey, label: "ঢাকা সিটি", icon: "🏢" },
                      { key: "OUTSIDE" as DeliveryAreaKey, label: "ঢাকার বাইরে", icon: "🗺️" },
                      { key: "LOCAL" as DeliveryAreaKey, label: "নাটোর লোকাল", icon: "📍" },
                    ].map((area) => {
                      const isSel = deliveryArea === area.key;
                      const charge = calculateCourierCharge(selectedCourier, area.key, effectiveCartWeightKg).charge;
                      return (
                        <button
                          key={area.key}
                          type="button"
                          onClick={() => setDeliveryArea(area.key)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSel
                              ? "border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30 font-bold shadow-xs"
                              : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
                          }`}
                        >
                          <span className="block text-[11px] leading-tight">{area.icon} {area.label}</span>
                          <span className={`block text-xs font-black mt-0.5 ${isSel ? "text-emerald-900" : "text-stone-600 font-medium"}`}>
                            ৳{charge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Smart Pre-selected Courier Card with Quick Expand Toggle */}
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚚</span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900">
                            {COURIER_SERVICES[selectedCourier].banglaName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              COURIER_SERVICES[selectedCourier].shortDeliveryType === "হোম ডেলিভারি"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {COURIER_SERVICES[selectedCourier].shortDeliveryType}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                          {currentCourierCalculation.explanation}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCourierPicker(!showCourierPicker)}
                      className="text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-xl transition cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      {showCourierPicker ? "লুকান ▴" : "পরিবর্তন ▾"}
                    </button>
                  </div>

                  {/* Collapsible Courier Selector if Customer wants a specific courier */}
                  {showCourierPicker && (
                    <div className="pt-2 border-t border-stone-200/80 space-y-2 animate-fadeIn">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-stone-700">অন্যান্য কুরিয়ার সার্ভিস:</span>
                        <button
                          type="button"
                          onClick={() => setIsCourierModalOpen(true)}
                          className="text-emerald-700 hover:underline font-bold text-[10px] flex items-center gap-1"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>তুলনা দেখুন</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {enabledCouriersList.map((cid) => {
                          const srv = COURIER_SERVICES[cid];
                          const calc = calculateCourierCharge(cid, deliveryArea, effectiveCartWeightKg);
                          const isSel = selectedCourier === cid;
                          return (
                            <button
                              key={cid}
                              type="button"
                              onClick={() => {
                                setSelectedCourier(cid);
                                setManualCourierOverride(true);
                              }}
                              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                isSel
                                  ? "border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30 font-bold"
                                  : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                              }`}
                            >
                              <div className="flex justify-between items-center text-xs">
                                <span className="truncate">{srv.banglaName}</span>
                                <span className="font-mono font-bold">৳{calc.charge}</span>
                              </div>
                              <span className="text-[10px] text-stone-400 block">{srv.shortDeliveryType} • {srv.duration}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method (COD Pre-selected) */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💵</span>
                    <div>
                      <span className="font-bold text-amber-950 block">ক্যাশ অন ডেলিভারি (COD)</span>
                      <span className="text-[10px] text-stone-500">পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPaymentPicker(!showPaymentPicker)}
                    className="text-[11px] font-bold text-stone-600 hover:text-emerald-800 underline cursor-pointer whitespace-nowrap"
                  >
                    {showPaymentPicker ? "লুকান" : "বিকাশ/নগদ?"}
                  </button>
                </div>

                {showPaymentPicker && (
                  <div className="grid grid-cols-3 gap-2 pt-1 animate-fadeIn">
                    {[
                      { key: "ক্যাশ অন ডেলিভারি (COD)", label: "ক্যাশ অন ডেলিভারি" },
                      { key: "বিকাশ (bKash)", label: "বিকাশ" },
                      { key: "নগদ (Nagad)", label: "নগদ" },
                    ].map((pm) => {
                      const isSel = paymentMethod === pm.key;
                      return (
                        <button
                          key={pm.key}
                          type="button"
                          onClick={() => setPaymentMethod(pm.key)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSel
                              ? "border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30 font-bold"
                              : "border-stone-200 bg-white hover:bg-stone-50 text-stone-600"
                          }`}
                        >
                          <span className="block text-[11px] leading-tight">{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="bg-amber-50/90 p-3 rounded-2xl border border-amber-200/90 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>পণ্যের মোট মূল্য:</span>
                    <span>৳{subTotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>ডেলিভারি চার্জ ({COURIER_SERVICES[selectedCourier].banglaName}):</span>
                    <span className="font-semibold text-emerald-900">৳{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-emerald-950 border-t border-amber-200/60 pt-1.5">
                    <span>সর্বমোট প্রদেয় বিল:</span>
                    <span className="text-amber-900 font-mono text-base font-black">৳{grandTotal}</span>
                  </div>
                </div>

                {/* Submit & 1-Click WhatsApp Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 active:scale-95 text-white font-black py-3.5 sm:py-4 rounded-2xl transition shadow-xl shadow-emerald-950/20 disabled:bg-emerald-700/60 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-amber-300" />
                    <span>{loading ? "অর্ডার সাবমিট হচ্ছে..." : `অর্ডার নিশ্চিত করুন (৳${grandTotal})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-95 text-emerald-800 font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                    <span>WhatsApp-এ সরাসরি অর্ডার দিন (১ ক্লিকে)</span>
                  </button>

                  {/* Trust Assurances */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] text-stone-500 font-medium pt-1">
                    <span>🛡️ কোনো অগ্রিম টাকা নেই</span>
                    <span>•</span>
                    <span>📦 দেখে মূল্য পরিশোধ</span>
                    <span>•</span>
                    <span>⚡ দ্রুত ডেলিভারি</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================== FLOATING BOTTOM QUICK CHECKOUT BAR (MOBILE & DESKTOP) ==================== */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 animate-fadeIn">
          <div className="bg-emerald-950/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700/80 flex items-center justify-between gap-3 max-w-lg mx-auto sm:max-w-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-amber-300" />
                <span className="absolute -top-2 -right-2.5 bg-amber-400 text-emerald-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-stone-300 block">পণ্য + ডেলিভারি</span>
                <span className="text-sm font-black text-amber-300 font-mono">৳{grandTotal > 0 ? grandTotal : subTotal}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 active:scale-95 text-emerald-950 font-black px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-950" />
              <span>অর্ডার সম্পন্ন করুন</span>
              <span className="text-base font-bold">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Scroll to Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          className="fixed bottom-20 right-6 z-30 w-10 h-10 rounded-full bg-white/90 text-stone-700 hover:text-emerald-900 hover:bg-white shadow-lg border border-stone-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* ==================== INTERACTIVE COURIER RATE CALCULATOR MODAL ==================== */}
      {isCourierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-stone-900 text-white flex justify-between items-start gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    নাটোর ডিসপ্যাচ হাব
                  </span>
                  <span className="text-emerald-200 text-xs font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    প্রেরক: নাটোর, রাজশাহী বিভাগ
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>কুরিয়ার চার্জ ক্যালকুলেটর ও তুলনামূলক তালিকা</span>
                </h3>
                <p className="text-xs text-stone-300">
                  পাঠাও • স্টেডফাস্ট • সুন্দরবন • এস এ পরিবহন — পণ্যের সাইজ অনুযায়ী চার্জের সহজ তুলনা
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(false)}
                className="text-stone-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
              {/* 1. Destination Selector */}
              <div>
                <label className="text-xs sm:text-sm font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>১. আপনার ডেলিভারি গন্তব্য নির্বাচন করুন:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(["LOCAL", "DHAKA", "OUTSIDE"] as DeliveryAreaKey[]).map((areaKey) => {
                    const isSel = modalArea === areaKey;
                    const areaInfo = DELIVERY_AREAS[areaKey];
                    return (
                      <button
                        key={areaKey}
                        type="button"
                        onClick={() => setModalArea(areaKey)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? "border-emerald-700 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/30 shadow-sm"
                            : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm">{areaInfo.name}</span>
                          {isSel && <Check className="w-4 h-4 text-emerald-700 font-bold" />}
                        </div>
                        <span className="text-[11px] text-stone-500 block mt-0.5 leading-tight">
                          {areaInfo.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Product Size Presets & Custom Weight */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 mb-2">
                  <label className="text-xs sm:text-sm font-bold text-stone-700 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    <span>২. পণ্যের সাইজ / ওজন নির্বাচন করুন:</span>
                  </label>
                  <span className="text-xs text-emerald-800 font-black bg-emerald-100 px-2.5 py-0.5 rounded-full w-fit">
                    বর্তমান নির্বাচিত ওজন: {modalWeight.toFixed(1)} কেজি
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {POPULAR_PRODUCT_PRESETS.map((preset, idx) => {
                    const isSel = Math.abs(modalWeight - preset.weightKg) < 0.05 && !modalCustomWeight;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setModalWeight(preset.weightKg);
                          setModalCustomWeight("");
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? "border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/40 shadow-xs font-bold"
                            : "border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-700 font-medium"
                        }`}
                      >
                        <span className="block text-xs font-bold leading-tight">{preset.label}</span>
                        <span className="block text-[10px] text-stone-500 mt-0.5">{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Weight Input Option */}
                <div className="mt-3 flex items-center gap-2 max-w-sm">
                  <span className="text-xs font-semibold text-stone-600 whitespace-nowrap">অন্য কোনো ওজন:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      placeholder="যেমন: ৩.৫"
                      value={modalCustomWeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalCustomWeight(val);
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 0) {
                          setModalWeight(num);
                        }
                      }}
                      className="w-full border border-stone-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-semibold pointer-events-none">
                      কেজি
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Live 4-Courier Comparison Result Cards */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>কুরিয়ার সার্ভিসের তুলনামূলক চার্জ তালিকা ({modalWeight.toFixed(1)} কেজি ওজনে):</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {compareAllCouriers(modalArea, modalWeight, enabledCouriersList).map((res) => {
                    const isLowest = res.isLowestPrice;
                    const isHome = res.courier.shortDeliveryType === "হোম ডেলিভারি";

                    return (
                      <div
                        key={res.courier.id}
                        className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all relative ${
                          isLowest
                            ? "border-amber-400 bg-amber-50/70 shadow-md ring-1 ring-amber-400/50"
                            : "border-stone-200 bg-white hover:border-stone-300 shadow-xs"
                        }`}
                      >
                        {isLowest && (
                          <div className="absolute -top-2.5 right-3 bg-amber-500 text-emerald-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            সবচেয়ে সাশ্রয়ী
                          </div>
                        )}

                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div>
                              <h5 className="font-black text-stone-900 text-sm leading-tight">
                                {res.courier.banglaName}
                              </h5>
                              <span className="text-[10px] text-stone-400 block">{res.courier.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mb-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isHome
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {res.courier.shortDeliveryType}
                            </span>
                            <span className="text-[10px] text-stone-500">⏱️ {res.courier.duration}</span>
                          </div>

                          {/* Price Tag */}
                          <div className="my-2 p-2 bg-stone-50 rounded-xl border border-stone-200/80 text-center">
                            <span className="text-[10px] text-stone-500 block">মোট চার্জ</span>
                            <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
                              ৳{res.charge}
                            </span>
                          </div>

                          <p className="text-[10px] text-stone-600 leading-tight mb-2">
                            {res.explanation}
                          </p>

                          <div className="text-[10px] text-emerald-900 bg-emerald-50/80 p-2 rounded-xl mb-3 border border-emerald-200/50">
                            <span className="font-bold">উপযুক্ত:</span> {res.courier.bestFor}
                          </div>
                        </div>

                        {/* Order with this courier CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourier(res.courier.id);
                            setDeliveryArea(modalArea);
                            setIsCourierModalOpen(false);
                            setIsCartOpen(true);
                            addToast(
                              "success",
                              `পছন্দের কুরিয়ার হিসেবে "${res.courier.banglaName}" সিলেক্ট করা হয়েছে।`
                            );
                          }}
                          className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-black py-2 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        >
                          <span>এই কুরিয়ারে অর্ডার করুন</span>
                          <span className="text-sm">→</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Practical Courier Guidelines & Tips */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5 text-xs">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>নাটোর থেকে পার্সেল প্রেরণের গুরুত্বপূর্ণ পরামর্শ:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-stone-600">
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-950 flex items-center gap-1">
                      🍯 মধু ও গুড়ের জন্য (১-৩ কেজি):
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      মধু ও গুড়ের ছোট পার্সেল সরাসরি বাসায় পেতে <span className="font-bold text-stone-800">Steadfast Courier</span> বা <span className="font-bold text-stone-800">Pathao</span> বেছে নিন। তারা আপনার দেওয়া ঠিকানায় পৌঁছে দিয়ে ক্যাশ অন ডেলিভারিতে টাকা গ্রহণ করবে।
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-amber-950 flex items-center gap-1">
                      🥭 আম ও ভারী ফলের জন্য (৫-২০ কেজি):
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      আমের ক্যারেট বা কার্টুনে <span className="font-bold text-amber-900">সুন্দরবন কুরিয়ার</span> বা <span className="font-bold text-sky-900">এস এ পরিবহন</span> শাখা ডেলিভারি নিলে কুরিয়ার খরচ অর্ধেকেরও কম হয়। যেমন ১০ কেজি আমে সুন্দরবনে মাত্র ৳১৫০ খরচ, যেখানে হোম ডেলিভারিতে ৳৩০০+ খরচ হতো!
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
                  <span>📍 সকল পণ্য নাটোর থেকে সরাসরি পাঠানো হয়।</span>
                  <span>🛡️ খাঁটি পণ্য ও নিরাপদ প্যাকেজিংয়ের নিশ্চয়তা।</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-stone-100 border-t border-stone-200 flex justify-between items-center gap-3">
              <span className="text-xs text-stone-600 font-medium hidden sm:inline">
                প্রয়োজনে যেকোনো তথ্যের জন্য WhatsApp-এ মেসেজ দিন
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCourierModalOpen(false)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCourierModalOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  কার্টে গিয়ে অর্ডার করুন →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 mt-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-stone-200 text-sm">{tenant.name}</p>
            <p className="mt-1">প্রাকৃতিক ও খাঁটি উপাদানের বিশ্বস্ত ঠিকানা।</p>
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <span>© {new Date().getFullYear()} {tenant.name}। সর্বস্বত্ব সংরক্ষিত।</span>
            <span>•</span>
            <a
              href={`/${tenant.slug}/admin`}
              className="text-stone-500 hover:text-amber-400 transition flex items-center gap-1 font-medium"
            >
              🔒 অ্যাডমিন প্রবেশ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
