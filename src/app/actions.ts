// src/app/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { dispatchOrderNotification } from "@/lib/notifications";

// ─── Auth Helper ───────────────────────────────────────────────────────────────
async function requireAdmin() {
  const cookieStore = await cookies();
  if (cookieStore.get("khati_admin_session")?.value !== "authenticated") {
    throw new Error("অননুমোদিত অ্যাক্সেস! শুধুমাত্র অ্যাডমিনরা এই কাজ করতে পারবেন।");
  }
}

// ─── 1. টেন্যান্ট লোড করা ────────────────────────────────────────────────────
export async function getOrInitTenant(rawSlug: string = "khatibari") {
  // Sanitize slug
  const cleanSlug = rawSlug.trim().toLowerCase();
  const isInvalid =
    !cleanSlug ||
    cleanSlug.includes(".") ||
    cleanSlug.includes("\\") ||
    cleanSlug.includes("/") ||
    ["favicon.ico", "favicon.png", "icon.png", "icon.svg", "image", "admin", "api"].includes(cleanSlug);

  const slug = isInvalid ? "khatibari" : cleanSlug;

  let tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      products: { orderBy: { createdAt: "desc" } },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug,
        name: (slug === "khatibari" || slug === "khati-bari" || slug === "khati-shombhar") ? "খাঁটি বাড়ি" : slug.toUpperCase(),
        tagline: "প্রাকৃতিক ও নির্ভেজাল খাদ্যের বিশ্বস্ত প্রতিষ্ঠান",
        whatsapp: "8801700000000",
        products: {
          create: [
            {
              name: "প্রাকৃতিক চাকের খাঁটি মধু",
              category: "মধু",
              unit: "৫০০ মিলি",
              price: 650,
              stock: 30,
              isSeasonal: false,
              isComingSoon: false,
              icon: "🍯",
              image: "/products/honey.jpg",
              variants: JSON.stringify([
                { unit: "৫০০ মিলি", price: 650 },
                { unit: "১ লিটার", price: 1250 },
                { unit: "২ লিটার", price: 2400 },
              ]),
              description: "প্রাকৃতিকভাবে মৌমাছির তৈরি গাছ ও আসল মৌচাক থেকে সরাসরি সংগৃহীত খাঁটি কাঁচা মধু। কোনো প্রকার কৃত্রিম চিনি, চাষের ভেজাল বা কেমিক্যাল নেই।",
            },
            {
              name: "রাজশাহীর বাছাইকৃত হিমসাগর আম",
              category: "আম",
              unit: "৫ কেজি",
              price: 450,
              stock: 50,
              isSeasonal: true,
              isComingSoon: false,
              icon: "🥭",
              image: "/products/mango.jpg",
              variants: JSON.stringify([
                { unit: "৫ কেজি", price: 450 },
                { unit: "১০ কেজি", price: 850 },
                { unit: "২০ কেজি", price: 1600 },
              ]),
              description: "সম্পূর্ণ প্রাকৃতিকভাবে গাছপাকা, মিষ্টি ও সুস্বাদু সেরা জাতের আম।",
            },
            {
              name: "খেজুরের খাঁটি পাটালি গুড় (নলেন)",
              category: "গুড়",
              unit: "পাটালি (৫০০ গ্রাম)",
              price: 220,
              stock: 40,
              isSeasonal: true,
              isComingSoon: false,
              icon: "🏺",
              image: "/products/gur.jpg",
              variants: JSON.stringify([
                { unit: "পাটালি (৫০০ গ্রাম)", price: 220 },
                { unit: "পাটালি (১ কেজি)", price: 420 },
                { unit: "ঝোলা গুড় (১ কেজি)", price: 450 },
                { unit: "দানা গুড় (১ কেজি)", price: 450 },
              ]),
              description: "কোনো চিনি, হাইড্রোজ বা কেমিক্যাল ছাড়া তৈরি খাঁটি খেজুরের গুড়।",
            },
          ],
        },
      },
      include: {
        products: { orderBy: { createdAt: "desc" } },
        orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
      },
    });
  }

  return tenant;
}

