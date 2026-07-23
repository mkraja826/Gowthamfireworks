"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";

const links = [
  ["Retail Catalogue", "/catalogue"],
  ["Festival Packs", "/catalogue?category=Family%20Combos"],
  ["Wholesale", "/wholesale"],
  ["About Factory", "/#about"],
  ["Safety", "/#safety"],
  ["Contact", "/#contact"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <>
      <div className="announcement">Catalogue and requirement portal. Final availability and fulfilment are confirmed directly by the factory.</div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Gowtham Fireworks home">
            <span className="brand-mark">G</span>
            <span><strong>Gowtham</strong><small>Fireworks Industries</small></span>
          </Link>
          <nav className={open ? "main-nav open" : "main-nav"} aria-label="Primary navigation">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link className="text-link" href="/login">Login</Link>
            <Link className="cart-link" href="/cart">Cart <span>{itemCount}</span></Link>
            <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle menu">☰</button>
          </div>
        </div>
      </header>
    </>
  );
}
