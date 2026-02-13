import { useState } from "react";
import { recipeCategories } from "../data/content.js";

export default function Recipes() {
  const [active, setActive] = useState(recipeCategories[0].id);
  const current = recipeCategories.find((x) => x.id === active) || recipeCategories[0];

  return (
    <section>
      <div className="page-hero">
        <h1>Recipes</h1>
        <p>DIY ideas inspired by our scoop bar formats.</p>
      </div>
      <div className="category-row">
        {recipeCategories.map((cat) => (
          <button
            key={cat.id}
            className={active === cat.id ? "pill active" : "pill"}
            onClick={() => setActive(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="recipe-grid">
        {current.items.map((item) => (
          <article key={item.name} className="panel">
            <h3>{item.name}</h3>
            <p className="muted">Time: {item.time}</p>
            <p className="muted">Level: {item.difficulty}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
