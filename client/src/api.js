export const API_URL = "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return data.id || null;
  } catch {
    return null;
  }
}

export function getUserRole() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json);
    return data.role || null;
  } catch {
    return null;
  }
}

export function isAdmin() {
  return getUserRole() === "admin";
}

function cartKey() {
  const userId = getUserIdFromToken(getToken());
  return userId ? `cart_user_${userId}` : "cart_guest";
}

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey()) || "[]");
  } catch {
    return [];
  }
}

export function setCart(items) {
  localStorage.setItem(cartKey(), JSON.stringify(items));
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format((cents || 0) / 100);
}

export async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function apiUpload(file) {
  const token = getToken();
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data;
}
