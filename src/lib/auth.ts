import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = "7d";

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Compare password with hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: {
  id: number;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): {
  id: number;
  email: string;
  role: string;
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}
