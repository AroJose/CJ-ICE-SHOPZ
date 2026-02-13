import { storeLocations } from "../data/content.js";

export default function WhereToBuy() {
  return (
    <section>
      <div className="page-hero">
        <h1>Where To Buy</h1>
        <p>Find nearby CJ ICE SHOPZ stores and service timings.</p>
      </div>
      <div className="recipe-grid">
        {storeLocations.map((store) => (
          <article key={store.city} className="panel">
            <h3>{store.city}</h3>
            <p>{store.address}</p>
            <p className="muted">{store.hours}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
