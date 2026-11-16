import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/viewer";
import { AppHeader } from "@/components/app/app-header";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Pochi Ma Buoni" }, robots: { index: false } };

/** Server-side role check from the database — never a client-side flag. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <>
      <AppHeader isAdmin />
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[12rem_1fr] lg:py-12">
        <AdminNav />
        <main id="main" className="min-w-0">{children}</main>
      </div>
    </>
  );
}
