import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { ProductPackVisual } from "@/components/product-pack-visual";
import { demoProducts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export function generateStaticParams() { return demoProducts.map((product) => ({ slug: product.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = demoProducts.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  const discount = Math.max(0, Math.round((1 - product.retailPrice / product.mrp) * 100));
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const supportHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "/#contact";

  return (
    <div className="page-shell container">
      <Link href="/catalogue" className="back-link">← Back to catalogue</Link>
      <div className="product-detail">
        <div className="product-gallery">
          <div className="product-detail-image"><ProductPackVisual name={product.name} category={product.category} packSize={product.packSize} variant="detail" /></div>
          <div className="product-thumbnails" aria-label="Product visual previews"><button className="active"><ProductPackVisual name={product.name} category={product.category} packSize={product.packSize} variant="cart" /></button><button><span>PACK</span></button><button><span>DETAILS</span></button></div>
        </div>
        <div className="product-detail-copy">
          <span className="eyebrow dark">{product.brand} · {product.category}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="detail-price"><strong>{formatCurrency(product.retailPrice)}</strong><del>{formatCurrency(product.mrp)}</del>{discount > 0 && <b>Save {discount}%</b>}</div>
          <div className={`availability ${product.availability}`}>{product.availability.replaceAll("_", " ")}</div>
          <dl><div><dt>Pack size</dt><dd>{product.packSize}</dd></div><div><dt>Buying channel</dt><dd>Retail</dd></div><div><dt>Final availability</dt><dd>Factory confirmed</dd></div></dl>
          <ProductDetailActions product={product} supportHref={supportHref} />
          <div className="detail-assurance"><strong>Before fulfilment</strong><p>The factory rechecks availability, serviceability and applicable terms after the requirement is submitted.</p></div>
        </div>
      </div>
      <section className="product-guidance"><article><strong>Use responsibly</strong><p>Follow product instructions, keep safe distance and use only in suitable open areas.</p></article><article><strong>Need business quantity?</strong><p>Approved wholesale accounts receive assigned pricing, MOQ and carton information.</p><Link href="/wholesale">Wholesale access →</Link></article></section>
      {related.length > 0 && <section className="related"><div className="section-heading split"><div><span className="eyebrow dark">You may also like</span><h2>Related products</h2></div><Link href="/catalogue">View catalogue →</Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  );
}
