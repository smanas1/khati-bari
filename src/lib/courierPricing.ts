// src/lib/courierPricing.ts
/**
 * নাটোর (Natore) থেকে সারা দেশে পণ্য পাঠানোর কুরিয়ার চার্জ ক্যালকুলেটর ও তথ্য
 * 
 * কুরিয়ারসমূহ:
 * ১. Street Fast (Steadfast) Courier (হোম ডেলিভারি)
 * ২. Pathao Courier (হোম ডেলিভারি)
 * ৩. Sundarban Courier Service (কাউন্টার / শাখা ডেলিভারি - আম ও ভারী পার্সেলের জন্য সবচেয়ে সাশ্রয়ী)
 * ৪. SA Paribahan (কাউন্টার / শাখা ডেলিভারি - দ্রুততম শাখা পার্সেল)
 */

export type CourierId = "steadfast" | "pathao" | "sundarban" | "sa_paribahan";
export type DeliveryAreaKey = "LOCAL" | "DHAKA" | "OUTSIDE";

export const ALL_COURIER_IDS: CourierId[] = ["steadfast", "pathao", "sundarban", "sa_paribahan"];

export function parseEnabledCouriers(enabledStr?: string | null): CourierId[] {
  if (!enabledStr || typeof enabledStr !== "string") {
    return [...ALL_COURIER_IDS];
  }
  const parts = enabledStr
    .split(",")
    .map((s) => s.trim().toLowerCase()) as CourierId[];
  const valid = parts.filter((id): id is CourierId => ALL_COURIER_IDS.includes(id));
  return valid.length > 0 ? valid : ["steadfast"];
}

export interface CourierServiceInfo {
  id: CourierId;
  name: string;
  banglaName: string;
  deliveryType: "হোম ডেলিভারি (Home Delivery)" | "কাউন্টার / শাখা ডেলিভারি (Branch Pickup)";
  shortDeliveryType: "হোম ডেলিভারি" | "কাউন্টার ডেলিভারি";
  badge: string;
  badgeColor: string;
  duration: string;
  description: string;
  bestFor: string;
}

export const COURIER_SERVICES: Record<CourierId, CourierServiceInfo> = {
  steadfast: {
    id: "steadfast",
    name: "Street Fast Courier",
    banglaName: "স্ট্রিট ফাস্ট কুরিয়ার",
    deliveryType: "হোম ডেলিভারি (Home Delivery)",
    shortDeliveryType: "হোম ডেলিভারি",
    badge: "জনপ্রিয় ও দ্রুততম",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    duration: "২-৩ দিন",
    description: "বাসায় বসে ক্যাশ অন ডেলিভারিতে দ্রুত পার্সেল পাওয়ার জন্য সবচেয়ে সুবিধাজনক।",
    bestFor: "মধু ও গুড় (১-৩ কেজি হোম ডেলিভারি)",
  },
  pathao: {
    id: "pathao",
    name: "Pathao Courier",
    banglaName: "পাঠাও কুরিয়ার",
    deliveryType: "হোম ডেলিভারি (Home Delivery)",
    shortDeliveryType: "হোম ডেলিভারি",
    badge: "স্মার্ট ট্র্যাকিং ও দ্রুত",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    duration: "২-৩ দিন",
    description: "লাইভ ট্র্যাকিং ও নির্ভরযোগ্য ডোরস্টেপ হোম ডেলিভারি সেবা।",
    bestFor: "১-২ কেজি ছোট ও মাঝারি পার্সেল",
  },
  sundarban: {
    id: "sundarban",
    name: "Sundarban Courier Service",
    banglaName: "সুন্দরবন কুরিয়ার",
    deliveryType: "কাউন্টার / শাখা ডেলিভারি (Branch Pickup)",
    shortDeliveryType: "কাউন্টার ডেলিভারি",
    badge: "আম ও ভারী পণ্যে সেরা সাশ্রয়ী",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    duration: "২৪-৪৮ ঘণ্টা",
    description: "নিকটস্থ সুন্দরবন শাখা বা কাউন্টার থেকে পার্সেল সংগ্রহ। ভারী কার্টুনে খরচ অনেক কম!",
    bestFor: "৫-২০ কেজি আম ও ভারী পার্সেল (অর্ধেক খরচ!)",
  },
  sa_paribahan: {
    id: "sa_paribahan",
    name: "SA Paribahan Courier",
    banglaName: "এস এ পরিবহন",
    deliveryType: "কাউন্টার / শাখা ডেলিভারি (Branch Pickup)",
    shortDeliveryType: "কাউন্টার ডেলিভারি",
    badge: "দ্রুততম শাখা ডেলিভারি",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    duration: "২৪ ঘণ্টা",
    description: "এস এ পরিবহন কাউন্টার থেকে সংগ্রহ। দ্রুত পৌঁছায় বিধায় পচনশীল ফলের জন্য আদর্শ।",
    bestFor: "কাউন্টার থেকে দ্রুত ফ্রেশ আম ও ফল সংগ্রহ",
  },
};

