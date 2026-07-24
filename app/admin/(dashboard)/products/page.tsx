"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";
import styles from "./products.module.css";

type Category = { id: string; name: string };
type NamedRelation = { name: string } | { name: string }[] | null;
type CodeRelation = { code: string } | { code: string }[] | null;

type ProductPrice = {
  selling_price: number | string;
  mrp: number | string | null;
  price_lists: CodeRelation;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  pack_size: string | null;
  status: "draft" | "active" | "archived";
  is_published: boolean;
  categories: NamedRelation;
  brands: NamedRelation;
  inventory: { stock_quantity: number }[] | null;
  product_prices: ProductPrice[] | null;
};

type ReviewFilter = "all" | "draft" | "published" | "archived";

function relationName(relation: NamedRelation, fallback: string) {
  if (Array.isArray(relation)) return relation[0]?.name ?? fallback;
  return relation?.name ?? fallback;
}

function priceListCode(relation: CodeRelation) {
  if (Array.isArray(relation)) return relation[0]?.code;
  return relation?.code;
}

function getRetailPrice(product: ProductRow) {
  const price = product.product_prices?.find((row) => priceListCode(row.price_lists) === "RETAIL");
  if (!price) return null;
  return {
    sellingPrice: Number(price.selling_price),
    mrp: price.mrp === null ? null : Number(price.mrp),
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [query, setQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("draft");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoadingProducts(false);
      setMessage("Supabase is not configured.");
      return;
    }

    setLoadingProducts(true);
    const [{ data: categoryRows, error: categoryError }, { data: productRows, error: productError }] = await Promise.all([
      supabase.from("categories").select("id,name").order("display_order"),
      supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          sku,
          pack_size,
          status,
          is_published,
          categories(name),
          brands(name),
          inventory(stock_quantity),
          product_prices(selling_price,mrp,price_lists(code))
        `)
        .order("created_at", { ascending: false }),
    ]);

    setLoadingProducts(false);
    if (categoryError || productError) {
      setMessage(categoryError?.message ?? productError?.message ?? "Products could not be loaded.");
      return;
    }

    setCategories(categoryRows ?? []);
    setProducts((productRows as unknown as ProductRow[] | null) ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const category = relationName(product.categories, "Uncategorised");
      const brand = relationName(product.brands, "No brand");
      const searchable = `${product.name} ${product.sku ?? ""} ${product.slug} ${category} ${brand}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter =
        reviewFilter === "all" ||
        (reviewFilter === "draft" && !product.is_published && product.status === "draft") ||
        (reviewFilter === "published" && product.is_published && product.status === "active") ||
        (reviewFilter === "archived" && product.status === "archived");

      return matchesQuery && matchesFilter;
    });
  }, [products, query, reviewFilter]);

  const draftCount = products.filter((product) => !product.is_published && product.status === "draft").length;
  const publishedCount = products.filter((product) => product.is_published && product.status === "active").length;

  async function createCategory() {
    const name = window.prompt("Category name");
    if (!name) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Configure Supabase first.");
    const { error } = await supabase.from("categories").insert({ name, slug: slugify(name), is_active: true });
    if (error) return setMessage(error.message);
    setMessage("Category created.");
    void load();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setMessage("Supabase is not configured.");
    setLoading(true);
    setMessage("");

    const name = String(form.get("name"));
    const slug = slugify(String(form.get("slug") || name));
    const { data: product, error: productError } = await supabase.from("products").insert({
      name,
      slug,
      category_id: form.get("category_id") || null,
      description: form.get("description"),
      pack_size: form.get("pack_size"),
      status: "draft",
      is_published: false,
    }).select("id").single();

    if (productError || !product) {
      setLoading(false);
      return setMessage(productError?.message ?? "Product could not be created.");
    }

    const retailPrice = Number(form.get("retail_price"));
    const retailMrp = Number(form.get("retail_mrp"));
    const wholesalePrice = Number(form.get("wholesale_price") || 0);
    const stock = Number(form.get("stock_quantity") || 0);
    const image = form.get("image") as File;

    const { data: priceLists } = await supabase.from("price_lists").select("id,code").in("code", ["RETAIL", "WHOLESALE_STANDARD"]);
    const retailList = priceLists?.find((item) => item.code === "RETAIL");
    const wholesaleList = priceLists?.find((item) => item.code === "WHOLESALE_STANDARD");

    const operations = [
      supabase.from("product_channel_settings").insert([
        { product_id: product.id, channel: "retail", is_visible: true, availability: form.get("retail_availability"), minimum_quantity: 1 },
        { product_id: product.id, channel: "wholesale", is_visible: wholesalePrice > 0, availability: form.get("wholesale_availability"), minimum_quantity: Number(form.get("wholesale_moq") || 1), carton_quantity: Number(form.get("carton_quantity") || 1) },
      ]),
      supabase.from("inventory").insert({ product_id: product.id, stock_quantity: stock, low_stock_threshold: Number(form.get("low_stock_threshold") || 5) }),
    ];

    if (retailList) operations.push(supabase.from("product_prices").insert({ product_id: product.id, price_list_id: retailList.id, selling_price: retailPrice, mrp: retailMrp, minimum_quantity: 1 }));
    if (wholesaleList && wholesalePrice > 0) operations.push(supabase.from("product_prices").insert({ product_id: product.id, price_list_id: wholesaleList.id, selling_price: wholesalePrice, mrp: retailMrp, minimum_quantity: Number(form.get("wholesale_moq") || 1) }));

    const results = await Promise.all(operations);
    const operationError = results.find((result) => result.error)?.error;
    if (operationError) {
      setLoading(false);
      return setMessage(`Draft created, but related data failed: ${operationError.message}`);
    }

    if (image && image.size > 0) {
      const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${product.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, image, { cacheControl: "31536000", upsert: false });
      if (!uploadError) {
        const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(path);
        await supabase.from("product_images").insert({ product_id: product.id, storage_path: path, public_url: publicUrl.publicUrl, is_primary: true });
      }
    }

    setLoading(false);
    formElement.reset();
    setMessage("Draft product created. It is not publicly visible.");
    void load();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <small>Catalogue review</small>
          <h1>Imported products and drafts</h1>
          <p>Review names, category, price and stock before publishing any product.</p>
        </div>
        <button className="secondary-button" onClick={createCategory}>＋ Category</button>
      </div>

      <div className={styles.summaryGrid}>
        <article><span>Total products</span><strong>{products.length}</strong></article>
        <article><span>Awaiting review</span><strong>{draftCount}</strong></article>
        <article><span>Published</span><strong>{publishedCount}</strong></article>
        <article><span>Visible in this view</span><strong>{filteredProducts.length}</strong></article>
      </div>

      <div className="admin-columns product-admin-columns">
        <form className="admin-panel product-form" onSubmit={submit}>
          <div className="panel-heading"><h2>Add product</h2><span>Always saved as draft</span></div>
          <label>Product name<input name="name" required /></label>
          <div className="form-grid">
            <label>Slug<input name="slug" placeholder="auto-generated" /></label>
            <label>Category<select name="category_id"><option value="">Uncategorised</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          </div>
          <label>Description<textarea name="description" rows={3} required /></label>
          <div className="form-grid">
            <label>Pack size<input name="pack_size" placeholder="10 pieces" required /></label>
            <label>Product photo<input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label>
          </div>
          <h3>Retail</h3>
          <div className="form-grid">
            <label>Retail MRP<input name="retail_mrp" type="number" min="0" required /></label>
            <label>Retail selling price<input name="retail_price" type="number" min="0" required /></label>
          </div>
          <label>Retail availability<select name="retail_availability" defaultValue="available"><option value="available">Available</option><option value="limited">Limited stock</option><option value="out_of_stock">Out of stock</option><option value="coming_soon">Coming soon</option></select></label>
          <h3>Wholesale</h3>
          <div className="form-grid">
            <label>Wholesale price<input name="wholesale_price" type="number" min="0" /></label>
            <label>Wholesale MOQ<input name="wholesale_moq" type="number" min="1" defaultValue="1" /></label>
          </div>
          <div className="form-grid">
            <label>Carton quantity<input name="carton_quantity" type="number" min="1" defaultValue="1" /></label>
            <label>Wholesale availability<select name="wholesale_availability" defaultValue="available"><option value="available">Available</option><option value="limited">Limited stock</option><option value="out_of_stock">Out of stock</option><option value="coming_soon">Coming soon</option></select></label>
          </div>
          <h3>Inventory</h3>
          <div className="form-grid">
            <label>Stock quantity<input name="stock_quantity" type="number" min="0" defaultValue="0" /></label>
            <label>Low-stock warning<input name="low_stock_threshold" type="number" min="0" defaultValue="5" /></label>
          </div>
          <p className={styles.safetyNote}>New products are forced to draft and unpublished. Publishing will be a separate reviewed action.</p>
          <button className="primary-button" disabled={loading}>{loading ? "Saving draft…" : "Save draft product"}</button>
          {message && <p className="form-message" role="status">{message}</p>}
        </form>

        <section className="admin-panel">
          <div className="panel-heading"><h2>Product review queue</h2><span>{filteredProducts.length} shown</span></div>
          <div className={styles.toolbar}>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, category or brand" aria-label="Search imported products" />
            <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as ReviewFilter)} aria-label="Filter products by review state">
              <option value="draft">Awaiting review</option>
              <option value="all">All products</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {loadingProducts ? (
            <div className="empty-state compact"><h3>Loading products…</h3><p>Reading the protected catalogue from Supabase.</p></div>
          ) : filteredProducts.length ? (
            <div className={styles.productList}>
              {filteredProducts.map((product) => {
                const retailPrice = getRetailPrice(product);
                const category = relationName(product.categories, "Uncategorised");
                const brand = relationName(product.brands, "No brand");
                return (
                  <article className={styles.productRow} key={product.id}>
                    <div className={styles.productIdentity}>
                      <strong>{product.name}</strong>
                      <small>{product.sku ?? "No SKU"} · {product.pack_size ?? "Pack size pending"}</small>
                      <span>{category} · {brand}</span>
                    </div>
                    <div className={styles.productValue}>
                      <small>Retail price</small>
                      <strong>{retailPrice ? formatCurrency(retailPrice.sellingPrice) : "Pending"}</strong>
                      {retailPrice?.mrp !== null && retailPrice?.mrp !== undefined && <span>MRP {formatCurrency(retailPrice.mrp)}</span>}
                    </div>
                    <div className={styles.productValue}>
                      <small>Stock</small>
                      <strong>{product.inventory?.[0]?.stock_quantity ?? 0}</strong>
                      <span>units</span>
                    </div>
                    <b className={product.is_published ? styles.published : styles.draft}>{product.is_published ? "Published" : product.status}</b>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state compact"><h3>No matching products</h3><p>Change the search or review filter.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}
