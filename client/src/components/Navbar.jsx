import { Link, NavLink, useNavigate } from "react-router-dom";
import { cartCount, getToken, isAdmin, setToken } from "../api.js";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [count, setCount] = useState(cartCount());
  const [authed, setAuthed] = useState(!!getToken());
  const [admin, setAdmin] = useState(isAdmin());

  useEffect(() => {
    const handler = () => {
      setCount(cartCount());
      setAuthed(!!getToken());
      setAdmin(isAdmin());
    };
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 500);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  const logout = () => {
    setToken(null);
    setAuthed(false);
    setAdmin(false);
    navigate("/");
  };

  return (
    <header className="nav">
      <Link className="brand" to="/">CJ ICE SHOPZ</Link>
      <nav>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/recipes">Recipes</NavLink>
        <NavLink to="/experience">Experience</NavLink>
        <NavLink to="/brands">Brands</NavLink>
        <NavLink to="/flavor-quiz">Flavor Quiz</NavLink>
        <NavLink to="/where-to-buy">Where to Buy</NavLink>
        <NavLink to="/about-us">About</NavLink>
        <NavLink to="/cart">Cart ({count})</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        {admin && <NavLink to="/admin">Admin</NavLink>}
        {!authed ? (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        ) : (
          <button className="link" onClick={logout}>Logout</button>
        )}
      </nav>
    </header>
  );
}
