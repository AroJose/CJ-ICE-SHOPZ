import { useEffect, useState } from "react";
import { API_URL, apiFetch, formatPrice, getToken } from "../api.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/api/orders/me")
      .then(setOrders)
      .catch((err) => setError(err.message));
  }, []);

  if (!getToken()) return <p>Please login to see your orders.</p>;

  const downloadInvoice = async (orderId) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/orders/${orderId}/invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to download");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CJICE_Order_${orderId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <section>
      <h1>Your orders</h1>
      {error && <p className="error">{error}</p>}
      <ul className="list">
        {orders.map((o) => (
          <li key={o.id} className="order-card">
            <div className="order-header">
              <strong>Order #{o.id}</strong>
              <span>{formatPrice(o.total_cents)} • {o.status}</span>
            </div>
            <div className="order-meta">Placed on {new Date(o.created_at).toLocaleString()}</div>
            <div className="order-items">
              {o.items?.map((i) => (
                <div key={i.id} className="order-item">
                  <img src={i.image_url} alt={i.name} />
                  <div>
                    <div>{i.name}</div>
                    <div className="muted">Qty {i.qty} • {formatPrice(i.price_cents * i.qty)}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => downloadInvoice(o.id)}>Download invoice</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
