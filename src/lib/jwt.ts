import { SignJWT, jwtVerify } from 'jose';
import { env } from './env';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);
const refreshSecretKey = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  [key: string]: any;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretKey);
}

export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecretKey);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecretKey);
    return payload as unknown as { userId: string };
  } catch (error) {
    return null;
  }
}
