import { useState } from "react";
import { experienceTabs } from "../data/content.js";

export default function Experience() {
  const [active, setActive] = useState(experienceTabs[0].id);
  const tab = experienceTabs.find((t) => t.id === active) || experienceTabs[0];

  return (
    <section>
      <div className="page-hero">
        <h1>The CJ Experience</h1>
        <p>Brand story, nutrition transparency, and store event rhythm in one place.</p>
      </div>
      <div className="category-row">
        {experienceTabs.map((t) => (
          <button
            key={t.id}
            className={active === t.id ? "pill active" : "pill"}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <article className="panel">
        <h3>{tab.label}</h3>
        <p>{tab.text}</p>
      </article>
    </section>
  );
}