export const DELIVERY_AREAS: Record<DeliveryAreaKey, { name: string; subtitle: string }> = {
  LOCAL: {
    name: "নাটোর সদর / লোকাল",
    subtitle: "নাটোর জেলা ও আশেপাশের নিকটবর্তী এলাকা",
  },
  DHAKA: {
    name: "ঢাকা সিটি কর্পোরেশন",
    subtitle: "উত্তর ও দক্ষিণ ঢাকার সকল মেট্রো এলাকা",
  },
  OUTSIDE: {
    name: "সারা বাংলাদেশ (অন্যান্য জেলা)",
    subtitle: "চট্টগ্রাম, সিলেট, খুলনা, বরিশাল, রংপুরসহ দেশের সকল জেলা",
  },
};

/**
 * পার্সেলের ওজন অনুমান করা (পণ্য ও ইউনিট অনুযায়ী)
 */
export function estimateWeightKg(unit: string, name: string = ""): number {
  const text = `${name} ${unit}`.toLowerCase();

  // আম (Mango)
  if (text.includes("২০") && (text.includes("কেজি") || text.includes("kg"))) return 21.0;
  if (text.includes("১০") && (text.includes("কেজি") || text.includes("kg"))) return 10.8;
  if (text.includes("৫") && (text.includes("কেজি") || text.includes("kg"))) return 5.5;

  // সংখ্যা খোঁজা (English or Bengali digits)
  const bengaliToEnglishDigits: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  const normalized = text.replace(/[০-৯]/g, (d) => bengaliToEnglishDigits[d] || d);

  if (normalized.includes("20 kg") || normalized.includes("20kg") || normalized.includes("20 কেজি")) return 21.0;
  if (normalized.includes("10 kg") || normalized.includes("10kg") || normalized.includes("10 কেজি")) return 10.8;
  if (normalized.includes("5 kg") || normalized.includes("5kg") || normalized.includes("5 কেজি")) return 5.5;

  // মধু (Honey) & তরল
  if (normalized.includes("2 liter") || normalized.includes("2 l") || normalized.includes("2 লিটার")) return 2.7;
  if (normalized.includes("1 liter") || normalized.includes("1 l") || normalized.includes("1 লিটার") || normalized.includes("1000 ml")) return 1.4;
  if (normalized.includes("500 ml") || normalized.includes("500 মিলি") || normalized.includes("0.5 liter")) return 0.7;
  if (normalized.includes("250 ml") || normalized.includes("250 মিলি")) return 0.4;

  // গুড় (Gur)
  if (normalized.includes("1 kg") || normalized.includes("1kg") || normalized.includes("1 কেজি")) return 1.1;
  if (normalized.includes("2 kg") || normalized.includes("2kg") || normalized.includes("2 কেজি")) return 2.2;
  if (normalized.includes("500 g") || normalized.includes("500g") || normalized.includes("500 গ্রাম")) return 0.6;

  // সাধারণ ডিফল্ট
  return 1.0;
}

/**
 * নাটোর থেকে কুরিয়ার চার্জ গণনা ফাংশন
 */
