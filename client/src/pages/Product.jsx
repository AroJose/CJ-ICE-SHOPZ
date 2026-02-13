import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch, formatPrice, getCart, setCart } from "../api.js";

export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`/api/products/${id}`)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  const addToCart = () => {
    const cart = getCart();
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) existing.qty += 1;
    else cart.push({ productId: product.id, name: product.name, price_cents: product.price_cents, image_url: product.image_url, qty: 1 });
    setCart(cart);
    window.dispatchEvent(new Event("storage"));
  };

  if (!product) return <p className="muted">Loading...</p>;

  return (
    <section className="page-shell">
      <div className="page-hero">
        <h1>Product Detail</h1>
        <p>Customize your order with quantity and continue to checkout.</p>
      </div>
      <div className="product-detail">
      {error && <p className="error">{error}</p>}
      <img src={product.image_url} alt={product.name} />
      <div className="panel">
        <p className="tag">{product.category_name || "Ice Cream"}</p>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p className="price">{formatPrice(product.price_cents)}</p>
        <button className="btn" onClick={addToCart}>Add to cart</button>
      </div>
      </div>
    </section>
  );
}
