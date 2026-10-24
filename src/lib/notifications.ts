// src/lib/notifications.ts

interface OrderNotificationData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryArea: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  items: {
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

/**
 * Format order details into a clean markdown message for Telegram & Admin alerts
 */
export function formatOrderMessage(order: OrderNotificationData): string {
  const subTotal = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  
  const itemsList = order.items
    .map(
      (item) =>
        `▫️ *${item.productName}* (${item.unit})\n   ↳ পরিমাণ: ${item.quantity} টি × ৳${item.unitPrice} = *৳${item.quantity * item.unitPrice}*`
    )
    .join("\n\n");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://khatibari.vercel.app";

  return `🔔 *নতুন অর্ডার এসেছে!* (#${order.orderNumber})
━━━━━━━━━━━━━━━━━━
👤 *কাস্টমার:* ${order.customerName}
📞 *মোবাইল:* \`${order.customerPhone}\`
📍 *ঠিকানা:* ${order.shippingAddress}
🚚 *গন্তব্য:* ${order.deliveryArea}
💳 *পেমেন্ট:* ${order.paymentMethod}

📦 *অর্ডারকৃত পণ্যসমূহ:*
${itemsList}

━━━━━━━━━━━━━━━━━━
💰 *পণ্যের মূল্য:* ৳${subTotal}
🛵 *ডেলিভারি চার্জ:* ৳${order.deliveryCharge}
💵 *সর্বমোট প্রদেয় বিল:* *৳${order.totalAmount}*
${order.notes ? `\n📝 *বিশেষ নোট:* ${order.notes}` : ""}
━━━━━━━━━━━━━━━━━━
🔗 *অ্যাডমিন প্যানেল:* ${appUrl}/admin`;
}

/**
 * Send notification to Telegram (supports single or multiple chat IDs / group)
 */
async function sendTelegramNotification(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsRaw = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatIdsRaw) {
    return false;
  }

  // Support multiple chat IDs separated by commas (e.g. "12345678, -100987654321")
  const chatIds = chatIdsRaw.split(",").map((id) => id.trim()).filter(Boolean);

  if (chatIds.length === 0) return false;

  let allSuccess = true;

  for (const chatId of chatIds) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        console.error(`[Telegram Error] Failed to send to ${chatId}:`, await response.text());
        allSuccess = false;
      }
    } catch (err) {
      console.error(`[Telegram Error] Exception sending to ${chatId}:`, err);
      allSuccess = false;
    }
  }

  return allSuccess;
}

/**
 * Optional WhatsApp Gateway notification (e.g., UltraMsg or custom webhook if configured)
 */
async function sendWhatsAppNotification(message: string): Promise<boolean> {
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const numbersRaw = process.env.WHATSAPP_NOTIFY_NUMBERS; // comma separated: "88017XXXXXXXX, 88018XXXXXXXX"

  if (!instanceId || !token || !numbersRaw) {
    return false;
  }

  const numbers = numbersRaw.split(",").map((n) => n.trim().replace("+", "")).filter(Boolean);

  for (const phone of numbers) {
    try {
      // Example for UltraMsg webhook/API:
      await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          to: phone,
          body: message,
        }),
      });
    } catch (err) {
      console.error(`[WhatsApp Error] Failed sending to ${phone}:`, err);
    }
  }

  return true;
}

/**
 * Main dispatcher to send order alerts across configured channels
 */
export async function dispatchOrderNotification(order: OrderNotificationData) {
  try {
    const formattedMessage = formatOrderMessage(order);

    // Run notifications asynchronously without blocking the user response
    await Promise.allSettled([
      sendTelegramNotification(formattedMessage),
      sendWhatsAppNotification(formattedMessage),
    ]);
  } catch (error) {
    console.error("[Notification Dispatch Error]:", error);
  }
}
