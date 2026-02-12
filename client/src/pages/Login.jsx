import { useState } from "react";
import { apiFetch, setToken } from "../api.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(data.token);
      window.dispatchEvent(new Event("storage"));
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h1>Login</h1>
      <form className="form" onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
