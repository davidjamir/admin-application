import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { AUTH_COOKIE_NAME } from "./constants";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.id as string,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as string,
  };
}