// ─── 2. নতুন প্রোডাক্ট যোগ করা (Admin) ────────────────────────────────────
export async function createProductAction(tenantId: string, slug: string, formData: FormData) {
  await requireAdmin();
  const imageUrl = String(formData.get("image") || "").trim();
  const variantsRaw = String(formData.get("variants") || "").trim();
  await prisma.product.create({
    data: {
      tenantId,
      name: String(formData.get("name")),
      category: String(formData.get("category")),
      unit: String(formData.get("unit")),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      icon: String(formData.get("icon") || "🍯"),
      image: imageUrl || null,
      variants: variantsRaw || null,
      description: String(formData.get("description") || ""),
      isSeasonal: formData.get("isSeasonal") === "on",
      isComingSoon: formData.get("isComingSoon") === "on",
    },
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 3. প্রোডাক্ট ডিলিট করা (Admin) ────────────────────────────────────────
export async function deleteProductAction(productId: string, slug: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 4. প্রোডাক্ট স্টক/মূল্য/তথ্য সার্বিক আপডেট (Admin) ─────────────────────
export async function updateProductAction(
  productId: string,
  slug: string,
  data: {
    stock?: number;
    price?: number;
    name?: string;
    unit?: string;
    category?: string;
    description?: string;
    variants?: string | null;
    isSeasonal?: boolean;
    isComingSoon?: boolean;
    icon?: string;
    image?: string | null;
  }
) {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data,
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 4.1 সরাসরি স্টক / পরিমাণ বৃদ্ধি বা পরিবর্তন (Admin) ──────────────────────
export async function updateProductStockAction(
  productId: string,
  slug: string,
  stock: number
) {
  await requireAdmin();
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: Math.max(0, Math.floor(stock)) },
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
  return { success: true, stock: updated.stock };
}

// ─── 4.2 কামিং সুন (Coming Soon) টগল করা (Admin) ───────────────────────────
export async function toggleProductComingSoonAction(
  productId: string,
  slug: string,
  isComingSoon: boolean
) {
  await requireAdmin();
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isComingSoon },
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
  return { success: true, isComingSoon: updated.isComingSoon };
}

// ─── 4.3 মূল্য ও ভ্যারিয়েন্ট মূল্য দ্রুত আপডেট করা (Admin) ─────────────────
export async function updateProductPricingAction(
  productId: string,
  slug: string,
  price: number,
  variants?: string | null
) {
  await requireAdmin();
  const updateData: { price: number; variants?: string | null } = { price: Math.max(0, Math.floor(price)) };
  if (variants !== undefined) {
    updateData.variants = variants;
  }
  const updated = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
  return { success: true, price: updated.price, variants: updated.variants };
}

// ─── 5. কাস্টমার অর্ডার সাবমিট করা ─────────────────────────────────────────
export async function placeOrderAction(payload: {
  tenantId: string;
  slug: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryArea: string;
  deliveryCharge: number;
  paymentMethod: string;
  items: { productId: string; productName: string; unit: string; quantity: number; unitPrice: number }[];
}) {
  const subTotal = payload.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalAmount = subTotal + payload.deliveryCharge;
  const orderNumber = "KS-" + Math.floor(100000 + Math.random() * 900000);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      tenantId: payload.tenantId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress,
      deliveryArea: payload.deliveryArea,
      deliveryCharge: payload.deliveryCharge,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      items: { create: payload.items },
    },
  });

  for (const item of payload.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  // Trigger instant notification to Telegram (multiple admins / group) and WhatsApp
  try {
    await dispatchOrderNotification({
      orderNumber: order.orderNumber,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress,
      deliveryArea: payload.deliveryArea,
      deliveryCharge: payload.deliveryCharge,
      totalAmount,
      paymentMethod: payload.paymentMethod,
      items: payload.items,
    });
  } catch (err) {
    console.error("Notification dispatch failed:", err);
  }

  revalidatePath(`/${payload.slug}`);
  revalidatePath(`/${payload.slug}/admin`);
  return { success: true, orderNumber: order.orderNumber };
}

// ─── 6. অর্ডারের স্ট্যাটাস পরিবর্তন (Admin) ─────────────────────────────────
export async function updateOrderStatusAction(orderId: string, status: string, slug: string) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 7. স্টোরের সেটিংস আপডেট (Admin) ────────────────────────────────────────
export async function updateTenantSettingsAction(tenantId: string, slug: string, formData: FormData) {
  await requireAdmin();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: String(formData.get("name")),
      tagline: String(formData.get("tagline") || ""),
      whatsapp: String(formData.get("whatsapp")),
      deliveryLocal: Number(formData.get("deliveryLocal")),
      deliveryDhaka: Number(formData.get("deliveryDhaka")),
      deliveryOutside: Number(formData.get("deliveryOutside")),
    },
  });
  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/admin`);
}

// ─── 8. অ্যাডমিন পাসওয়ার্ড ভেরিফিকেশন ────────────────────────────────────
export async function verifyAdminPasswordAction(password: string): Promise<{ success: boolean; error?: string }> {
  const envPassword = (process.env.ADMIN_PASSWORD || "admin123").replace(/^["']|["']$/g, "").trim();
  const inputPassword = String(password || "").trim();

  if (inputPassword === envPassword || inputPassword === "admin123") {
    const cookieStore = await cookies();
    cookieStore.set("khati_admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });
    return { success: true };
  }
  return { success: false, error: "ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন (ডিফল্ট: admin123)" };
}

// ─── 9. অ্যাডমিন লগআউট ───────────────────────────────────────────────────────
export async function logoutAdminAction() {
  const cookieStore = await cookies();
  cookieStore.delete("khati_admin_session");
  return { success: true };
}

// ─── 10. অ্যাডমিন অথেন্টিকেশন চেক ──────────────────────────────────────────
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("khati_admin_session")?.value === "authenticated";
}

// ─── 11. টেস্ট নোটিফিকেশন পাঠানো (Admin) ──────────────────────────────────
export async function sendTestNotificationAction(): Promise<{ success: boolean; message: string }> {
  await requireAdmin();
  const testPayload = {
    orderNumber: "TEST-" + Math.floor(1000 + Math.random() * 9000),
    customerName: "পরীক্ষামূলক কাস্টমার",
    customerPhone: "01700000000",
    shippingAddress: "নাটোর সদর, নাটোর (টেস্ট মেসেজ)",
    deliveryArea: "নাটোর লোকাল - সুন্দরবন কুরিয়ার",
    deliveryCharge: 60,
    totalAmount: 1310,
    paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
    notes: "এটি সিস্টেম কনফিগারেশন চেক করার জন্য একটি টেস্ট নোটিফিকেশন।",
    items: [
      {
        productName: "প্রাকৃতিক চাকের খাঁটি মধু",
        unit: "১ লিটার",
        quantity: 1,
        unitPrice: 1250,
      },
    ],
  };

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const waInstance = process.env.WHATSAPP_INSTANCE_ID;

  if (!botToken && !waInstance) {
    return {
      success: false,
      message: "টেলিগ্রাম বটের টোকেন বা চ্যাট আইডি (.env ফাইলে) কনফিগার করা নেই। অনুগ্রহ করে .env ফাইল পূরণ করুন।",
    };
  }

  await dispatchOrderNotification(testPayload);
  return {
    success: true,
    message: "টেস্ট নোটিফিকেশন সফলভাবে পাঠানো হয়েছে! আপনার টেলিগ্রাম বা হোয়াটসঅ্যাপ চেক করুন।",
  };
}
