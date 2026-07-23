import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductPackVisual } from "@/components/product-pack-visual";
import { categories, demoProducts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

const categoryCodes: Record<string, string> = {
  Sparklers: "SP",
  "Flower Pots": "FP",
  "Ground Chakkars": "GC",
  Rockets: "RK",
  "Aerial Shots": "AS",
  "Fancy Fountains": "FF",
  "Gift Boxes": "GB",
  "Family Combos": "FC",
};

export default function HomePage() {
  const featured = demoProducts.filter((product) => product.featured).slice(0, 4);
  const combos = demoProducts.filter((product) => ["Family Combos", "Gift Boxes"].includes(product.category)).slice(0, 2);
  const heroProducts = demoProducts.slice(0, 3);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const supportHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "/#contact";

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Direct catalogue support from Sivakasi</span>
            <h1>Build your celebration requirement in minutes.</h1>
            <p>Browse family favourites, gift boxes and festival packs. Add what you need, verify your phone and receive direct confirmation on availability and fulfilment.</p>
            <form className="hero-search" action="/catalogue">
              <label className="sr-only" htmlFor="hero-search">Search the catalogue</label>
              <input id="hero-search" name="q" placeholder="Search sparklers, flower pots, combos…" />
              <button type="submit">Search catalogue</button>
            </form>
            <div className="button-row">
              <Link className="primary-button" href="/catalogue">Browse all crackers</Link>
              <Link className="secondary-button" href="/catalogue?category=Family%20Combos">View family combos</Link>
            </div>
            <div className="trust-row"><span>Prices shown clearly</span><span>Phone OTP account</span><span>Factory confirmation</span></div>
          </div>

          <div className="hero-showcase" aria-label="Featured product preview">
            <div className="hero-showcase-heading"><span>Popular this season</span><strong>Retail picks for family celebrations</strong></div>
            <div className="pack-stack">
              {heroProducts.map((product, index) => (
                <div className={`stack-item stack-${index + 1}`} key={product.id}>
                  <ProductPackVisual name={product.name} category={product.category} packSize={product.packSize} variant="hero" />
                  <b>{formatCurrency(product.retailPrice)}</b>
                </div>
              ))}
            </div>
            <Link href="/catalogue">See the complete catalogue <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="category-section">
        <div className="container">
          <div className="section-heading compact split"><div><span className="eyebrow dark">Shop by category</span><h2>Start with what you are looking for.</h2></div><Link href="/catalogue">View all products →</Link></div>
          <div className="category-grid">
            {categories.map((category) => <Link key={category} href={`/catalogue?category=${encodeURIComponent(category)}`}><span>{categoryCodes[category]}</span><strong>{category}</strong><small>Explore products</small></Link>)}
          </div>
        </div>
      </section>

      {combos.length > 0 && <section className="section combo-section">
        <div className="container">
          <div className="section-heading split"><div><span className="eyebrow dark">Easy family selection</span><h2>Celebration packs without the guesswork.</h2><p>Start with a ready assortment, then add individual favourites from the catalogue.</p></div><Link href="/catalogue?category=Family%20Combos">All combo packs →</Link></div>
          <div className="combo-grid">
            {combos.map((product, index) => <article className={`combo-card combo-${index + 1}`} key={product.id}><div><span>{product.brand}</span><h3>{product.name}</h3><p>{product.description}</p><div className="combo-price"><strong>{formatCurrency(product.retailPrice)}</strong><del>{formatCurrency(product.mrp)}</del></div><Link href={`/catalogue/${product.slug}`}>View pack details →</Link></div><ProductPackVisual name={product.name} category={product.category} packSize={product.packSize} variant="hero" /></article>)}
          </div>
        </div>
      </section>}

      <section className="section container">
        <div className="section-heading split"><div><span className="eyebrow dark">Best sellers</span><h2>Popular products for a balanced celebration.</h2></div><Link href="/catalogue">Browse full catalogue →</Link></div>
        <div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="support-section">
        <div className="container support-grid">
          <div><span className="eyebrow">Need help choosing?</span><h2>Speak directly with the factory team.</h2><p>Share your budget, city and celebration size. The team can help you prepare a suitable requirement before confirmation.</p><a className="primary-button" href={supportHref}>WhatsApp support</a></div>
          <div className="support-facts"><article><strong>Retail</strong><span>Families and personal celebrations</span></article><article><strong>Wholesale</strong><span>Approved shops and business buyers</span></article><article><strong>Serviceability</strong><span>Confirmed before fulfilment</span></article></div>
        </div>
      </section>

      <section className="section container channel-section">
        <div className="section-heading centered"><span className="eyebrow dark">Retail and wholesale</span><h2>One catalogue, two clearly separated buying paths.</h2></div>
        <div className="channel-grid">
          <article className="channel-card personal"><span>Personal / Family</span><h3>Browse prices and build a retail cart</h3><p>Compare products, save quantities and verify your phone only when you are ready to continue.</p><Link href="/catalogue">Explore retail →</Link></article>
          <article className="channel-card business"><span>Business / Wholesale</span><h3>Apply for protected wholesale access</h3><p>Approved businesses receive assigned pricing, MOQ and carton information after owner review.</p><Link href="/wholesale">Learn about wholesale →</Link></article>
        </div>
      </section>

      <section className="section process-section" id="how-it-works">
        <div className="container">
          <div className="section-heading centered"><span className="eyebrow">How it works</span><h2>A clear requirement process from browsing to confirmation.</h2></div>
          <div className="process-grid">
            {["Browse products","Add the quantities you need","Verify your phone","Add contact and location details","Receive factory confirmation"].map((item, index) => <article key={item}><b>{String(index + 1).padStart(2, "0")}</b><h3>{item}</h3></article>)}
          </div>
        </div>
      </section>

      <section className="section container story-grid" id="about">
        <div><span className="eyebrow dark">Gowtham Fireworks</span><h2>A clearer way to browse retail products and request wholesale supply.</h2><p>The catalogue separates personal and business buying, shows product information in a consistent format and keeps final availability under direct factory confirmation.</p><div className="story-points"><span>Transparent retail pricing</span><span>Protected wholesale pricing</span><span>Direct support before fulfilment</span></div></div>
        <div className="story-card"><span>Catalogue promise</span><strong>Products first. Clear information. Direct confirmation.</strong><p>No confusing checkout flow and no automatic promise of stock before the factory reviews the requirement.</p></div>
      </section>

      <section className="section safety-section" id="safety">
        <div className="container"><div className="section-heading"><span className="eyebrow">Safety first</span><h2>Plan the celebration responsibly.</h2></div><div className="safety-grid">{["Adult supervision","Use outdoors in open areas","Keep a safe distance","Keep water or sand ready","Never relight failed items","Follow local rules and timings"].map((item, index) => <span key={item}><b>{index + 1}</b>{item}</span>)}</div></div>
      </section>

      <section className="section final-cta"><div className="container"><div><span className="eyebrow">Start your requirement</span><h2>Find the products that fit your celebration.</h2><p>Browse freely. Phone verification is needed only when you continue with the requirement.</p></div><div className="button-row"><Link className="primary-button" href="/catalogue">Browse catalogue</Link><Link className="secondary-button" href="/wholesale">Wholesale access</Link></div></div></section>
    </>
  );
}
