#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const DEFAULT_ENV_FILE = ".env.import.local";
const DEFAULT_PRODUCTS_PATH = "/api/storeadmin/products";
const DEFAULT_PROFILE_PATH = "/api/auth/profile";
const DEFAULT_OUTPUT_FILE = "imports/flashbillr-products.json";

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
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
  for (const line of readFileSync(absolutePath, "utf8").split(/\r?\n/)) {
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

function envBoolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function apiBaseUrl() {
  return requireValue("FLASHBILLR_API_URL", process.env.FLASHBILLR_API_URL).replace(/\/+$/, "");
}

function bearerHeaders() {
  const token = requireValue("FLASHBILLR_API_TOKEN", process.env.FLASHBILLR_API_TOKEN);
  const authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  const headers = { Accept: "application/json", Authorization: authorization };
  if (process.env.FLASHBILLR_HEADERS_JSON) {
    Object.assign(headers, JSON.parse(process.env.FLASHBILLR_HEADERS_JSON));
  }
  return headers;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: bearerHeaders() });
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(`FlashBillr rejected the JWT (${response.status}). Log in again and replace FLASHBILLR_API_TOKEN.\n${body}`);
    }
    throw new Error(`FlashBillr request failed: ${response.status} ${response.statusText}\n${body}`);
  }
  return response.json();
}

async function verifyStore() {
  const expectedStoreId = requireValue("FLASHBILLR_STORE_ID", process.env.FLASHBILLR_STORE_ID);
  if (!envBoolean("FLASHBILLR_VERIFY_STORE", true)) return { id: expectedStoreId, name: null };

  const profilePath = process.env.FLASHBILLR_PROFILE_PATH || DEFAULT_PROFILE_PATH;
  const payload = await fetchJson(`${apiBaseUrl()}/${profilePath.replace(/^\/+/, "")}`);
  const user = payload?.user ?? payload;
  const role = user?.role;
  const store = user?.store ?? null;
  const actualStoreId = store?.id ?? user?.storeId ?? user?.store_id;

  if (role && !["storeAdmin", "STOREADMIN", "storeadmin"].includes(role)) {
    throw new Error(`JWT role is ${role}; a FlashBillr store-admin token is required.`);
  }
  if (!actualStoreId) {
    throw new Error("FlashBillr profile did not return a store ID. Tenant verification failed, so export was blocked.");
  }
  if (String(actualStoreId) !== String(expectedStoreId)) {
    throw new Error(`JWT belongs to store ${actualStoreId}, not expected store ${expectedStoreId}. Export blocked.`);
  }

  console.log(`Verified store: ${store?.name || expectedStoreId} (${expectedStoreId})`);
  return { id: expectedStoreId, name: store?.name ?? null, slug: store?.slug ?? null };
}

async function fetchAllProducts() {
  const productsPath = process.env.FLASHBILLR_PRODUCTS_PATH || DEFAULT_PRODUCTS_PATH;
  const productsUrl = `${apiBaseUrl()}/${productsPath.replace(/^\/+/, "")}`;
  const pageSize = Math.min(500, Math.max(1, Number(process.env.FLASHBILLR_PAGE_SIZE || 100)));
  const maxPages = Math.max(1, Number(process.env.FLASHBILLR_MAX_PAGES || 100));
  const products = [];
  let page = 1;
  let totalPages = null;
  let reportedTotal = null;

  while (page <= maxPages && (totalPages === null || page <= totalPages)) {
    const url = new URL(productsUrl);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(pageSize));
    console.log(`Fetching products page ${page}${totalPages ? ` of ${totalPages}` : ""}...`);

    const payload = await fetchJson(url.toString());
    if (!Array.isArray(payload?.products)) {
      throw new Error("Unexpected FlashBillr response: expected a products array.");
    }

    products.push(...payload.products);
    const pagination = payload.pagination ?? {};
    totalPages = Number(pagination.pages ?? pagination.totalPages ?? pagination.total_pages ?? 1);
    reportedTotal = Number(pagination.total ?? products.length);

    if (!payload.products.length || page >= totalPages) break;
    page += 1;
  }

  if (totalPages && totalPages > maxPages) {
    throw new Error(`FlashBillr reported ${totalPages} pages, exceeding FLASHBILLR_MAX_PAGES=${maxPages}. Export stopped safely.`);
  }

  return { products, pagination: { page: 1, limit: pageSize, total: reportedTotal ?? products.length, pages: totalPages ?? 1 } };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(String(args.env || DEFAULT_ENV_FILE));

  if (args.help) {
    console.log("Usage: npm run fetch:flashbillr-products -- --output imports/flashbillr-products.json");
    return;
  }

  const store = await verifyStore();
  const result = await fetchAllProducts();
  const outputFile = resolve(String(args.output || DEFAULT_OUTPUT_FILE));
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, JSON.stringify({
    source: "flashbillr",
    store,
    fetchedAt: new Date().toISOString(),
    ...result,
  }, null, 2));

  console.log(`Exported ${result.products.length} products.`);
  console.log(`Saved: ${outputFile}`);
  console.log("No Supabase connection was made.");
}

main().catch((error) => {
  console.error(`\nFlashBillr export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
