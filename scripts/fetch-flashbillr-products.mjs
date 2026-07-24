#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const DEFAULT_ENV_FILE = ".env.import.local";
const DEFAULT_LOGIN_PATH = "/api/auth/login";
const DEFAULT_PRODUCTS_PATH = "/api/storeadmin/products";
const DEFAULT_PROFILE_PATH = "/api/auth/profile";
const DEFAULT_OUTPUT_FILE = "imports/flashbillr-products.json";

let runtimeToken = null;
let loginUser = null;

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

function getPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function firstPath(object, paths) {
  for (const path of paths) {
    const value = getPath(object, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function responseShape(value) {
  if (!value || typeof value !== "object") return `response type: ${typeof value}`;
  const topLevel = Object.keys(value);
  const nested = [];
  for (const key of topLevel) {
    const child = value[key];
    if (child && typeof child === "object" && !Array.isArray(child)) {
      nested.push(`${key}.{${Object.keys(child).join(", ")}}`);
    }
  }
  return [
    `top-level fields: ${topLevel.length ? topLevel.join(", ") : "(none)"}`,
    nested.length ? `nested fields: ${nested.join("; ")}` : null,
  ].filter(Boolean).join("; ");
}

function safeDetail(value) {
  if (value === undefined || value === null || value === "") return "No error details returned.";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, (key, nestedValue) => {
      if (/token|password|secret|authorization/i.test(key)) return "[REDACTED]";
      return nestedValue;
    });
  } catch {
    return String(value);
  }
}

function normalizeBearerToken(token) {
  const text = String(token).trim();
  return text.startsWith("Bearer ") ? text.slice("Bearer ".length).trim() : text;
}

function extractToken(payload) {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  return firstPath(payload, [
    "token",
    "accessToken",
    "access_token",
    "jwt",
    "authToken",
    "auth_token",
    "data.token",
    "data.accessToken",
    "data.access_token",
    "data.jwt",
    "data.authToken",
    "data.auth_token",
    "result.token",
    "result.accessToken",
    "result.access_token",
    "result.jwt",
    "payload.token",
    "payload.accessToken",
    "response.token",
    "response.accessToken",
    "tokens.accessToken",
    "tokens.access_token",
  ]);
}

function extractUser(payload) {
  return firstPath(payload, [
    "user",
    "data.user",
    "result.user",
    "payload.user",
    "response.user",
    "data.profile",
    "profile",
  ]);
}

function bearerHeaders() {
  const token = runtimeToken || process.env.FLASHBILLR_API_TOKEN;
  const normalized = normalizeBearerToken(requireValue("FlashBillr JWT or admin credentials", token));
  const headers = { Accept: "application/json", Authorization: `Bearer ${normalized}` };
  if (process.env.FLASHBILLR_HEADERS_JSON) {
    Object.assign(headers, JSON.parse(process.env.FLASHBILLR_HEADERS_JSON));
  }
  return headers;
}

async function authenticate() {
  if (process.env.FLASHBILLR_API_TOKEN) {
    runtimeToken = normalizeBearerToken(process.env.FLASHBILLR_API_TOKEN);
    console.log("Using FlashBillr JWT from .env.import.local.");
    return;
  }

  const email = requireValue("FLASHBILLR_ADMIN_EMAIL", process.env.FLASHBILLR_ADMIN_EMAIL);
  const password = requireValue("FLASHBILLR_ADMIN_PASSWORD", process.env.FLASHBILLR_ADMIN_PASSWORD);
  const loginPath = process.env.FLASHBILLR_LOGIN_PATH || DEFAULT_LOGIN_PATH;
  const loginUrl = `${apiBaseUrl()}/${loginPath.replace(/^\/+/, "")}`;

  console.log("Signing in to FlashBillr directly through the backend API...");
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.text();
  let payload = null;
  try {
    payload = body ? JSON.parse(body) : null;
  } catch {
    payload = body || null;
  }

  if (!response.ok) {
    const detail = firstPath(payload, [
      "message",
      "error.message",
      "error",
      "data.message",
      "data.error.message",
      "data.error",
    ]) ?? payload ?? response.statusText;
    throw new Error(`FlashBillr login failed: ${response.status} ${safeDetail(detail)}`);
  }

  const token = extractToken(payload);
  if (!token) {
    throw new Error(
      `FlashBillr login returned HTTP ${response.status}, but the exporter could not locate a JWT. ${responseShape(payload)}`
    );
  }

  runtimeToken = normalizeBearerToken(token);
  loginUser = extractUser(payload);
  console.log("FlashBillr login successful. JWT kept in memory only.");
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: bearerHeaders() });
  const body = await response.text();
  let payload = null;
  try {
    payload = body ? JSON.parse(body) : null;
  } catch {
    payload = body || null;
  }

  if (!response.ok) {
    const detail = firstPath(payload, [
      "message",
      "error.message",
      "error",
      "data.message",
      "data.error.message",
      "data.error",
    ]) ?? payload ?? response.statusText;
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `FlashBillr rejected the credentials (${response.status}). Check the admin email/password or replace FLASHBILLR_API_TOKEN.\n${safeDetail(detail)}`
      );
    }
    throw new Error(`FlashBillr request failed: ${response.status} ${response.statusText}\n${safeDetail(detail)}`);
  }

  return payload;
}

