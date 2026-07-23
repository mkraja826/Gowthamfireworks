"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categories, demoProducts } from "@/lib/demo-data";

export default function CataloguePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("recommended");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    const initialCategory = params.get("category");
    if (initialQuery) setQuery(initialQuery);
    if (initialCategory && categories.includes(initialCategory)) setCategory(initialCategory);
  }, []);

  const products = useMemo(() => {
    const filtered = demoProducts.filter((product) => {
      const matchesText = `${product.name} ${product.category} ${product.brand} ${product.packSize}`.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      const matchesAvailability = availability === "all" || product.availability === availability;
      return matchesText && matchesCategory && matchesAvailability;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.retailPrice - b.retailPrice;
      if (sort === "price-high") return b.retailPrice - a.retailPrice;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured);
    });
  }, [availability, category, query, sort]);

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setAvailability("all");
    setSort("recommended");
  }

  return (
    <div className="catalogue-page">
      <div className="catalogue-heading-wrap">
        <div className="container catalogue-heading">
          <div><span className="eyebrow">Retail catalogue</span><h1>Find products for your celebration.</h1><p>Search by product, category, brand or pack size. Final availability is confirmed before fulfilment.</p></div>
          <div className="catalogue-note"><strong>Need help choosing?</strong><span>Build a cart or contact the factory with your budget and city.</span></div>
        </div>
      </div>

      <div className="page-shell container catalogue-content">
        <div className="catalogue-toolbar">
          <div className="catalogue-search"><label className="sr-only" htmlFor="catalogue-search">Search catalogue</label><input id="catalogue-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crackers, packs or brands" /></div>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)} aria-label="Filter by availability"><option value="all">All availability</option><option value="available">Available</option><option value="limited">Limited stock</option><option value="coming_soon">Coming soon</option><option value="out_of_stock">Out of stock</option></select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select>
        </div>

        <div className="category-chips"><button className={category === "All" ? "active" : ""} onClick={() => setCategory("All")}>All products</button>{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <div className="catalogue-result-bar"><span><strong>{products.length}</strong> products shown</span>{(query || category !== "All" || availability !== "all" || sort !== "recommended") && <button onClick={clearFilters}>Clear filters</button>}</div>

        {products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>No matching products</h2><p>Clear the filters or try another product name.</p><button className="primary-button" onClick={clearFilters}>Show all products</button></div>}
      </div>
    </div>
  );
}
