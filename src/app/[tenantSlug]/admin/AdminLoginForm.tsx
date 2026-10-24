"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, ArrowLeft, KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";
import { verifyAdminPasswordAction } from "@/app/actions";

export default function AdminLoginForm({ slug, storeName }: { slug: string; storeName: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyAdminPasswordAction(password.trim());
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "পাসওয়ার্ড ভুল হয়েছে!");
      }
    } catch {
      setError("লগইন করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Return to store link */}
        <div className="mb-6">
          <a
            href={`/${slug}`}
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>কাস্টমার স্টোরে ফিরে যান</span>
          </a>
        </div>

        {/* Login Card */}
        <div className="bg-stone-950/90 border border-stone-800 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 rounded-full bg-white p-1 border-2 border-emerald-500/40 shadow-xl mx-auto mb-3 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt={storeName}
                width={64}
                height={64}
                className="w-full h-full object-cover rounded-full"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-950 border-2 border-stone-900 flex items-center justify-center text-amber-400 shadow">
                <Lock className="w-3 h-3" />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              অ্যাডমিন সিকিউরিটি অ্যাক্সেস
            </h1>
            <p className="text-xs text-stone-400 mt-1.5 font-medium">
              {storeName} ({slug}) এর অর্ডার ও ইনভেন্টরি ম্যানেজমেন্ট
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-300">
                  অ্যাডমিন পাসওয়ার্ড লিখুন
                </label>
                <button
                  type="button"
                  onClick={() => setPassword("admin123")}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold transition"
                >
                  পাসওয়ার্ড বসান (admin123)
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition"
                  title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-98 text-emerald-950 font-black py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-950/50 disabled:opacity-50"
            >
              {loading ? "ভেরিফাই করা হচ্ছে..." : "অ্যাডমিন প্যানেলে লগইন করুন"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>শুধুমাত্র অনুমোদিত স্টোর মালিকদের জন্য সংরক্ষিত</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
