import { SignJWT, jwtVerify } from "jose";
import { AUTH_SESSION_JWT_EXPIRES } from "./constants";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "7-forge-inc-secret-key-1234567890-a-very-long-and-secure-one"
);

export async function createToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH_SESSION_JWT_EXPIRES)
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
