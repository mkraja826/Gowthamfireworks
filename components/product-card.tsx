"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { ProductPackVisual } from "@/components/product-pack-visual";
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
  const [added, setAdded] = useState(false);
  const canAdd = product.availability === "available" || product.availability === "limited";
  const discount = Math.max(0, Math.round((1 - product.retailPrice / product.mrp) * 100));

  function addToCart() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="product-card">
      <Link href={`/catalogue/${product.slug}`} className="product-image" aria-label={`View ${product.name}`}>
        <ProductPackVisual name={product.name} category={product.category} packSize={product.packSize} />
        <div className="product-badges">
          {product.lowSound && <em>Low sound</em>}
          {product.availability === "limited" && <em className="limited-badge">Limited</em>}
        </div>
      </Link>
      <div className="product-body">
        <small>{product.brand} · {product.category}</small>
        <h3><Link href={`/catalogue/${product.slug}`}>{product.name}</Link></h3>
        <p>{product.packSize}</p>
        <div className="price-row"><strong>{formatCurrency(product.retailPrice)}</strong><del>{formatCurrency(product.mrp)}</del>{discount > 0 && <b>{discount}% off</b>}</div>
        <div className={`availability ${product.availability}`}>{labels[product.availability]}</div>
        <div className="product-card-actions">
          <Link href={`/catalogue/${product.slug}`}>Details</Link>
          <button disabled={!canAdd} onClick={addToCart}>{canAdd ? (added ? "Added" : "+ Add") : labels[product.availability]}</button>
        </div>
      </div>
    </article>
  );
}
