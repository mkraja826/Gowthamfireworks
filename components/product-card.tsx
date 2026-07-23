"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";
import type { CatalogueProduct } from "@/lib/types";

const labels = {
  available: "Available",
  limited: "Limited stock",
  out_of_stock: "Out of stock",
  coming_soon: "Coming soon",
};

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const { addItem } = useCart();
  const canAdd = product.availability === "available" || product.availability === "limited";
  const discount = Math.max(0, Math.round((1 - product.retailPrice / product.mrp) * 100));

  return (
    <article className="product-card">
      <Link href={`/catalogue/${product.slug}`} className="product-image" aria-label={`View ${product.name}`}>
        <span aria-hidden="true">{product.imageLabel}</span>
        {product.lowSound && <em>Low sound</em>}
      </Link>
      <div className="product-body">
        <small>{product.category} · {product.brand}</small>
        <h3><Link href={`/catalogue/${product.slug}`}>{product.name}</Link></h3>
        <p>{product.packSize}</p>
        <div className="price-row"><strong>{formatCurrency(product.retailPrice)}</strong><del>{formatCurrency(product.mrp)}</del>{discount > 0 && <b>{discount}% off</b>}</div>
        <div className={`availability ${product.availability}`}>{labels[product.availability]}</div>
        <button disabled={!canAdd} onClick={() => addItem(product)}>{canAdd ? "Add to retail cart" : labels[product.availability]}</button>
      </div>
    </article>
  );
}