export function calculateCourierCharge(
  courierId: CourierId,
  area: DeliveryAreaKey,
  weightKg: number
): {
  charge: number;
  weightUsed: number;
  explanation: string;
} {
  const safeWeight = Math.max(0.5, Math.ceil(weightKg * 10) / 10);

  let charge = 0;
  let explanation = "";

  switch (courierId) {
    case "steadfast": {
      // Steadfast Non-Dhaka (Natore Pickup)
      if (area === "LOCAL") {
        // Base 1kg: ৳70, extra +৳15/kg
        if (safeWeight <= 1.0) {
          charge = 70;
          explanation = "১ কেজি পর্যন্ত লোকাল চার্জ ৳৭০";
        } else {
          const extraKg = Math.ceil(safeWeight - 1.0);
          charge = 70 + extraKg * 15;
          explanation = `১ কেজি ৳৭০ + অতিরিক্ত ${extraKg} কেজি × ৳১৫ = ৳${charge}`;
        }
      } else if (area === "DHAKA") {
        // Natore to Dhaka Home Delivery: 1kg ৳120 (minimum ৳120), extra +৳20/kg
        if (safeWeight <= 1.0) {
          charge = 120;
          explanation = "১ কেজি পর্যন্ত ঢাকা হোম ডেলিভারি ৳১২০";
        } else {
          const extraKg = Math.ceil(safeWeight - 1.0);
          charge = 120 + extraKg * 20;
          explanation = `১ কেজি ৳১২০ + অতিরিক্ত ${extraKg} কেজি × ৳২০ = ৳${charge}`;
        }
      } else {
        // Natore to Outside Dhaka (District to District): 1kg ৳130 (minimum ৳120), extra +৳25/kg
        if (safeWeight <= 1.0) {
          charge = 130;
          explanation = "১ কেজি পর্যন্ত জেলা ডেলিভারি ৳১৩০";
        } else {
          const extraKg = Math.ceil(safeWeight - 1.0);
          charge = 130 + extraKg * 25;
          explanation = `১ কেজি ৳১৩০ + অতিরিক্ত ${extraKg} কেজি × ৳২৫ = ৳${charge}`;
        }
      }
      break;
    }

    case "pathao": {
      // Pathao Merchant Pickup: Outside Dhaka (Natore)
      if (area === "LOCAL") {
        if (safeWeight <= 0.5) {
          charge = 60;
          explanation = "০-৫০০ গ্রাম লোকাল ৳৬০";
        } else if (safeWeight <= 1.0) {
          charge = 70;
          explanation = "৫০০ গ্রাম - ১ কেজি লোকাল ৳৭০";
        } else if (safeWeight <= 2.0) {
          charge = 90;
          explanation = "১-২ কেজি লোকাল ৳৯০";
        } else {
          const extraKg = Math.ceil(safeWeight - 2.0);
          charge = 90 + extraKg * 20;
          explanation = `২ কেজি ৳৯০ + অতিরিক্ত ${extraKg} কেজি × ৳২০ = ৳${charge}`;
        }
      } else if (area === "DHAKA") {
        // OSD to ISD (Dhaka) - Minimum ৳120
        if (safeWeight <= 0.5) {
          charge = 120;
          explanation = "০-৫০০ গ্রাম ঢাকা ৳১২০";
        } else if (safeWeight <= 1.0) {
          charge = 130;
          explanation = "৫০০ গ্রাম - ১ কেজি ঢাকা ৳১৩০";
        } else if (safeWeight <= 2.0) {
          charge = 170;
          explanation = "১-২ কেজি ঢাকা ৳১৭০";
        } else {
          const extraKg = Math.ceil(safeWeight - 2.0);
          charge = 170 + extraKg * 25;
          explanation = `২ কেজি ৳১৭০ + অতিরিক্ত ${extraKg} কেজি × ৳২৫ = ৳${charge}`;
        }
      } else {
        // OSD to OSD (Outside Dhaka) - Minimum ৳120
        if (safeWeight <= 0.5) {
          charge = 125;
          explanation = "০-৫০০ গ্রাম সারা দেশ ৳১২৫";
        } else if (safeWeight <= 1.0) {
          charge = 145;
          explanation = "৫০০ গ্রাম - ১ কেজি সারা দেশ ৳১৪৫";
        } else if (safeWeight <= 2.0) {
          charge = 180;
          explanation = "১-২ কেজি সারা দেশ ৳১৮০";
        } else {
          const extraKg = Math.ceil(safeWeight - 2.0);
          charge = 180 + extraKg * 30;
          explanation = `২ কেজি ৳১৮০ + অতিরিক্ত ${extraKg} কেজি × ৳৩০ = ৳${charge}`;
        }
      }
      break;
    }

    case "sundarban": {
      // Sundarban Courier Branch / Counter delivery from Natore
      if (area === "LOCAL") {
        if (safeWeight <= 1.5) {
          charge = 70;
          explanation = "ছোট পার্সেল লোকাল শাখা ৳৭০";
        } else {
          charge = 70 + Math.ceil(safeWeight - 1.5) * 10;
          explanation = `লোকাল শাখা ডেলিভারি ৳${charge}`;
        }
      } else {
        // Counter pickup (Dhaka or Outside): Minimum ৳120
        if (safeWeight <= 1.5) {
          charge = 120;
          explanation = "১.৫ কেজি পর্যন্ত কাউন্টার ডেলিভারি ৳১২০";
        } else if (safeWeight <= 2.0) {
          charge = 140;
          explanation = "২ কেজি পার্সেল কাউন্টার ডেলিভারি ৳১৪০";
        } else if (safeWeight <= 3.5) {
          charge = 170;
          explanation = "৩.৫ কেজি পর্যন্ত কাউন্টার ডেলিভারি ৳১৭০";
        } else {
          // Heavy Carton / Fruit (Mango Crate 5kg, 10kg, 20kg)
          const perKgRate = area === "DHAKA" ? 12 : 13;
          const billedKg = Math.ceil(safeWeight);
          const rawCharge = 30 + billedKg * perKgRate;
          charge = Math.max(120, Math.round(rawCharge / 10) * 10);
          explanation = `ভারী কার্টুন বেস ৳৩০ + (${billedKg} কেজি × ৳${perKgRate}) = ৳${charge}`;
        }
      }
      break;
    }

    case "sa_paribahan": {
      // SA Paribahan Branch / Counter delivery from Natore
      if (area === "LOCAL") {
        charge = 60;
        explanation = "লোকাল কাউন্টার পার্সেল ৳৬০";
      } else {
        // Minimum ৳120 for non-local delivery
        if (safeWeight <= 1.0) {
          charge = 120;
          explanation = "১ কেজি পর্যন্ত কাউন্টার পার্সেল ৳১২০";
        } else if (safeWeight <= 2.0) {
          charge = 130;
          explanation = "২ কেজি পর্যন্ত কাউন্টার পার্সেল ৳১৩০";
        } else if (safeWeight <= 3.0) {
          charge = 140;
          explanation = "৩ কেজি পর্যন্ত কাউন্টার পার্সেল ৳১৪০";
        } else if (safeWeight <= 5.0) {
          charge = 160;
          explanation = "৫ কেজি পর্যন্ত ফ্রুটস/কার্টুন ৳১৬০";
        } else if (safeWeight <= 10.0) {
          charge = 210;
          explanation = "১০ কেজি পর্যন্ত ফ্রুটস/কার্টুন ৳২১০";
        } else if (safeWeight <= 20.0) {
          charge = 290;
          explanation = "২০ কেজি পর্যন্ত ফ্রুটস/কার্টুন ৳২৯০";
        } else {
          charge = 290 + Math.ceil(safeWeight - 20) * 12;
          explanation = `২০ কেজি ৳২৯০ + অতিরিক্ত কেজি ৳১২`;
        }
      }
      break;
    }
  }

  // Absolute guard: minimum ৳120 for any delivery inside Dhaka or outside Dhaka
  if (area !== "LOCAL" && charge < 120) {
    charge = 120;
  }

  return { charge, weightUsed: safeWeight, explanation };
}

