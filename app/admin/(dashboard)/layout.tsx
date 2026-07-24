import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const nav = [
  ["Dashboard", "/admin"],
  ["Products", "/admin/products"],
  ["Business applications", "/admin/applications"],
  ["Requests", "/admin/requests"],
] as const;

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) redirect("/admin/login");

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) redirect("/admin/login");

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roles = (roleRows ?? []).map((row) => row.role);
  if (!roles.includes("owner_admin") && !roles.includes("staff")) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><span>G</span><strong>Gowtham Admin</strong></Link>
        <nav>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <div className="admin-sidebar-footer"><Link href="/">View website</Link><Link href="/admin/login">Switch account</Link></div>
      </aside>
      <section className="admin-workspace"><header className="admin-topbar"><div><small>Owner workspace</small><strong>Gowtham Fireworks Industries</strong></div><span className="status-pill">Protected staging</span></header>{children}</section>
    </div>
  );
}
