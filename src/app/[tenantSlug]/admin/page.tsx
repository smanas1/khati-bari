// src/app/[tenantSlug]/admin/page.tsx
import type { Metadata } from "next";
import { getOrInitTenant, isAdminAuthenticated } from "@/app/actions";
import AdminClient from "./AdminClient";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getOrInitTenant(tenantSlug);
  return {
    title: `অ্যাডমিন প্যানেল — ${tenant.name}`,
    description: `${tenant.name} এর অর্ডার ও ইনভেন্টরি ম্যানেজমেন্ট প্যানেল।`,
    robots: { index: false, follow: false },
  };
}

export default async function TenantAdminPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getOrInitTenant(tenantSlug);
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return <AdminLoginForm slug={tenantSlug} storeName={tenant.name} />;
  }

  return <AdminClient tenant={tenant} />;
}
