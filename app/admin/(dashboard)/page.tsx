import Link from "next/link";

const metrics = [
  ["Retail requests today", "0", "New customer requirements"],
  ["Wholesale requests", "0", "Approved business requirements"],
  ["Pending applications", "0", "Businesses awaiting review"],
  ["Published products", "0", "Will update after Supabase schema"],
];

export default function AdminDashboardPage() {
  return (
    <div className="admin-page"><div className="admin-page-heading"><div><small>Dashboard</small><h1>Good morning, Owner.</h1><p>Manage catalogue, pricing, stock and customer activity from one place.</p></div><Link className="primary-button" href="/admin/products">Add product</Link></div><div className="metric-grid">{metrics.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><p>{note}</p></article>)}</div><div className="admin-columns"><section className="admin-panel"><div className="panel-heading"><h2>Quick actions</h2></div><div className="quick-actions"><Link href="/admin/products">＋ Add a new product</Link><Link href="/admin/products">◉ Change availability</Link><Link href="/admin/applications">✓ Review business application</Link><Link href="/admin/requests">→ View new requests</Link></div></section><section className="admin-panel"><div className="panel-heading"><h2>Build status</h2></div><ul className="status-list"><li><span className="dot complete" /> Public website shell complete</li><li><span className="dot complete" /> Test OTP interface complete</li><li><span className="dot complete" /> Product manager interface complete</li><li><span className="dot pending" /> Supabase schema waiting to be applied</li><li><span className="dot pending" /> Real product data waiting for owner entry</li></ul></section></div></div>
  );
}
