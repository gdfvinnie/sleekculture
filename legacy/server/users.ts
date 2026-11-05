import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";

/* ---------------- Configuration (env only) ---------------- */

const USER_SESSION_TTL_MS =
  Number(process.env.USER_SESSION_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5);
const LOCKOUT_MS = Number(process.env.LOCKOUT_MINUTES ?? 5) * 60 * 1000;

const COOKIE_NAME = "sc_user_session";
const secureCookie = process.env.COOKIE_SECURE === "true";

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------------- Session helpers ---------------- */

export function createUserSession(res: Response, userId: number): void {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + USER_SESSION_TTL_MS).toISOString();
  db.prepare(
    "INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), userId, expiresAt);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    maxAge: USER_SESSION_TTL_MS,
    path: "/",
  });
}

export function destroyUserSession(req: Request, res: Response): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (token) {
    db.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(
      hashToken(token),
    );
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function purgeExpiredUserSessions(): void {
  db.prepare("DELETE FROM user_sessions WHERE expires_at <= datetime('now')").run();
}

export interface UserRequest extends Request {
  user?: { id: number; email: string; name: string | null };
}

/** Route guard for customer-account endpoints. */
export function requireUser(
  req: UserRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, s.expires_at
       FROM user_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as
    | { id: number; email: string; name: string | null; expires_at: string }
    | undefined;

  if (!row || new Date(row.expires_at) <= new Date()) {
    if (row) {
      db.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(
        hashToken(token),
      );
    }
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return;
  }
  req.user = { id: row.id, email: row.email, name: row.name };
  next();
}

/* ---------------- Routes ---------------- */

function attemptLimited(
  req: Request,
  res: Response,
): { ip: string; blocked: false } | { ip: string; blocked: true } {
  const ip = req.ip ?? "unknown";
  const record = loginAttempts.get(ip);
  if (record?.lockedUntil && record.lockedUntil > Date.now()) {
    const mins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    res.status(429).json({
      error: `Too many failed attempts. Locked for ${mins} more minute${mins === 1 ? "" : "s"}.`,
    });
    return { ip, blocked: true };
  }
  return { ip, blocked: false };
}

function registerFailure(ip: string): string {
  const record = loginAttempts.get(ip);
  const count = (record?.count ?? 0) + 1;
  if (count >= MAX_ATTEMPTS) {
    loginAttempts.set(ip, { count: 0, lockedUntil: Date.now() + LOCKOUT_MS });
    return "Too many failed attempts. Try again in 5 minutes.";
  }
  loginAttempts.set(ip, { count, lockedUntil: 0 });
  return `Invalid email or password. ${MAX_ATTEMPTS - count} attempt${MAX_ATTEMPTS - count === 1 ? "" : "s"} remaining.`;
}

export function registerUserRoutes(
  app: import("express").Express,
): void {
  /* ---- Register ---- */
  app.post("/api/account/register", async (req, res) => {
    const { email, password, name } = req.body ?? {};
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanName = typeof name === "string" ? name.trim().slice(0, 80) : "";

    if (!EMAIL_RE.test(cleanEmail)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password.length > 1024) {
      res.status(400).json({ error: "Password is too long." });
      return;
    }

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);
    if (existing) {
      res.status(409).json({
        error: "An account with this email already exists. Try signing in.",
      });
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const info = db
      .prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)")
      .run(cleanEmail, hash, cleanName || null);

    createUserSession(res, Number(info.lastInsertRowid));
    const user = db
      .prepare("SELECT email, name FROM users WHERE id = ?")
      .get(info.lastInsertRowid) as { email: string; name: string | null };
    res.status(201).json({ user: { email: user.email, name: user.name } });
  });

  /* ---- Login ---- */
  app.post("/api/account/login", (req, res) => {
    const { email, password } = req.body ?? {};
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    const gate = attemptLimited(req, res);
    if (gate.blocked) return;

    if (!EMAIL_RE.test(cleanEmail) || typeof password !== "string") {
      res.status(401).json({ error: registerFailure(gate.ip) });
      return;
    }

    const user = db
      .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
      .get(cleanEmail) as
      | { id: number; email: string; name: string | null; password_hash: string }
      | undefined;

    const finish = (valid: boolean) => {
      if (!valid) {
        res.status(401).json({ error: registerFailure(gate.ip) });
        return;
      }
      loginAttempts.delete(gate.ip);
      createUserSession(res, user!.id);
      res.json({ user: { email: user!.email, name: user!.name } });
    };

    // Constant-shape response even when the user doesn't exist
    if (!user) {
      bcrypt
        .compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZDZQj1Vp1p2b3c4d5e6f7g8h9i0jK")
        .then(() => finish(false))
        .catch(() => finish(false));
      return;
    }

    bcrypt
      .compare(password, user.password_hash)
      .then(finish)
      .catch(() => finish(false));
  });

  /* ---- Logout ---- */
  app.post("/api/account/logout", (req, res) => {
    destroyUserSession(req, res);
    res.json({ ok: true });
  });

  /* ---- Me / session resolution ---- */
  app.get("/api/account/me", (req: UserRequest, res) => {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }
    const row = db
      .prepare(
        `SELECT u.email, u.name, u.created_at, s.expires_at
         FROM user_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?`,
      )
      .get(hashToken(token)) as
      | { email: string; name: string | null; created_at: string; expires_at: string }
      | undefined;

    if (!row || new Date(row.expires_at) <= new Date()) {
      res.status(401).json({ error: "Session expired." });
      return;
    }
    res.json({
      user: {
        email: row.email,
        name: row.name,
        memberSince: row.created_at,
      },
    });
  });
}