function verifyUserStore(user, expectedStoreId, sourceLabel) {
  if (!user) return null;
  const role = user.role;
  const store = user.store ?? null;
  const actualStoreId = store?.id ?? user.storeId ?? user.store_id;

  if (role && !["storeAdmin", "STOREADMIN", "storeadmin"].includes(role)) {
    throw new Error(`${sourceLabel} role is ${role}; a FlashBillr store-admin account is required.`);
  }
  if (actualStoreId && String(actualStoreId) !== String(expectedStoreId)) {
    throw new Error(`${sourceLabel} belongs to store ${actualStoreId}, not expected store ${expectedStoreId}. Export blocked.`);
  }
  return actualStoreId
    ? { id: String(actualStoreId), name: store?.name ?? null, slug: store?.slug ?? null }
    : null;
}

async function verifyStore() {
  const expectedStoreId = requireValue("FLASHBILLR_STORE_ID", process.env.FLASHBILLR_STORE_ID);
  const loginStore = verifyUserStore(loginUser, expectedStoreId, "Login response");
  if (!envBoolean("FLASHBILLR_VERIFY_STORE", true)) {
    return loginStore || { id: expectedStoreId, name: null, slug: null };
  }

  const profilePath = process.env.FLASHBILLR_PROFILE_PATH || DEFAULT_PROFILE_PATH;
  const payload = await fetchJson(`${apiBaseUrl()}/${profilePath.replace(/^\/+/, "")}`);
  const profileUser = extractUser(payload) ?? firstPath(payload, ["data", "result", "payload"]) ?? payload;
  const profileStore = verifyUserStore(profileUser, expectedStoreId, "Profile");

  if (!profileStore) {
    throw new Error(
      `FlashBillr profile did not return a store ID. Tenant verification failed, so export was blocked. ${responseShape(payload)}`
    );
  }

  console.log(`Verified store: ${profileStore.name || expectedStoreId} (${expectedStoreId})`);
  return profileStore;
}

function extractProductsPayload(payload) {
  const products = firstPath(payload, [
    "products",
    "data.products",
    "result.products",
    "payload.products",
    "response.products",
    "data.items",
    "items",
  ]);
  const pagination = firstPath(payload, [
    "pagination",
    "data.pagination",
    "result.pagination",
    "payload.pagination",
    "response.pagination",
    "meta.pagination",
    "data.meta.pagination",
  ]) ?? {};
  return { products, pagination };
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
    const extracted = extractProductsPayload(payload);
    if (!Array.isArray(extracted.products)) {
      throw new Error(
        `Unexpected FlashBillr response: expected a products array. ${responseShape(payload)}`
      );
    }

    products.push(...extracted.products);
    const pagination = extracted.pagination ?? {};
    totalPages = Number(
      pagination.pages ??
      pagination.totalPages ??
      pagination.total_pages ??
      pagination.pageCount ??
      1
    );
    reportedTotal = Number(pagination.total ?? pagination.totalCount ?? products.length);

    if (!extracted.products.length || page >= totalPages) break;
    page += 1;
  }

  if (totalPages && totalPages > maxPages) {
    throw new Error(
      `FlashBillr reported ${totalPages} pages, exceeding FLASHBILLR_MAX_PAGES=${maxPages}. Export stopped safely.`
    );
  }

  return {
    products,
    pagination: {
      page: 1,
      limit: pageSize,
      total: reportedTotal ?? products.length,
      pages: totalPages ?? 1,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(String(args.env || DEFAULT_ENV_FILE));

  if (args.help) {
    console.log("Usage: npm run fetch:flashbillr-products -- --output imports/flashbillr-products.json");
    console.log(
      "Provide either FLASHBILLR_API_TOKEN or FLASHBILLR_ADMIN_EMAIL plus FLASHBILLR_ADMIN_PASSWORD in .env.import.local."
    );
    return;
  }

  await authenticate();
  const store = await verifyStore();
  const result = await fetchAllProducts();
  const outputFile = resolve(String(args.output || DEFAULT_OUTPUT_FILE));
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(
    outputFile,
    JSON.stringify(
      {
        source: "flashbillr",
        store,
        fetchedAt: new Date().toISOString(),
        ...result,
      },
      null,
      2
    )
  );

  console.log(`Exported ${result.products.length} products.`);
  console.log(`Saved: ${outputFile}`);
  console.log("No Supabase connection was made.");
}

main().catch((error) => {
  console.error(`\nFlashBillr export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
