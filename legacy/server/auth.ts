import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "./db";

/* ---------------- Configuration (env only) ---------------- */

const SESSION_TTL_MS =
  Number(process.env.SESSION_TTL_HOURS ?? 8) * 60 * 60 * 1000;
const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5);
const LOCKOUT_MS = Number(process.env.LOCKOUT_MINUTES ?? 5) * 60 * 1000;

/** Random 64-hex-char token. Only its SHA-256 hash is stored server-side. */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const COOKIE_NAME = "sc_admin_session";
const secureCookie = process.env.COOKIE_SECURE === "true";

/* ---------------- Session helpers ---------------- */

export function createSession(res: Response, adminId: number): void {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    "INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashToken(token), adminId, expiresAt);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // invisible to JavaScript — XSS cannot steal it
    secure: secureCookie, // HTTPS-only in production
    sameSite: "lax", // CSRF hardening
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function destroySession(req: Request, res: Response): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (token) {
    db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(
      hashToken(token),
    );
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

/** Periodically purge expired sessions. */
export function purgeExpiredSessions(): void {
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')")
    .run();
}

/* ---------------- Middleware ---------------- */

export interface AdminRequest extends Request {
  admin?: { id: number; email: string; role: string };
}

/** Route guard: resolves the session cookie to an admin, else 401. */
export function requireAdmin(
  req: AdminRequest,
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
      `SELECT a.id, a.email, a.role, s.expires_at
       FROM admin_sessions s
       JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as
    | { id: number; email: string; role: string; expires_at: string }
    | undefined;

  if (!row || new Date(row.expires_at) <= new Date()) {
    if (row) {
      db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(
        hashToken(token),
      );
    }
    res
      .status(401)
      .json({ error: "Session expired or invalid. Please sign in again." });
    return;
  }

  req.admin = { id: row.id, email: row.email, role: row.role };
  next();
}

/* ---------------- Login / logout logic ---------------- */

export async function attemptLogin(
  email: string,
  password: string,
  ip: string,
): Promise<
  | { ok: true; adminId: number }
  | { ok: false; status: number; error: string }
> {
  // Rate limiting per IP (in-memory; resets on server restart)
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (record?.lockedUntil && record.lockedUntil > now) {
    const mins = Math.ceil((record.lockedUntil - now) / 60000);
    return {
      ok: false,
      status: 429,
      error: `Too many failed attempts. Locked for ${mins} more minute${mins === 1 ? "" : "s"}.`,
    };
  }

  const admin = db
    .prepare("SELECT id, email, password_hash FROM admin_users WHERE email = ?")
    .get(email.trim().toLowerCase()) as
    | { id: number; email: string; password_hash: string }
    | undefined;

  const valid =
    admin !== undefined &&
    (await bcrypt.compare(password, admin.password_hash));

  if (!valid) {
    const count = (record?.count ?? 0) + 1;
    if (count >= MAX_ATTEMPTS) {
      loginAttempts.set(ip, { count: 0, lockedUntil: now + LOCKOUT_MS });
      return {
        ok: false,
        status: 429,
        error: "Too many failed attempts. Try again in 5 minutes.",
      };
    }
    loginAttempts.set(ip, { count, lockedUntil: 0 });
    return {
      ok: false,
      status: 401,
      error: `Invalid email or password. ${MAX_ATTEMPTS - count} attempt${MAX_ATTEMPTS - count === 1 ? "" : "s"} remaining.`,
    };
  }

  loginAttempts.delete(ip);
  return { ok: true, adminId: admin.id };
}

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export { COOKIE_NAME };
