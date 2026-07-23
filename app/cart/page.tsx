"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  if (!items.length) return <div className="page-shell narrow container"><div className="empty-state"><span>🛒</span><h1>Your retail cart is empty</h1><p>Add products from the catalogue to prepare your family requirement.</p><Link className="primary-button" href="/catalogue">Browse catalogue</Link></div></div>;

  return (
    <div className="page-shell container"><div className="page-heading"><span className="eyebrow dark">Retail cart</span><h1>Review your requirement.</h1><p>Prices and availability are rechecked before factory confirmation.</p></div><div className="cart-layout"><div className="cart-list">{items.map((item) => <article className="cart-item" key={item.id}><div className="cart-image">{item.imageLabel}</div><div><h2>{item.name}</h2><p>{item.packSize}</p><strong>{formatCurrency(item.retailPrice)}</strong></div><div className="quantity"><button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button></div><button className="remove-button" onClick={() => removeItem(item.id)}>Remove</button></article>)}</div><aside className="cart-summary"><h2>Requirement summary</h2><div><span>Estimated subtotal</span><strong>{formatCurrency(subtotal)}</strong></div><p>This amount is indicative until the factory confirms product availability and applicable terms.</p><Link className="primary-button full" href="/login">Verify phone and continue</Link><button className="text-button" onClick={clearCart}>Clear cart</button></aside></div></div>
  );
}