/**
 * নির্দিষ্ট পণ্য সাইজের জন্য ৪টি কুরিয়ারের তুলনামূলক তালিকা
 */
export interface CourierComparisonResult {
  courier: CourierServiceInfo;
  charge: number;
  explanation: string;
  isLowestPrice: boolean;
  savingsVsHighest: number;
}

export function compareAllCouriers(
  area: DeliveryAreaKey,
  weightKg: number,
  enabledList?: CourierId[]
): CourierComparisonResult[] {
  const courierIds: CourierId[] =
    enabledList && enabledList.length > 0 ? enabledList : ALL_COURIER_IDS;
  
  const results = courierIds.map((id) => {
    const calc = calculateCourierCharge(id, area, weightKg);
    return {
      courier: COURIER_SERVICES[id],
      charge: calc.charge,
      explanation: calc.explanation,
      isLowestPrice: false,
      savingsVsHighest: 0,
    };
  });

  const charges = results.map((r) => r.charge);
  const minCharge = Math.min(...charges);
  const maxCharge = Math.max(...charges);

  return results.map((r) => ({
    ...r,
    isLowestPrice: r.charge === minCharge,
    savingsVsHighest: maxCharge - r.charge,
  }));
}

/**
 * জনপ্রিয় প্রোডাক্ট সাইজ প্রিসেট (সহজ যাচাইয়ের জন্য)
 */
export const POPULAR_PRODUCT_PRESETS = [
  { label: "🍯 মধু ৫০০ মিলি", weightKg: 0.7, category: "মধু", desc: "জার ও প্যাকিং সহ ~৭০০ গ্রাম" },
  { label: "🍯 মধু ১ লিটার", weightKg: 1.4, category: "মধু", desc: "প্যাকিং সহ ~১.৪ কেজি" },
  { label: "🍯 মধু ২ লিটার", weightKg: 2.7, category: "মধু", desc: "প্যাকিং সহ ~২.৭ কেজি" },
  { label: "🌴 খেজুরের গুড় ১ কেজি", weightKg: 1.1, category: "গুড়", desc: "পাটালি ও প্যাকিং সহ ~১.১ কেজি" },
  { label: "🥭 আম ৫ কেজি কার্টুন", weightKg: 5.5, category: "আম", desc: "আম ও কার্টুন সহ ~৫.৫ কেজি" },
  { label: "🥭 আম ১০ কেজি ক্যারেট", weightKg: 10.8, category: "আম", desc: "আম ও ঝুড়ি/ক্যারেট সহ ~১০.৮ কেজি" },
  { label: "🥭 আম ২০ কেজি বড় ক্যারেট", weightKg: 21.0, category: "আম", desc: "আম ও ক্যারেট সহ ~২১ কেজি" },
];
