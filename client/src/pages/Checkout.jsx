import { useState } from "react";
import { apiFetch, formatPrice, getCart, getToken, setCart } from "../api.js";

export default function Checkout() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const items = getCart();
  const subtotal = items.reduce((sum, i) => sum + i.price_cents * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const placeOrder = async () => {
    if (!getToken()) {
      setStatus("error");
      setMessage("Please login before checkout.");
      return;
    }

    try {
      setStatus("loading");
      const payload = getCart().map((i) => ({ productId: i.productId, qty: i.qty }));
      const order = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items: payload })
      });
      setCart([]);
      window.dispatchEvent(new Event("storage"));
      setStatus("success");
      setMessage(`Bill generated! Order #${order.id} placed successfully.`);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  return (
    <section>
      <h1>Checkout</h1>
      <p>Generate a final bill before placing your order.</p>
      {items.length === 0 && <p>Your cart is empty.</p>}
      <div className="bill">
        {items.map((i) => (
          <div key={i.productId} className="bill-row">
            <span>{i.name} x {i.qty}</span>
            <strong>{formatPrice(i.price_cents * i.qty)}</strong>
          </div>
        ))}
        <div className="bill-row">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <div className="bill-row">
          <span>Sweet tax (5%)</span>
          <strong>{formatPrice(tax)}</strong>
        </div>
        <div className="bill-row total">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>
      <button className="btn" onClick={placeOrder} disabled={status === "loading"}>
        {status === "loading" ? "Placing..." : "Place order"}
      </button>
      {message && <p className={status === "error" ? "error" : "success"}>{message}</p>}
    </section>
  );
}
