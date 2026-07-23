"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categories, demoProducts } from "@/lib/demo-data";

export default function CataloguePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const products = useMemo(() => demoProducts.filter((product) => {
    const matchesText = `${product.name} ${product.category} ${product.brand}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || product.category === category;
    return matchesText && matchesCategory;
  }), [query, category]);

  return (
    <div className="page-shell container">
      <div className="page-heading"><span className="eyebrow dark">Retail catalogue</span><h1>Explore products and family packs.</h1><p>Demo catalogue data is shown until the owner adds live products through the admin panel.</p></div>
      <div className="catalogue-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, category or brand" aria-label="Search catalogue" /><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="category-chips"><button className={category === "All" ? "active" : ""} onClick={() => setCategory("All")}>All</button>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No matching products</h2><p>Try a different search or category.</p></div>}
    </div>
  );
}
