import { jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET is not set in environment variables!');
  }
  return new TextEncoder().encode(secret || 'dsd-training-system-production-secret-jwt-key-2026');
}

export const SECRET_KEY = getJwtSecret();

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}
