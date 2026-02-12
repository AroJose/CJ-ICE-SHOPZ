import { useEffect, useState } from "react";
import { formatPrice, getCart, setCart } from "../api.js";
import { Link } from "react-router-dom";

export default function Cart() {
  const [items, setItems] = useState(getCart());

  useEffect(() => {
    const handler = () => setItems(getCart());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const updateQty = (productId, qty) => {
    const next = items.map((i) => (i.productId === productId ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    setItems(next);
    setCart(next);
    window.dispatchEvent(new Event("storage"));
  };

  const total = items.reduce((sum, i) => sum + i.price_cents * i.qty, 0);
  const tax = Math.round(total * 0.05);
  const grandTotal = total + tax;

  if (items.length === 0) return <p>Your cart is empty.</p>;

  return (
    <section>
      <h1>Your cart</h1>
      <div className="cart">
        {items.map((i) => (
          <div key={i.productId} className="cart-row">
            <img src={i.image_url} alt={i.name} />
            <div>
              <h3>{i.name}</h3>
              <p>{formatPrice(i.price_cents)}</p>
            </div>
            <input
              type="number"
              min="0"
              value={i.qty}
              onChange={(e) => updateQty(i.productId, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <div className="bill">
        <div className="bill-row">
          <span>Subtotal</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <div className="bill-row">
          <span>Sweet tax (5%)</span>
          <strong>{formatPrice(tax)}</strong>
        </div>
        <div className="bill-row total">
          <span>Total</span>
          <strong>{formatPrice(grandTotal)}</strong>
        </div>
      </div>
      <Link className="btn" to="/checkout">Generate bill</Link>
    </section>
  );
}
