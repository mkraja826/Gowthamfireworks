#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const SOURCE_SYSTEM = "flashbillr";
const APPLY_CONFIRMATION = "APPLY_FLASHBILLR_TO_SUPABASE";
const DEFAULT_ENV_FILE = ".env.import.local";

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    const [rawKey, inlineValue] = value.slice(2).split("=", 2);
    const key = rawKey.replaceAll("-", "_");
    if (inlineValue !== undefined) {
      result[key] = inlineValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      result[key] = argv[index + 1];
      index += 1;
    } else {
      result[key] = true;
    }
  }
  return result;
}

function loadEnvFile(filePath) {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) return;
  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function requireValue(name, value) {
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function deepGet(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function firstValue(object, paths) {
  for (const path of paths) {
    const value = deepGet(object, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function textValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") {
    const nested = firstValue(value, ["name", "title", "label", "value", "code"]);
    return nested === undefined ? null : String(nested).trim() || null;
  }
  return String(value).trim() || null;
}

function numberValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") value = value.replaceAll(",", "").replace(/[^0-9.-]/g, "");
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerValue(value) {
  const number = numberValue(value);
  return number === null ? null : Math.max(0, Math.trunc(number));
}

function booleanValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return ["true", "1", "yes", "y", "active"].includes(value.toLowerCase());
  return false;
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || `item-${Date.now()}`;
}

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function hashPayload(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function collectImageUrls(record) {
  const candidates = [
    firstValue(record, ["image", "imageUrl", "image_url", "photo", "photoUrl", "thumbnail", "thumbnailUrl"]),
    firstValue(record, ["images", "photos", "media"]),
  ];
  const urls = [];
  const add = (value) => {
    if (!value) return;
    if (typeof value === "string" && /^https?:\/\//i.test(value)) urls.push(value);
    if (Array.isArray(value)) value.forEach(add);
    if (typeof value === "object") add(firstValue(value, ["url", "src", "publicUrl", "imageUrl", "thumbnailUrl"]));
  };
  candidates.forEach(add);
  return [...new Set(urls)];
}

function extractRecords(payload) {
  if (Array.isArray(payload)) return payload;
  const preferredKeys = ["products", "items", "data", "results", "result", "catalogue", "inventory"];
  const arrays = [];
  function walk(value, depth = 0, path = "root") {
    if (depth > 4 || value === null || value === undefined) return;
    if (Array.isArray(value)) {
      if (value.some((item) => item && typeof item === "object" && !Array.isArray(item))) arrays.push({ path, value });
      return;
    }
    if (typeof value !== "object") return;
    for (const key of preferredKeys) {
      if (key in value) walk(value[key], depth + 1, `${path}.${key}`);
    }
    for (const [key, nested] of Object.entries(value)) {
      if (!preferredKeys.includes(key)) walk(nested, depth + 1, `${path}.${key}`);
    }
  }
  walk(payload);
  arrays.sort((a, b) => b.value.length - a.value.length);
  if (!arrays.length) throw new Error("Could not find an array of product objects in the FlashBillr response.");
  console.log(`Detected product array at ${arrays[0].path} (${arrays[0].value.length} records).`);
  return arrays[0].value;
}

function normalizeRecord(record, index) {
  const externalId = textValue(firstValue(record, [
    "id", "productId", "product_id", "itemId", "item_id", "uuid", "externalId", "external_id", "sku", "code", "barcode",
  ]));
  const name = textValue(firstValue(record, ["name", "productName", "product_name", "itemName", "item_name", "title"]));
  const sku = textValue(firstValue(record, ["sku", "code", "itemCode", "item_code", "barcode", "productCode", "product_code"]));
  const description = textValue(firstValue(record, ["description", "details", "shortDescription", "short_description", "notes"])) || "";
  const category = textValue(firstValue(record, ["category.name", "categoryName", "category_name", "category", "group.name", "groupName", "group_name"])) || "Uncategorised";
  const brand = textValue(firstValue(record, ["brand.name", "brandName", "brand_name", "brand", "manufacturer.name", "manufacturer"])) || "Gowtham Selection";
  const packSize = textValue(firstValue(record, ["packSize", "pack_size", "packing", "unitName", "unit_name", "unit", "uom", "size"])) || "1 unit";
  const retailPrice = numberValue(firstValue(record, ["retailPrice", "retail_price", "sellingPrice", "selling_price", "salePrice", "sale_price", "price", "rate"]));
  const mrp = numberValue(firstValue(record, ["mrp", "MRP", "listPrice", "list_price", "originalPrice", "original_price", "maximumRetailPrice"]));
  const stockQuantity = integerValue(firstValue(record, ["stockQuantity", "stock_quantity", "availableQuantity", "available_quantity", "quantity", "qty", "stock", "inventory.quantity"]));
  const lowSound = booleanValue(firstValue(record, ["lowSound", "low_sound", "isLowSound", "is_low_sound"]));
  const green = booleanValue(firstValue(record, ["green", "isGreen", "is_green", "ecoFriendly", "eco_friendly"]));
  const sourceUpdatedAt = asDate(firstValue(record, ["updatedAt", "updated_at", "modifiedAt", "modified_at", "lastUpdated", "last_updated"]));
  const imageUrls = collectImageUrls(record);
  const errors = [];
  if (!externalId) errors.push("Missing stable external product ID, SKU or code.");
  if (!name) errors.push("Missing product name.");
  if (retailPrice !== null && retailPrice < 0) errors.push("Retail price cannot be negative.");
  if (mrp !== null && retailPrice !== null && mrp < retailPrice) errors.push("MRP is lower than selling price.");
  const stock = stockQuantity ?? 0;
  const availability = stock === 0 ? "out_of_stock" : stock <= 5 ? "limited" : "available";
  return {
    index,
    external_id: externalId || `invalid-row-${index + 1}`,
    source_updated_at: sourceUpdatedAt,
    payload_hash: hashPayload(record),
    raw_payload: record,
    normalized_payload: {
      name,
      slug: name ? slugify(`${name}-${sku || externalId || index + 1}`) : null,
      sku,
      description,
      category_name: category,
      category_slug: slugify(category),
      brand_name: brand,
      brand_slug: slugify(brand),
      pack_size: packSize,
      retail_price: retailPrice,
      mrp: mrp ?? retailPrice,
      stock_quantity: stock,
      availability,
      is_low_sound: lowSound,
      is_green: green,
      image_urls: imageUrls,
    },
    validation_errors: errors,
  };
}

function parseHeaders() {
  const headers = { Accept: "application/json" };
  if (process.env.FLASHBILLR_HEADERS_JSON) {
    Object.assign(headers, JSON.parse(process.env.FLASHBILLR_HEADERS_JSON));
  }
  if (process.env.FLASHBILLR_API_TOKEN) {
    headers[process.env.FLASHBILLR_AUTH_HEADER || "Authorization"] = process.env.FLASHBILLR_API_TOKEN.startsWith("Bearer ")
      ? process.env.FLASHBILLR_API_TOKEN
      : `Bearer ${process.env.FLASHBILLR_API_TOKEN}`;
  }
  const storeHeader = process.env.FLASHBILLR_STORE_ID_HEADER;
  if (storeHeader) headers[storeHeader] = process.env.FLASHBILLR_STORE_ID;
  return headers;
}

function buildProductsUrl() {
  const storeId = requireValue("FLASHBILLR_STORE_ID", process.env.FLASHBILLR_STORE_ID);
  let url = process.env.FLASHBILLR_PRODUCTS_URL;
  if (!url) {
    const base = requireValue("FLASHBILLR_API_URL", process.env.FLASHBILLR_API_URL).replace(/\/+$/, "");
    const path = requireValue("FLASHBILLR_PRODUCTS_PATH", process.env.FLASHBILLR_PRODUCTS_PATH);
    url = `${base}/${path.replace(/^\/+/, "")}`;
  }
  url = url.replaceAll("{storeId}", encodeURIComponent(storeId));
  const queryParam = process.env.FLASHBILLR_STORE_ID_QUERY_PARAM;
  if (queryParam) {
    const parsed = new URL(url);
    parsed.searchParams.set(queryParam, storeId);
    url = parsed.toString();
  }
  return url;
}

async function readSource(args) {
  if (args.file) {
    const filePath = resolve(String(args.file));
    console.log(`Reading FlashBillr export: ${filePath}`);
    return JSON.parse(readFileSync(filePath, "utf8"));
  }
  const url = buildProductsUrl();
  console.log(`Fetching FlashBillr products from: ${url}`);
  const response = await fetch(url, { headers: parseHeaders() });
  if (!response.ok) throw new Error(`FlashBillr request failed: ${response.status} ${response.statusText}\n${await response.text()}`);
  return response.json();
}

function getSupabase() {
  const url = requireValue("SUPABASE_URL", process.env.SUPABASE_URL);
  const key = requireValue("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function createImportRun(supabase, storeId, fetchedCount) {
  const { data, error } = await supabase.from("catalogue_import_runs").insert({
    source_system: SOURCE_SYSTEM,
    external_store_id: storeId,
    status: "running",
    trigger_type: "manual",
    fetched_count: fetchedCount,
    metadata: { importer: "scripts/import-flashbillr.mjs", node: process.version },
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function stageItems(supabase, runId, records) {
  const rows = records.map((record) => ({
    import_run_id: runId,
    entity_type: "product",
    external_id: record.external_id,
    action: record.validation_errors.length ? "error" : "pending",
    source_updated_at: record.source_updated_at,
    payload_hash: record.payload_hash,
    raw_payload: record.raw_payload,
    normalized_payload: record.normalized_payload,
    validation_errors: record.validation_errors,
    error_message: record.validation_errors.length ? record.validation_errors.join(" ") : null,
  }));
  for (let index = 0; index < rows.length; index += 200) {
    const { error } = await supabase.from("catalogue_import_items").insert(rows.slice(index, index + 200));
    if (error) throw error;
  }
}

async function findOrCreateCategory(supabase, name, slug) {
  const { data: existing, error: findError } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;
  const { data, error } = await supabase.from("categories").insert({ name, slug, is_active: true }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function findOrCreateBrand(supabase, name, slug) {
  const { data: existing, error: findError } = await supabase.from("brands").select("id").eq("slug", slug).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id;
  const { data, error } = await supabase.from("brands").insert({ name, slug, is_active: true }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function getProductMapping(supabase, storeId, externalId) {
  const { data, error } = await supabase.from("external_entity_mappings")
    .select("internal_id")
    .eq("source_system", SOURCE_SYSTEM)
    .eq("external_store_id", storeId)
    .eq("entity_type", "product")
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw error;
  return data?.internal_id || null;
}

async function getImportControls(supabase, productId) {
  const { data, error } = await supabase.from("product_import_controls").select("*").eq("product_id", productId).maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertPrice(supabase, productId, retailPriceListId, price, mrp) {
  if (price === null) return false;
  const { data: current, error: currentError } = await supabase.from("product_prices")
    .select("id,selling_price,mrp")
    .eq("product_id", productId)
    .eq("price_list_id", retailPriceListId)
    .is("effective_until", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (currentError) throw currentError;
  if (current && Number(current.selling_price) === Number(price) && Number(current.mrp ?? price) === Number(mrp ?? price)) return false;
  const now = new Date().toISOString();
  if (current) {
    const { error } = await supabase.from("product_prices").update({ effective_until: now }).eq("id", current.id);
    if (error) throw error;
  }
  const { error } = await supabase.from("product_prices").insert({
    product_id: productId,
    price_list_id: retailPriceListId,
    selling_price: price,
    mrp: Math.max(mrp ?? price, price),
    minimum_quantity: 1,
    effective_from: now,
  });
  if (error) throw error;
  return true;
}

async function applyProduct(supabase, runId, storeId, record, retailPriceListId) {
  const payload = record.normalized_payload;
  let productId = await getProductMapping(supabase, storeId, record.external_id);
  const action = productId ? "update" : "insert";
  const categoryId = await findOrCreateCategory(supabase, payload.category_name, payload.category_slug);
  const brandId = await findOrCreateBrand(supabase, payload.brand_name, payload.brand_slug);
  if (!productId && payload.sku) {
    const { data: skuMatch, error } = await supabase.from("products").select("id").eq("sku", payload.sku).maybeSingle();
    if (error) throw error;
    productId = skuMatch?.id || null;
  }
  if (!productId) {
    const { data, error } = await supabase.from("products").insert({
      category_id: categoryId,
      brand_id: brandId,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      pack_size: payload.pack_size,
      sku: payload.sku,
      status: "draft",
      is_published: false,
      is_low_sound: payload.is_low_sound,
      is_green: payload.is_green,
    }).select("id").single();
    if (error) throw error;
    productId = data.id;
  } else {
    const controls = await getImportControls(supabase, productId);
    const updates = {};
    if (!controls || controls.sync_name) updates.name = payload.name;
    if (!controls || controls.sync_description) updates.description = payload.description;
    if (!controls || controls.sync_category) updates.category_id = categoryId;
    if (!controls || controls.sync_brand) updates.brand_id = brandId;
    if (!controls || controls.sync_pack_size) updates.pack_size = payload.pack_size;
    if (payload.sku) updates.sku = payload.sku;
    updates.is_low_sound = payload.is_low_sound;
    updates.is_green = payload.is_green;
    const { error } = await supabase.from("products").update(updates).eq("id", productId);
    if (error) throw error;
  }
  const now = new Date().toISOString();
  const { error: mappingError } = await supabase.from("external_entity_mappings").upsert({
    source_system: SOURCE_SYSTEM,
    external_store_id: storeId,
    entity_type: "product",
    external_id: record.external_id,
    internal_id: productId,
    source_updated_at: record.source_updated_at,
    last_imported_at: now,
    payload_hash: record.payload_hash,
  }, { onConflict: "source_system,external_store_id,entity_type,external_id" });
  if (mappingError) throw mappingError;
  const { error: controlsError } = await supabase.from("product_import_controls").upsert({ product_id: productId, last_seen_at: now, missing_sync_count: 0 }, { onConflict: "product_id" });
  if (controlsError) throw controlsError;
  const controls = await getImportControls(supabase, productId);
  if (!controls || controls.sync_visibility) {
    const { error } = await supabase.from("product_channel_settings").upsert({
      product_id: productId,
      channel: "retail",
      is_visible: true,
      availability: payload.availability,
      minimum_quantity: 1,
    }, { onConflict: "product_id,channel" });
    if (error) throw error;
  } else {
    const { data: existingChannel } = await supabase.from("product_channel_settings").select("product_id").eq("product_id", productId).eq("channel", "retail").maybeSingle();
    if (!existingChannel) {
      const { error } = await supabase.from("product_channel_settings").insert({ product_id: productId, channel: "retail", is_visible: true, availability: payload.availability, minimum_quantity: 1 });
      if (error) throw error;
    }
  }
  if (!controls || controls.sync_stock) {
    const { error } = await supabase.from("inventory").upsert({ product_id: productId, stock_quantity: payload.stock_quantity, reserved_quantity: 0, low_stock_threshold: 5, updated_at: now }, { onConflict: "product_id" });
    if (error) throw error;
  }
  if (!controls || controls.sync_retail_price) await upsertPrice(supabase, productId, retailPriceListId, payload.retail_price, payload.mrp);
  const { error: stageError } = await supabase.from("catalogue_import_items").update({ action, internal_id: productId, applied_at: now, error_message: null }).eq("import_run_id", runId).eq("entity_type", "product").eq("external_id", record.external_id);
  if (stageError) throw stageError;
  return action;
}

async function updateRun(supabase, runId, values) {
  const { error } = await supabase.from("catalogue_import_runs").update(values).eq("id", runId);
  if (error) throw error;
}

function printSummary(records) {
  const valid = records.filter((record) => record.validation_errors.length === 0);
  const invalid = records.filter((record) => record.validation_errors.length > 0);
  console.log("\nFlashBillr import preview");
  console.log("-------------------------");
  console.log(`Records: ${records.length}`);
  console.log(`Valid:   ${valid.length}`);
  console.log(`Invalid: ${invalid.length}`);
  console.log("\nFirst normalized products:");
  console.table(valid.slice(0, 8).map((record) => ({
    external_id: record.external_id,
    name: record.normalized_payload.name,
    sku: record.normalized_payload.sku,
    category: record.normalized_payload.category_name,
    price: record.normalized_payload.retail_price,
    stock: record.normalized_payload.stock_quantity,
  })));
  if (invalid.length) {
    console.log("\nValidation failures:");
    console.table(invalid.slice(0, 20).map((record) => ({ external_id: record.external_id, errors: record.validation_errors.join(" ") })));
  }
}

function saveReport(records, mode, runId = null) {
  const reportPath = resolve("imports/reports", `${new Date().toISOString().replaceAll(":", "-")}-${mode}.json`);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ mode, run_id: runId, created_at: new Date().toISOString(), records }, null, 2));
  console.log(`Local report saved: ${reportPath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(String(args.env || DEFAULT_ENV_FILE));
  const mode = args.apply ? "apply" : args.stage ? "stage" : "dry-run";
  if (args.help) {
    console.log(`Usage:\n  npm run import:flashbillr -- --file imports/flashbillr-products.json\n  npm run import:flashbillr:stage -- --file imports/flashbillr-products.json\n  npm run import:flashbillr:apply -- --file imports/flashbillr-products.json --confirm ${APPLY_CONFIRMATION}\n\nWithout --file, configure FLASHBILLR_PRODUCTS_URL or FLASHBILLR_PRODUCTS_PATH.`);
    return;
  }
  const source = await readSource(args);
  let records = extractRecords(source).map(normalizeRecord);
  if (args.limit) records = records.slice(0, Math.max(1, Number(args.limit)));
  printSummary(records);
  if (mode === "dry-run") {
    saveReport(records, mode);
    console.log("\nDry-run complete. No Supabase data was changed.");
    return;
  }
  const storeId = requireValue("FLASHBILLR_STORE_ID", process.env.FLASHBILLR_STORE_ID);
  const supabase = getSupabase();
  const runId = await createImportRun(supabase, storeId, records.length);
  try {
    await stageItems(supabase, runId, records);
    const validRecords = records.filter((record) => record.validation_errors.length === 0);
    const invalidCount = records.length - validRecords.length;
    await updateRun(supabase, runId, {
      status: "validated",
      valid_count: validRecords.length,
      failed_count: invalidCount,
      completed_at: mode === "stage" ? new Date().toISOString() : null,
    });
    if (mode === "stage") {
      saveReport(records, mode, runId);
      console.log(`\nStaging complete. Import run: ${runId}`);
      console.log("No live catalogue products were changed.");
      return;
    }
    if (args.confirm !== APPLY_CONFIRMATION) {
      throw new Error(`Live apply blocked. Re-run with --confirm ${APPLY_CONFIRMATION}`);
    }
    const { data: retailList, error: priceListError } = await supabase.from("price_lists").select("id").eq("code", "RETAIL").single();
    if (priceListError) throw priceListError;
    let inserted = 0;
    let updated = 0;
    let failed = invalidCount;
    for (const record of validRecords) {
      try {
        const action = await applyProduct(supabase, runId, storeId, record, retailList.id);
        if (action === "insert") inserted += 1;
        else updated += 1;
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : String(error);
        await supabase.from("catalogue_import_items").update({ action: "error", error_message: message }).eq("import_run_id", runId).eq("entity_type", "product").eq("external_id", record.external_id);
        console.error(`Failed ${record.external_id}: ${message}`);
      }
    }
    const applied = inserted + updated;
    await updateRun(supabase, runId, {
      status: failed ? (applied ? "partially_applied" : "failed") : "applied",
      inserted_count: inserted,
      updated_count: updated,
      failed_count: failed,
      completed_at: new Date().toISOString(),
    });
    saveReport(records, mode, runId);
    console.log(`\nApply complete. Run: ${runId}`);
    console.log(`Inserted: ${inserted}, updated: ${updated}, failed: ${failed}`);
    console.log("Imported products remain draft/unpublished until the owner reviews them.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateRun(supabase, runId, { status: "failed", error_summary: message, completed_at: new Date().toISOString() }).catch(() => undefined);
    throw error;
  }
}

main().catch((error) => {
  console.error(`\nImport failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
