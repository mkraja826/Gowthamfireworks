"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";

const links = [
  ["Categories", "/catalogue"],
  ["Combo Packs", "/catalogue?category=Family%20Combos"],
  ["Wholesale", "/wholesale"],
  ["How to buy", "/#how-it-works"],
  ["Safety", "/#safety"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { itemCount } = useCart();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const supportHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "/#contact";

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/catalogue?q=${encodeURIComponent(value)}` : "/catalogue");
    setOpen(false);
  }

  return (
    <>
      <div className="announcement">
        <span>Retail & approved wholesale catalogue</span>
        <strong>Factory confirmation before fulfilment</strong>
        <a href={supportHref}>Talk to the factory</a>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Gowtham Fireworks home">
            <span className="brand-mark" aria-hidden="true"><i /></span>
            <span><strong>Gowtham</strong><small>Fireworks Industries</small></span>
          </Link>

          <form className="header-search" onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor="site-search">Search crackers</label>
            <input id="site-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crackers, packs or brands" />
            <button type="submit">Search</button>
          </form>

          <nav className={open ? "main-nav open" : "main-nav"} aria-label="Primary navigation">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
            <a className="mobile-support-link" href={supportHref} onClick={() => setOpen(false)}>WhatsApp support</a>
          </nav>

          <div className="header-actions">
            <a className="support-link" href={supportHref}>WhatsApp</a>
            <Link className="account-link" href="/login">Account</Link>
            <Link className="cart-link" href="/cart" aria-label={`Cart with ${itemCount} items`}>Cart <span>{itemCount}</span></Link>
            <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle menu"><i /><i /><i /></button>
          </div>
        </div>
      </header>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link href="/">Home</Link>
        <Link href="/catalogue">Categories</Link>
        <Link href="/cart">Cart <span>{itemCount}</span></Link>
        <Link href="/login">Requests</Link>
        <Link href="/login">Account</Link>
      </nav>
    </>
  );
}
