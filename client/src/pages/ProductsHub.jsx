import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, formatPrice } from "../api.js";

export default function ProductsHub() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiFetch("/api/products"), apiFetch("/api/categories")])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    const base = activeCategory === "all"
      ? products
      : products.filter((p) => p.category_id === activeCategory);
    if (!query.trim()) return base;
    return base.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [products, activeCategory, query]);

  return (
    <section>
      <div className="page-hero">
        <h1>All Products</h1>
        <p>Browse scoops, shakes, sundaes, and kid specials with category tabs.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="toolbar">
        <input
          className="search"
          placeholder="Search flavors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="category-row">
          <button
            className={activeCategory === "all" ? "pill active" : "pill"}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={activeCategory === c.id ? "pill active" : "pill"}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid">
        {filtered.map((p) => (
          <article key={p.id} className="card">
            <img src={p.image_url} alt={p.name} />
            <div className="card-body">
              <p className="tag">{p.category_name || "Ice Cream"}</p>
              <h3>{p.name}</h3>
              <p className="price">{formatPrice(p.price_cents)}</p>
              <Link className="btn" to={`/product/${p.id}`}>View Product</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
