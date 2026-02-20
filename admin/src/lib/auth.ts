// import jwt from "jsonwebtoken";
// import { cookies } from "next/headers";

// const JWT_SECRET = process.env.JWT_SECRET!;

// export async function verifyToken() {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   if (!token) {
//     return null;
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     return decoded;
//   } catch (error) {
//     return null;
//   }
// }
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { decryptData } from "./crypto";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthUser extends JwtPayload {
  id: string;
  email: string;
}

export async function verifyToken(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const headerList = await headers();

  const cookieToken = cookieStore.get("token")?.value;

  const authHeader = headerList.get("authorization");
  const headerToken = authHeader?.split(" ")[1];

  const token = cookieToken || headerToken;
  if (!token) return null;

  try {
    return jwt.verify(decryptData(token) as string, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}
