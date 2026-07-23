import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { categories, demoProducts } from "@/lib/demo-data";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-fireworks" aria-hidden="true"><i /><i /><i /></div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Sivakasi · Retail & Wholesale</span>
            <h1>Factory-direct fireworks for every scale of celebration.</h1>
            <p>Explore authentic products for families, shops and wholesale partners. Build your requirement online and receive factory confirmation on pricing, availability and fulfilment.</p>
            <div className="button-row"><Link className="primary-button" href="/catalogue">Explore retail catalogue</Link><Link className="secondary-button" href="/wholesale">Apply for wholesale</Link></div>
            <div className="trust-row"><span>Factory catalogue</span><span>Owner-confirmed stock</span><span>Retail & B2B pricing</span></div>
          </div>
          <div className="hero-panel">
            <div className="hero-burst">🎆</div>
            <strong>Sivakasi Midnight Festival</strong>
            <p>A modern product-first experience built around real factory inventory.</p>
            <div className="mini-stats"><span><b>2</b> buying paths</span><span><b>1</b> owner dashboard</span><span><b>OTP</b> secure access</span></div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><span className="eyebrow dark">Choose your buying path</span><h2>Personal celebrations and business supply, clearly separated.</h2></div>
        <div className="channel-grid">
          <article className="channel-card personal"><span>Personal / Family</span><h3>Retail packs made easy</h3><p>Explore family packs, compare products, save your cart and submit a requirement using phone OTP.</p><Link href="/catalogue">Explore retail →</Link></article>
          <article className="channel-card business"><span>Business / Wholesale</span><h3>Wholesale access after approval</h3><p>Create a business profile, submit required details and unlock assigned pricing, MOQ and carton quantities after owner approval.</p><Link href="/wholesale">Apply for wholesale →</Link></article>
        </div>
      </section>

      <section className="section warm-section">
        <div className="container">
          <div className="section-heading split"><div><span className="eyebrow dark">Shop by category</span><h2>Find the right kind of celebration.</h2></div><Link href="/catalogue">View all products →</Link></div>
          <div className="category-grid">{categories.map((category, index) => <Link key={category} href={`/catalogue?category=${encodeURIComponent(category)}`}><span>{["✨","🌋","🌀","🚀","🎆","⛲","🎁","🧨"][index]}</span><strong>{category}</strong></Link>)}</div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading split"><div><span className="eyebrow dark">Featured products</span><h2>Popular family and festival picks.</h2></div><Link href="/catalogue">Browse catalogue →</Link></div>
        <div className="product-grid">{demoProducts.filter((product) => product.featured).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="section-heading centered"><span className="eyebrow">How it works</span><h2>Simple online preparation, direct factory confirmation.</h2></div>
          <div className="process-grid">
            {["Browse the catalogue","Add products to your retail or wholesale cart","Verify your phone with OTP","Submit your requirement","Factory confirms stock and next steps"].map((item, index) => <article key={item}><b>{index + 1}</b><h3>{item}</h3></article>)}
          </div>
        </div>
      </section>

      <section className="section container story-grid" id="about">
        <div><span className="eyebrow dark">About the factory</span><h2>Built around trusted products, transparent information and direct support.</h2><p>Gowtham Fireworks Industries is developing a modern retail and wholesale catalogue experience connected to owner-managed pricing, product photographs and availability.</p><p>Verified factory history, licences, service regions and real photographs will be added through the admin content system before production launch.</p></div>
        <div className="story-card"><span>Factory story</span><strong>Real people. Real products. Clear availability.</strong><p>No fake scarcity, expired countdowns or hidden wholesale terms.</p></div>
      </section>

      <section className="section safety-section" id="safety">
        <div className="container"><div className="section-heading"><span className="eyebrow">Safety first</span><h2>Celebrate responsibly.</h2></div><div className="safety-grid">{["Adult supervision","Use outdoors in open areas","Keep safe distance","Keep water or sand ready","Never relight failed items","Follow local rules and timings"].map((item) => <span key={item}>{item}</span>)}</div></div>
      </section>

      <section className="section final-cta"><div className="container"><div><span className="eyebrow">Ready to begin?</span><h2>Planning a family celebration or stocking your shop?</h2></div><div className="button-row"><Link className="primary-button" href="/catalogue">Explore retail</Link><Link className="secondary-button" href="/wholesale">Wholesale access</Link></div></div></section>
    </>
  );
}
