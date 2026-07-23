import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { demoProducts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export function generateStaticParams() { return demoProducts.map((product) => ({ slug: product.slug })); }

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = demoProducts.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  return (
    <div className="page-shell container">
      <Link href="/catalogue" className="back-link">← Back to catalogue</Link>
      <div className="product-detail">
        <div className="product-detail-image"><span>{product.imageLabel}</span><small>Owner product image will replace this placeholder.</small></div>
        <div className="product-detail-copy"><span className="eyebrow dark">{product.category} · {product.brand}</span><h1>{product.name}</h1><p>{product.description}</p><div className="detail-price"><strong>{formatCurrency(product.retailPrice)}</strong><del>{formatCurrency(product.mrp)}</del></div><dl><div><dt>Pack size</dt><dd>{product.packSize}</dd></div><div><dt>Availability</dt><dd>{product.availability.replaceAll("_", " ")}</dd></div><div><dt>Channel</dt><dd>Retail</dd></div></dl><Link className="primary-button" href="/catalogue">Add from catalogue</Link><p className="legal-note">Submission creates a requirement for factory confirmation. It does not automatically confirm stock or fulfilment.</p></div>
      </div>
      {related.length > 0 && <section className="related"><h2>Related products</h2><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
    </div>
  );
}
