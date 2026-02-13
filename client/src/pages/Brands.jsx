import { brandStories } from "../data/content.js";

export default function Brands() {
  return (
    <section>
      <div className="page-hero">
        <h1>Our Brands</h1>
        <p>Product families tuned for everyday scoops, kids packs, and thick shakes.</p>
      </div>
      <div className="recipe-grid">
        {brandStories.map((brand) => (
          <article key={brand.id} className="panel">
            <h3>{brand.name}</h3>
            <p>{brand.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
