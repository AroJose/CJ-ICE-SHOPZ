import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import multer from "multer";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import { signToken, authRequired, adminRequired } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const db = await initDb();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use("/uploads", express.static(uploadDir));

function formatINR(cents) {
  const rupees = (cents || 0) / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(rupees);
}

// Seed admin + products if needed
async function seed() {
  const admin = await db.get("SELECT * FROM users WHERE email = ?", ["admin@example.com"]);
  const passwordHash = bcrypt.hashSync("admin123", 10);
  if (!admin) {
    await db.run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ["Admin", "admin@example.com", passwordHash, "admin"]
    );
  } else {
    await db.run(
      "UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?",
      [passwordHash, admin.id]
    );
  }

  const productCount = await db.get("SELECT COUNT(*) as c FROM products");
  if (!productCount || Number(productCount.c) === 0) {
    const categories = ["Cones", "Cups", "Sundaes", "Shakes", "Kids Specials"];
    for (const name of categories) {
      await db.run("INSERT INTO categories (name) VALUES (?) ON CONFLICT (name) DO NOTHING", [name]);
    }

    const catRows = await db.all("SELECT * FROM categories");
    const catId = (name) => catRows.find((c) => c.name === name)?.id || null;

    const products = [
      ["Rainbow Cone", "Vanilla scoop with rainbow sprinkles.", 8000, "https://picsum.photos/seed/rainbowcone/640/480", 30, catId("Cones")],
      ["Choco Blast Cup", "Rich chocolate with choco chips.", 9000, "https://picsum.photos/seed/chococup/640/480", 25, catId("Cups")],
      ["Strawberry Sundae", "Strawberry swirl with whipped cream.", 12000, "https://picsum.photos/seed/sundae/640/480", 20, catId("Sundaes")],
      ["Mango Shake", "Creamy mango shake with sprinkles.", 11000, "https://picsum.photos/seed/mangoshake/640/480", 18, catId("Shakes")],
      ["Kids Candy Pop", "Mini cone topped with candy hearts.", 7000, "https://picsum.photos/seed/candycone/640/480", 40, catId("Kids Specials")]
    ];

    await db.transaction(async (tx) => {
      for (const p of products) {
        await tx.run(
          "INSERT INTO products (name, description, price_cents, image_url, stock, category_id) VALUES (?, ?, ?, ?, ?, ?)",
          p
        );
      }
    });
  }

  const adCount = await db.get("SELECT COUNT(*) as c FROM ads");
  if (!adCount || Number(adCount.c) === 0) {
    await db.run(
      "INSERT INTO ads (title, image_url, link_url, active) VALUES (?, ?, ?, ?)",
      ["School Holiday Special", "https://picsum.photos/seed/icead1/900/420", null, true]
    );
    await db.run(
      "INSERT INTO ads (title, image_url, link_url, active) VALUES (?, ?, ?, ?)",
      ["Chocolate Week", "https://picsum.photos/seed/icead2/900/420", null, true]
    );
  }

  const quoteCount = await db.get("SELECT COUNT(*) as c FROM quotes");
  if (!quoteCount || Number(quoteCount.c) === 0) {
    await db.run(
      "INSERT INTO quotes (quote_text, author) VALUES (?, ?)",
      ["Life is better with extra sprinkles.", "CJ Ice Shopz"]
    );
    await db.run(
      "INSERT INTO quotes (quote_text, author) VALUES (?, ?)",
      ["Happiness is a double scoop.", "CJ Ice Shopz"]
    );
  }
}

await seed();

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const exists = await db.get("SELECT id FROM users WHERE email = ?", [email]);
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = bcrypt.hashSync(password, 10);
  await db.run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, "user"]
  );
  const user = await db.get("SELECT id, role FROM users WHERE email = ?", [email]);
  const token = signToken(user, JWT_SECRET);
  res.json({ token });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user, JWT_SECRET);
  res.json({ token });
});

