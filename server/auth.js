import jwt from "jsonwebtoken";

export function signToken(user, secret) {
  return jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "7d" });
}

export function authRequired(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const payload = jwt.verify(token, secret);
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function adminRequired(secret) {
  const auth = authRequired(secret);
  return (req, res, next) => {
    auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    });
  };
}
