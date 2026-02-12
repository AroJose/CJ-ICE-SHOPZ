import { useEffect, useState } from "react";
import { API_URL, apiFetch, apiUpload, formatPrice, isAdmin } from "../api.js";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ads, setAds] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [adForm, setAdForm] = useState({ title: "", image_url: "", link_url: "", active: true });
  const [quoteForm, setQuoteForm] = useState({ quote_text: "", author: "" });
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_rupees: 0,
    image_url: "",
    stock: 0,
    category_id: ""
  });

  const [editProduct, setEditProduct] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [editAd, setEditAd] = useState(null);
  const [editQuote, setEditQuote] = useState(null);

  const load = async () => {
    try {
      const [p, o, c, a, q, an] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/admin/orders"),
        apiFetch("/api/categories"),
        apiFetch("/api/admin/ads"),
        apiFetch("/api/quotes"),
        apiFetch("/api/admin/analytics")
      ]);
      setProducts(p);
      setOrders(o);
      setCategories(c);
      setAds(a);
      setQuotes(q);
      setAnalytics(an);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!isAdmin()) {
    return (
      <section>
        <h1>Admin</h1>
        <p className="error">You do not have access to this page.</p>
      </section>
    );
  }

  const handleUpload = async (file, onUrl) => {
    if (!file) return;
    try {
      setUploading(true);
      const data = await apiUpload(file);
      onUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: categoryName })
      });
      setCategoryName("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateCategory = async (e) => {
    e.preventDefault();
    if (!editCategory) return;
    await apiFetch(`/api/categories/${editCategory.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editCategory.name })
    });
    setEditCategory(null);
    await load();
  };

  const deleteCategory = async (id) => {
    await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
    await load();
  };

  const submitAd = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/ads", {
        method: "POST",
        body: JSON.stringify(adForm)
      });
      setAdForm({ title: "", image_url: "", link_url: "", active: true });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAd = async (e) => {
    e.preventDefault();
    if (!editAd) return;
    await apiFetch(`/api/ads/${editAd.id}`, {
      method: "PUT",
      body: JSON.stringify(editAd)
    });
    setEditAd(null);
    await load();
  };

  const deleteAd = async (id) => {
    await apiFetch(`/api/ads/${id}`, { method: "DELETE" });
    await load();
  };

  const submitQuote = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/quotes", {
        method: "POST",
        body: JSON.stringify(quoteForm)
      });
      setQuoteForm({ quote_text: "", author: "" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateQuote = async (e) => {
    e.preventDefault();
    if (!editQuote) return;
    await apiFetch(`/api/quotes/${editQuote.id}`, {
      method: "PUT",
      body: JSON.stringify(editQuote)
    });
    setEditQuote(null);
    await load();
  };

  const deleteQuote = async (id) => {
    await apiFetch(`/api/quotes/${id}`, { method: "DELETE" });
    await load();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price_cents: Math.round(Number(form.price_rupees) * 100),
          image_url: form.image_url,
          stock: Number(form.stock),
          category_id: Number(form.category_id)
        })
      });
      setForm({ name: "", description: "", price_rupees: 0, image_url: "", stock: 0, category_id: "" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    await apiFetch(`/api/products/${editProduct.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: editProduct.name,
        description: editProduct.description,
        price_cents: Math.round(Number(editProduct.price_rupees) * 100),
        image_url: editProduct.image_url,
        stock: Number(editProduct.stock),
        category_id: Number(editProduct.category_id)
      })
    });
    setEditProduct(null);
    await load();
  };

  const deleteProduct = async (id) => {
    await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    await load();
  };

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
      <h1>Admin Control Room</h1>
      {error && <p className="error">{error}</p>}

      {analytics && (
        <div className="panel">
          <h3>Analytics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Total revenue</div>
              <div className="stat-value">{formatPrice(analytics.totals.total_revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Total orders</div>
              <div className="stat-value">{analytics.totals.total_orders}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Avg order</div>
              <div className="stat-value">{formatPrice(analytics.avg.avg_order)}</div>
            </div>
          </div>
          <div className="admin-grid">
            <div className="panel">
              <h4>Top items</h4>
              <ul className="list">
                {analytics.topItems.map((i, idx) => (
                  <li key={idx} className="list-row">
                    <span>{i.name}</span>
                    <span className="muted">Qty {i.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h4>Last 7 days</h4>
              <ul className="list">
                {analytics.revenueByDay.map((d, idx) => (
                  <li key={idx} className="list-row">
                    <span>{d.day}</span>
                    <span className="muted">{formatPrice(d.revenue)} • {d.orders} orders</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="admin-grid">
        <div className="panel">
          <h3>Add category</h3>
          <form className="form" onSubmit={submitCategory}>
            <input
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <button className="btn" type="submit">Create category</button>
          </form>
        </div>

        <div className="panel">
          <h3>Add product</h3>
          <form className="form" onSubmit={submit}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Price (₹)" type="number" value={form.price_rupees} onChange={(e) => setForm({ ...form, price_rupees: e.target.value })} />
            <div className="upload-row">
              <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0], (url) => setForm({ ...form, image_url: url }))} />
            </div>
            <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="btn" type="submit" disabled={uploading}>Create</button>
          </form>
        </div>

        <div className="panel">
          <h3>Add ad</h3>
          <form className="form" onSubmit={submitAd}>
            <input placeholder="Ad title" value={adForm.title} onChange={(e) => setAdForm({ ...adForm, title: e.target.value })} />
            <div className="upload-row">
              <input placeholder="Image URL" value={adForm.image_url} onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })} />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0], (url) => setAdForm({ ...adForm, image_url: url }))} />
            </div>
            <input placeholder="Link URL (optional)" value={adForm.link_url} onChange={(e) => setAdForm({ ...adForm, link_url: e.target.value })} />
            <select value={adForm.active ? "1" : "0"} onChange={(e) => setAdForm({ ...adForm, active: e.target.value === "1" })}>
              <option value="1">Active</option>
              <option value="0">Hidden</option>
            </select>
            <button className="btn" type="submit" disabled={uploading}>Create ad</button>
          </form>
        </div>

        <div className="panel">
          <h3>Add quote</h3>
          <form className="form" onSubmit={submitQuote}>
            <textarea placeholder="Quote text" value={quoteForm.quote_text} onChange={(e) => setQuoteForm({ ...quoteForm, quote_text: e.target.value })} />
            <input placeholder="Author (optional)" value={quoteForm.author} onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })} />
            <button className="btn" type="submit">Create quote</button>
          </form>
        </div>
      </div>

      <div className="admin-grid">
        <div className="panel">
          <h3>Categories</h3>
          <ul className="list">
            {categories.map((c) => (
              <li key={c.id} className="list-row">
                <span>{c.name}</span>
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => setEditCategory({ ...c })}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteCategory(c.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          {editCategory && (
            <form className="form" onSubmit={updateCategory}>
              <h4>Edit category</h4>
              <input value={editCategory.name} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} />
              <div className="row-actions">
                <button className="btn" type="submit">Save</button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditCategory(null)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        <div className="panel">
          <h3>Ads</h3>
          <ul className="list">
            {ads.map((a) => (
              <li key={a.id} className="list-row">
                <span>{a.title} {a.active ? "" : "(Hidden)"}</span>
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => setEditAd({ ...a, active: !!a.active })}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteAd(a.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          {editAd && (
            <form className="form" onSubmit={updateAd}>
              <h4>Edit ad</h4>
              <input value={editAd.title} onChange={(e) => setEditAd({ ...editAd, title: e.target.value })} />
              <div className="upload-row">
                <input value={editAd.image_url} onChange={(e) => setEditAd({ ...editAd, image_url: e.target.value })} />
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0], (url) => setEditAd({ ...editAd, image_url: url }))} />
              </div>
              <input value={editAd.link_url || ""} onChange={(e) => setEditAd({ ...editAd, link_url: e.target.value })} />
              <select value={editAd.active ? "1" : "0"} onChange={(e) => setEditAd({ ...editAd, active: e.target.value === "1" })}>
                <option value="1">Active</option>
                <option value="0">Hidden</option>
              </select>
              <div className="row-actions">
                <button className="btn" type="submit" disabled={uploading}>Save</button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditAd(null)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        <div className="panel">
          <h3>Quotes</h3>
          <ul className="list">
            {quotes.map((q) => (
              <li key={q.id} className="list-row">
                <span>{q.quote_text}</span>
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => setEditQuote({ ...q })}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteQuote(q.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          {editQuote && (
            <form className="form" onSubmit={updateQuote}>
              <h4>Edit quote</h4>
              <textarea value={editQuote.quote_text} onChange={(e) => setEditQuote({ ...editQuote, quote_text: e.target.value })} />
              <input value={editQuote.author || ""} onChange={(e) => setEditQuote({ ...editQuote, author: e.target.value })} />
              <div className="row-actions">
                <button className="btn" type="submit">Save</button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditQuote(null)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="panel">
        <h3>Products</h3>
        <ul className="list">
          {products.map((p) => (
            <li key={p.id} className="list-row">
              <span>{p.name} - {formatPrice(p.price_cents)} ({p.category_name || "Uncategorized"})</span>
              <div className="row-actions">
                <button className="btn btn-ghost" onClick={() => setEditProduct({
                  ...p,
                  price_rupees: (p.price_cents || 0) / 100
                })}>Edit</button>
                <button className="btn btn-danger" onClick={() => deleteProduct(p.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        {editProduct && (
          <form className="form" onSubmit={updateProduct}>
            <h4>Edit product</h4>
            <input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
            <textarea value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} />
            <input type="number" value={editProduct.price_rupees} onChange={(e) => setEditProduct({ ...editProduct, price_rupees: e.target.value })} />
            <div className="upload-row">
              <input value={editProduct.image_url} onChange={(e) => setEditProduct({ ...editProduct, image_url: e.target.value })} />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0], (url) => setEditProduct({ ...editProduct, image_url: url }))} />
            </div>
            <input type="number" value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: e.target.value })} />
            <select value={editProduct.category_id || ""} onChange={(e) => setEditProduct({ ...editProduct, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="row-actions">
              <button className="btn" type="submit" disabled={uploading}>Save</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditProduct(null)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="panel">
        <h3>All orders</h3>
        <ul className="list">
          {orders.map((o) => (
            <li key={o.id} className="order-card">
              <div className="order-header">
                <strong>Order #{o.id}</strong>
                <span>{formatPrice(o.total_cents)} • {o.status}</span>
              </div>
              <div className="order-meta">{o.user_name} • {o.user_email}</div>
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
      </div>
    </section>
  );
}
