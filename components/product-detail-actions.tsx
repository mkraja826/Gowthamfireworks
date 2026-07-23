"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { CatalogueProduct } from "@/lib/types";

export function ProductDetailActions({ product, supportHref }: { product: CatalogueProduct; supportHref: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const canAdd = product.availability === "available" || product.availability === "limited";

  function add() {
    addItem(product);
    setAdded(true);
  }

  return (
    <div className="detail-actions">
      <button className="primary-button" disabled={!canAdd} onClick={add}>{canAdd ? (added ? "Added to requirement" : "Add to requirement") : "Currently unavailable"}</button>
      <a className="secondary-button" href={supportHref}>Ask the factory</a>
      {added && <Link className="view-cart-link" href="/cart">View requirement cart →</Link>}
    </div>
  );
}
