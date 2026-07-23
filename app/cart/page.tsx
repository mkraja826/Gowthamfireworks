"use client";

import Link from "next/link";
import { ProductPackVisual } from "@/components/product-pack-visual";
import { useCart } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  if (!items.length) return <div className="page-shell narrow container"><div className="empty-state cart-empty"><span className="empty-cart-mark" aria-hidden="true" /><h1>Your requirement cart is empty</h1><p>Browse the catalogue and add products you would like the factory to review.</p><Link className="primary-button" href="/catalogue">Browse catalogue</Link></div></div>;

  return (
    <div className="page-shell container">
      <div className="checkout-steps"><span className="active"><b>1</b>Cart</span><span><b>2</b>Phone</span><span><b>3</b>Contact details</span><span><b>4</b>Review</span><span><b>5</b>Submitted</span></div>
      <div className="page-heading"><span className="eyebrow dark">Retail requirement</span><h1>Review products and quantities.</h1><p>Prices are indicative until availability, serviceability and applicable terms are confirmed.</p></div>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map((item) => <article className="cart-item" key={item.id}><div className="cart-image"><ProductPackVisual name={item.name} category={item.category} packSize={item.packSize} variant="cart" /></div><div className="cart-item-copy"><small>{item.brand} · {item.category}</small><h2>{item.name}</h2><p>{item.packSize}</p><strong>{formatCurrency(item.retailPrice)}</strong></div><div className="quantity" aria-label={`Quantity for ${item.name}`}><button aria-label="Decrease quantity" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button></div><button className="remove-button" onClick={() => removeItem(item.id)}>Remove</button></article>)}
          <Link className="continue-shopping" href="/catalogue">← Continue browsing products</Link>
        </div>
        <aside className="cart-summary">
          <span className="summary-label">Requirement summary</span>
          <h2>{items.length} product{items.length === 1 ? "" : "s"}</h2>
          <div><span>Estimated subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
          <ul><li>Phone verification is the next step</li><li>Contact and location details follow</li><li>The factory confirms final availability</li></ul>
          <Link className="primary-button full" href="/login">Verify phone and continue</Link>
          <button className="text-button" onClick={clearCart}>Clear requirement cart</button>
          <p className="summary-note">Submitting a requirement does not automatically confirm stock, delivery or fulfilment.</p>
        </aside>
      </div>
    </div>
  );
}
