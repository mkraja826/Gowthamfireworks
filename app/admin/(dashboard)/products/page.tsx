"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";

type Category = { id: string; name: string };
type ProductRow = { id: string; name: string; slug: string; status: string; is_published: boolean; inventory?: { stock_quantity: number }[] };

export default function AdminProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const [{ data: categoryRows }, { data: productRows }] = await Promise.all([
      supabase.from("categories").select("id,name").order("display_order"),
      supabase.from("products").select("id,name,slug,status,is_published,inventory(stock_quantity)").order("created_at", { ascending: false }),
    ]);
    setCategories(categoryRows ?? []);
    setProducts((productRows as ProductRow[] | null) ?? []);
  }

  useEffect(() => { void load(); }, []);

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
    if (!supabase) return setMessage("Supabase is not configured. Add .env.local values after creating the project.");
    setLoading(true); setMessage("");

    const name = String(form.get("name"));
    const slug = slugify(String(form.get("slug") || name));
    const { data: product, error: productError } = await supabase.from("products").insert({
      name,
      slug,
      category_id: form.get("category_id") || null,
      description: form.get("description"),
      pack_size: form.get("pack_size"),
      status: form.get("status"),
      is_published: form.get("is_published") === "on",
    }).select("id").single();

    if (productError || !product) { setLoading(false); return setMessage(productError?.message ?? "Product could not be created."); }

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
    if (operationError) { setLoading(false); return setMessage(`Product created, but related data failed: ${operationError.message}`); }

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
    setMessage("Product created successfully.");
    void load();
  }

  return (
    <div className="admin-page"><div className="admin-page-heading"><div><small>Catalogue</small><h1>Products and availability</h1><p>Add each photo, retail price, wholesale price and stock status without editing code.</p></div><button className="secondary-button" onClick={createCategory}>＋ Category</button></div><div className="admin-columns product-admin-columns"><form className="admin-panel product-form" onSubmit={submit}><div className="panel-heading"><h2>Add product</h2><span>Draft or publish</span></div><label>Product name<input name="name" required /></label><div className="form-grid"><label>Slug<input name="slug" placeholder="auto-generated" /></label><label>Category<select name="category_id"><option value="">Uncategorised</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label></div><label>Description<textarea name="description" rows={3} required /></label><div className="form-grid"><label>Pack size<input name="pack_size" placeholder="10 pieces" required /></label><label>Product photo<input name="image" type="file" accept="image/png,image/jpeg,image/webp" /></label></div><h3>Retail</h3><div className="form-grid"><label>Retail MRP<input name="retail_mrp" type="number" min="0" required /></label><label>Retail selling price<input name="retail_price" type="number" min="0" required /></label></div><label>Retail availability<select name="retail_availability" defaultValue="available"><option value="available">Available</option><option value="limited">Limited stock</option><option value="out_of_stock">Out of stock</option><option value="coming_soon">Coming soon</option></select></label><h3>Wholesale</h3><div className="form-grid"><label>Wholesale price<input name="wholesale_price" type="number" min="0" /></label><label>Wholesale MOQ<input name="wholesale_moq" type="number" min="1" defaultValue="1" /></label></div><div className="form-grid"><label>Carton quantity<input name="carton_quantity" type="number" min="1" defaultValue="1" /></label><label>Wholesale availability<select name="wholesale_availability" defaultValue="available"><option value="available">Available</option><option value="limited">Limited stock</option><option value="out_of_stock">Out of stock</option><option value="coming_soon">Coming soon</option></select></label></div><h3>Inventory and publishing</h3><div className="form-grid"><label>Stock quantity<input name="stock_quantity" type="number" min="0" defaultValue="0" /></label><label>Low-stock warning<input name="low_stock_threshold" type="number" min="0" defaultValue="5" /></label></div><label>Status<select name="status" defaultValue="active"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label><label className="checkbox"><input name="is_published" type="checkbox" /> Publish immediately</label><button className="primary-button" disabled={loading}>{loading ? "Saving product…" : "Save product"}</button>{message && <p className="form-message">{message}</p>}</form><section className="admin-panel"><div className="panel-heading"><h2>Product list</h2><span>{products.length} products</span></div>{products.length ? <div className="admin-table">{products.map((product) => <div className="admin-table-row" key={product.id}><div><strong>{product.name}</strong><small>/{product.slug}</small></div><span>{product.inventory?.[0]?.stock_quantity ?? 0} in stock</span><b className={product.is_published ? "published" : "draft"}>{product.is_published ? "Published" : product.status}</b></div>)}</div> : <div className="empty-state compact"><h3>No products yet</h3><p>Apply the Supabase schema and add the first real product.</p></div>}</section></div></div>
  );
}
