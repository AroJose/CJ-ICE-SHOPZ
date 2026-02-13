import { useMemo, useState } from "react";
import { quizQuestions } from "../data/content.js";

const outcomes = ["Rainbow Cone", "Choco Blast Cup", "Strawberry Sundae", "Mango Shake"];

export default function FlavorQuiz() {
  const [answers, setAnswers] = useState({});
  const answeredCount = Object.keys(answers).length;
  const isDone = answeredCount === quizQuestions.length;

  const result = useMemo(() => {
    const score = Object.values(answers).reduce((sum, value) => sum + value, 0);
    return outcomes[score % outcomes.length];
  }, [answers]);

  return (
    <section>
      <div className="page-hero">
        <h1>Flavor Quiz</h1>
        <p>Answer 3 quick picks to get your best-matched CJ treat.</p>
      </div>
      <div className="recipe-grid">
        {quizQuestions.map((q) => (
          <article key={q.id} className="panel">
            <h3>{q.question}</h3>
            <div className="chip-row">
              {q.options.map((opt, idx) => (
                <button
                  key={opt}
                  className={answers[q.id] === idx ? "pill active" : "pill"}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                >
                  {opt}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {isDone && (
        <article className="panel quiz-result">
          <h3>Your match: {result}</h3>
          <p>Try this flavor first, then build your own toppings in cart.</p>
        </article>
      )}
    </section>
  );
}