// Products
app.get("/api/products", async (req, res) => {
  const items = await db.all(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.id DESC`
  );
  res.json(items);
});

app.get("/api/products/:id", async (req, res) => {
  const product = await db.get(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

app.post("/api/products", adminRequired(JWT_SECRET), async (req, res) => {
  const { name, description, price_cents, image_url, stock, category_id } = req.body || {};
  if (!name || !description || !price_cents || !image_url || !category_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const result = await db.run(
    "INSERT INTO products (name, description, price_cents, image_url, stock, category_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
    [name, description, price_cents, image_url, stock || 0, category_id]
  );
  const product = await db.get(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [result.insertId]
  );
  res.status(201).json(product);
});

app.put("/api/products/:id", adminRequired(JWT_SECRET), async (req, res) => {
  const { name, description, price_cents, image_url, stock, category_id } = req.body || {};
  const fields = [];
  const params = [];

  if (name) { fields.push("name = ?"); params.push(name); }
  if (description) { fields.push("description = ?"); params.push(description); }
  if (price_cents !== undefined) { fields.push("price_cents = ?"); params.push(price_cents); }
  if (image_url) { fields.push("image_url = ?"); params.push(image_url); }
  if (stock !== undefined) { fields.push("stock = ?"); params.push(stock); }
  if (category_id !== undefined) { fields.push("category_id = ?"); params.push(category_id); }

  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
  params.push(req.params.id);

  await db.run(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, params);
  const product = await db.get(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  res.json(product);
});

app.delete("/api/products/:id", adminRequired(JWT_SECRET), async (req, res) => {
  try {
    await db.run("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Unable to delete product (maybe used in orders)" });
  }
});

// Categories
app.get("/api/categories", async (req, res) => {
  const items = await db.all("SELECT * FROM categories ORDER BY name ASC");
  res.json(items);
});

app.post("/api/categories", adminRequired(JWT_SECRET), async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "Missing fields" });
  const exists = await db.get("SELECT id FROM categories WHERE name = ?", [name]);
  if (exists) return res.status(409).json({ error: "Category already exists" });
  await db.run("INSERT INTO categories (name) VALUES (?)", [name]);
  const category = await db.get("SELECT * FROM categories WHERE name = ?", [name]);
  res.status(201).json(category);
});

app.put("/api/categories/:id", adminRequired(JWT_SECRET), async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: "Missing fields" });
  await db.run("UPDATE categories SET name = ? WHERE id = ?", [name, req.params.id]);
  const category = await db.get("SELECT * FROM categories WHERE id = ?", [req.params.id]);
  res.json(category);
});

app.delete("/api/categories/:id", adminRequired(JWT_SECRET), async (req, res) => {
  try {
    await db.run("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Unable to delete category (maybe used in products)" });
  }
});

// Uploads
app.post("/api/upload", adminRequired(JWT_SECRET), upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url });
});

// Ads
app.get("/api/ads", async (req, res) => {
  const items = await db.all("SELECT * FROM ads WHERE active = TRUE ORDER BY id DESC");
  res.json(items);
});

app.get("/api/admin/ads", adminRequired(JWT_SECRET), async (req, res) => {
  const items = await db.all("SELECT * FROM ads ORDER BY id DESC");
  res.json(items);
});

app.post("/api/ads", adminRequired(JWT_SECRET), async (req, res) => {
  const { title, image_url, link_url, active } = req.body || {};
  if (!title || !image_url) return res.status(400).json({ error: "Missing fields" });
  const result = await db.run(
    "INSERT INTO ads (title, image_url, link_url, active) VALUES (?, ?, ?, ?) RETURNING id",
    [title, image_url, link_url || null, !!active]
  );
  const ad = await db.get("SELECT * FROM ads WHERE id = ?", [result.insertId]);
  res.status(201).json(ad);
});

app.put("/api/ads/:id", adminRequired(JWT_SECRET), async (req, res) => {
  const { title, image_url, link_url, active } = req.body || {};
  const fields = [];
  const params = [];

  if (title) { fields.push("title = ?"); params.push(title); }
  if (image_url) { fields.push("image_url = ?"); params.push(image_url); }
  if (link_url !== undefined) { fields.push("link_url = ?"); params.push(link_url || null); }
  if (active !== undefined) { fields.push("active = ?"); params.push(!!active); }

  if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });
  params.push(req.params.id);

  await db.run(`UPDATE ads SET ${fields.join(", ")} WHERE id = ?`, params);
  const ad = await db.get("SELECT * FROM ads WHERE id = ?", [req.params.id]);
  res.json(ad);
});

app.delete("/api/ads/:id", adminRequired(JWT_SECRET), async (req, res) => {
  await db.run("DELETE FROM ads WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// Quotes
app.get("/api/quotes", async (req, res) => {
  const items = await db.all("SELECT * FROM quotes ORDER BY id DESC");
  res.json(items);
});

app.post("/api/quotes", adminRequired(JWT_SECRET), async (req, res) => {
  const { quote_text, author } = req.body || {};
  if (!quote_text) return res.status(400).json({ error: "Missing fields" });
  const result = await db.run(
    "INSERT INTO quotes (quote_text, author) VALUES (?, ?) RETURNING id",
    [quote_text, author || null]
  );
  const quote = await db.get("SELECT * FROM quotes WHERE id = ?", [result.insertId]);
  res.status(201).json(quote);
});

app.put("/api/quotes/:id", adminRequired(JWT_SECRET), async (req, res) => {
  const { quote_text, author } = req.body || {};
  if (!quote_text) return res.status(400).json({ error: "Missing fields" });
  await db.run(
    "UPDATE quotes SET quote_text = ?, author = ? WHERE id = ?",
    [quote_text, author || null, req.params.id]
  );
  const quote = await db.get("SELECT * FROM quotes WHERE id = ?", [req.params.id]);
  res.json(quote);
});

app.delete("/api/quotes/:id", adminRequired(JWT_SECRET), async (req, res) => {
  await db.run("DELETE FROM quotes WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// Orders
app.post("/api/orders", authRequired(JWT_SECRET), async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items" });
  }

  let total = 0;

  try {
    const normalized = [];
    for (const i of items) {
      const product = await db.get("SELECT * FROM products WHERE id = ?", [i.productId]);
      if (!product) throw new Error("Invalid product");
      const qty = Math.max(1, Number(i.qty || 1));
      total += product.price_cents * qty;
      normalized.push({ product, qty });
    }

    const orderId = await db.transaction(async (tx) => {
      const orderRes = await tx.run(
        "INSERT INTO orders (user_id, total_cents, status, created_at) VALUES (?, ?, ?, ?) RETURNING id",
        [req.user.id, total, "paid", new Date()]
      );

      const orderId = orderRes.insertId;
      for (const row of normalized) {
        await tx.run(
          "INSERT INTO order_items (order_id, product_id, qty, price_cents) VALUES (?, ?, ?, ?)",
          [orderId, row.product.id, row.qty, row.product.price_cents]
        );
      }

      return orderId;
    });

    const order = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: "Unable to create order" });
  }
});

app.get("/api/orders/me", authRequired(JWT_SECRET), async (req, res) => {
  const orders = await db.all(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
    [req.user.id]
  );

  if (orders.length === 0) return res.json([]);
  const orderIds = orders.map((o) => o.id);
  const items = await db.all(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})`,
    orderIds
  );

  const byOrder = new Map();
  for (const item of items) {
    const list = byOrder.get(item.order_id) || [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }

  res.json(
    orders.map((o) => ({
      ...o,
      items: byOrder.get(o.id) || []
    }))
  );
});

app.get("/api/orders/:id/invoice", authRequired(JWT_SECRET), async (req, res) => {
  const orderId = Number(req.params.id);
  const order = await db.get("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role !== "admin" && order.user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const user = await db.get("SELECT name, email FROM users WHERE id = ?", [order.user_id]);
  const items = await db.all(
    `SELECT oi.*, p.name
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="CJICE_Order_${orderId}.pdf"`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  doc.fontSize(22).text("CJ ICE SHOPZ", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Invoice for Order #${orderId}`);
  doc.text(`Customer: ${user?.name || "Customer"} (${user?.email || "-"})`);
  doc.text(`Date: ${order.created_at}`);
  doc.moveDown();

  doc.fontSize(14).text("Items");
  doc.moveDown(0.5);
  items.forEach((i) => {
    const line = `${i.name}  x${i.qty}`;
    const price = formatINR(i.price_cents * i.qty);
    doc.fontSize(12).text(line, { continued: true }).text(price, { align: "right" });
  });

  doc.moveDown();
  doc.fontSize(14).text(`Total: ${formatINR(order.total_cents)}`, { align: "right" });
  doc.end();
});

app.get("/api/admin/orders", adminRequired(JWT_SECRET), async (req, res) => {
  const orders = await db.all(
    `SELECT o.*, u.name as user_name, u.email as user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.id DESC`
  );

  if (orders.length === 0) return res.json([]);
  const orderIds = orders.map((o) => o.id);
  const items = await db.all(
    `SELECT oi.*, p.name, p.image_url
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (${orderIds.map(() => "?").join(",")})`,
    orderIds
  );

  const byOrder = new Map();
  for (const item of items) {
    const list = byOrder.get(item.order_id) || [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }

  res.json(
    orders.map((o) => ({
      ...o,
      items: byOrder.get(o.id) || []
    }))
  );
});

// Admin analytics
app.get("/api/admin/analytics", adminRequired(JWT_SECRET), async (req, res) => {
  const totals = await db.get(
    "SELECT COUNT(*) as total_orders, COALESCE(SUM(total_cents),0) as total_revenue FROM orders"
  );
  const avg = await db.get(
    "SELECT COALESCE(AVG(total_cents),0) as avg_order FROM orders"
  );
  const topItems = await db.all(
    `SELECT p.name, SUM(oi.qty) as qty, SUM(oi.qty * oi.price_cents) as revenue
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     GROUP BY p.id
     ORDER BY qty DESC
     LIMIT 5`
  );
  const revenueByDay = await db.all(
    `SELECT DATE(created_at) as day, COUNT(*) as orders, SUM(total_cents) as revenue
     FROM orders
     GROUP BY DATE(created_at)
     ORDER BY day DESC
     LIMIT 7`
  );

  res.json({
    totals,
    avg,
    topItems,
    revenueByDay: revenueByDay.reverse()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
