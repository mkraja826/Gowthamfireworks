import Link from "next/link";

export const metadata = { title: "Wholesale access" };

export default function WholesalePage() {
  return (
    <div className="page-shell container">
      <section className="wholesale-hero"><div><span className="eyebrow">Factory to wholesaler</span><h1>Wholesale access built for repeat business.</h1><p>Approved businesses receive assigned price lists, MOQ, carton quantities, business availability and faster repeat-request tools.</p><div className="button-row"><Link className="primary-button" href="/login">Login with phone OTP</Link><Link className="secondary-button" href="/business/apply">Start business application</Link></div></div><div className="wholesale-panel"><h2>Approval protects wholesale pricing</h2><ul><li>Business details and contact verification</li><li>GST and licence information where applicable</li><li>Private document upload</li><li>Owner review and price-list assignment</li></ul></div></section>
      <section className="section"><div className="section-heading centered"><span className="eyebrow dark">Application journey</span><h2>Five clear steps</h2></div><div className="process-grid business-process">{["Verify phone","Business basics","Address and compliance details","Owner review","Wholesale catalogue access"].map((item, index) => <article key={item}><b>{index + 1}</b><h3>{item}</h3></article>)}</div></section>
      <section className="wholesale-features"><article><h3>Assigned pricing</h3><p>Each approved business sees only the wholesale price list assigned by the owner.</p></article><article><h3>MOQ and carton rules</h3><p>Quantity controls enforce valid pack and carton increments before submission.</p></article><article><h3>Repeat requirements</h3><p>Approved businesses can review prior requests and prepare repeat orders faster.</p></article></section>
    </div>
  );
}
