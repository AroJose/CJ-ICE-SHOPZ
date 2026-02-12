import { Link } from "react-router-dom";
import { formatPrice } from "../api.js";

export default function ProductCard({ product }) {
  return (
    <article className="card">
      <img src={product.image_url} alt={product.name} />
      <div className="card-body">
        <p className="tag">{product.category_name || "Ice Cream"}</p>
        <h3>{product.name}</h3>
        <p className="price">{formatPrice(product.price_cents)}</p>
        <Link className="btn" to={`/product/${product.id}`}>View</Link>
      </div>
    </article>
  );
}
