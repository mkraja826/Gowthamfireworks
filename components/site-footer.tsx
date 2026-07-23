import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark">G</span><span><strong>Gowtham</strong><small>Fireworks Industries</small></span></div>
          <p>Factory-direct retail and wholesale requirement support from Sivakasi.</p>
        </div>
        <div><h3>Explore</h3><Link href="/catalogue">Retail Catalogue</Link><Link href="/wholesale">Wholesale</Link><Link href="/#about">About Factory</Link></div>
        <div><h3>Help</h3><Link href="/#safety">Safety</Link><Link href="/login">Customer Login</Link><Link href="/admin/login">Owner Login</Link></div>
        <div><h3>Contact</h3><p>Phone and WhatsApp details will be managed from the owner dashboard.</p><p>Serviceability is confirmed before fulfilment.</p></div>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} Gowtham Fireworks Industries. All rights reserved.</div>
    </footer>
  );
}
