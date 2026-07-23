import Link from "next/link";

const nav = [
  ["Dashboard", "/admin"],
  ["Products", "/admin/products"],
  ["Business applications", "/admin/applications"],
  ["Requests", "/admin/requests"],
] as const;

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand"><span>G</span><strong>Gowtham Admin</strong></Link>
        <nav>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <div className="admin-sidebar-footer"><Link href="/">View website</Link><Link href="/admin/login">Switch account</Link></div>
      </aside>
      <section className="admin-workspace"><header className="admin-topbar"><div><small>Owner workspace</small><strong>Gowtham Fireworks Industries</strong></div><span className="status-pill">Development</span></header>{children}</section>
    </div>
  );
}
