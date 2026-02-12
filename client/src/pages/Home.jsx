import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [ads, setAds] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/products"),
      apiFetch("/api/categories"),
      apiFetch("/api/ads"),
      apiFetch("/api/quotes")
    ])
      .then(([items, cats, adItems, quoteItems]) => {
        setProducts(items);
        setCategories(cats);
        setAds(adItems);
        setQuotes(quoteItems);
      })
      .catch((err) => setError(err.message));
  }, []);

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category_id === activeCategory);

  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">CJ Ice Shopz</p>
          <h1>Colorful scoops, happy smiles, and magical toppings.</h1>
          <p className="subhead">
            From crunchy cones to creamy shakes, pick your favorite flavors and
            build a rainbow of joy.
          </p>
        </div>
        <div className="hero-card">
          <p className="eyebrow">Kids favorite</p>
          <h3>Mini Party Pack</h3>
          <p>Mix 3 classics with sprinkles and win a free topping.</p>
          <div className="chip-row">
            <span className="chip">Cone</span>
            <span className="chip">Sundae</span>
            <span className="chip">Shake</span>
          </div>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {ads.length > 0 && (
        <div className="ad-row">
          {ads.map((ad) => (
            <div key={ad.id} className="ad-card">
              <img src={ad.image_url} alt={ad.title} />
              <div className="ad-body">
                <h3>{ad.title}</h3>
                {ad.link_url && (
                  <a className="btn" href={ad.link_url} target="_blank" rel="noreferrer">
                    Learn more
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {quotes.length > 0 && (
        <div className="quote-strip">
          {quotes.slice(0, 2).map((q) => (
            <div key={q.id} className="quote">
              “{q.quote_text}”
              {q.author && <span> — {q.author}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="section-title">
        <h2>Pick your scoop</h2>
        <p>Freshly made treats with playful toppings.</p>
      </div>
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
      <div className="grid">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
