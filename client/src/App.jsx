import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Orders from "./pages/Orders.jsx";
import ProductsHub from "./pages/ProductsHub.jsx";
import Recipes from "./pages/Recipes.jsx";
import Experience from "./pages/Experience.jsx";
import Brands from "./pages/Brands.jsx";
import FlavorQuiz from "./pages/FlavorQuiz.jsx";
import WhereToBuy from "./pages/WhereToBuy.jsx";
import AboutUs from "./pages/AboutUs.jsx";

export default function App() {
  return (
    <div className="container">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsHub />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/flavor-quiz" element={<FlavorQuiz />} />
        <Route path="/where-to-buy" element={<WhereToBuy />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}
