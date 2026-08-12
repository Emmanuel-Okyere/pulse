import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "pulse_session";
const SECRET = process.env.JWT_SECRET || "insecure-development-secret";
const MAX_AGE = 60 * 60 * 24 * 7; // seven days

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload & SessionUser;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

// Persist the signed token in an http-only cookie.
export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

// Read the current session from the request cookies. Verifies the token AND
// confirms the user still exists, so a deleted account cannot keep a session.
export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export const SESSION_COOKIE = COOKIE_NAME;
