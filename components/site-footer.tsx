import Link from "next/link";

export function SiteFooter() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const supportHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "/#contact";

  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-grid">
        <div className="footer-intro">
          <div className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><i /></span><span><strong>Gowtham</strong><small>Fireworks Industries</small></span></div>
          <p>Retail catalogue, family packs and approved wholesale access with direct factory confirmation before fulfilment.</p>
          <a className="footer-support" href={supportHref}>WhatsApp & factory support</a>
        </div>
        <div><h3>Shop</h3><Link href="/catalogue">All products</Link><Link href="/catalogue?category=Family%20Combos">Family combos</Link><Link href="/wholesale">Wholesale access</Link></div>
        <div><h3>Help</h3><Link href="/#how-it-works">How to buy</Link><Link href="/#safety">Safety guidance</Link><Link href="/login">Customer account</Link><Link href="/cart">Requirement cart</Link></div>
        <div><h3>Before fulfilment</h3><p>Product availability, serviceability and final terms are confirmed directly by the factory.</p><p>Wholesale pricing is visible only to approved business accounts.</p></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Gowtham Fireworks Industries.</span><span>Catalogue submission does not automatically confirm stock or fulfilment.</span></div>
    </footer>
  );
}
