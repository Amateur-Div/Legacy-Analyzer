import { adminAuth } from "./firebase-admin";

export async function authMiddleware(token?: string) {
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (err) {
    console.error("Firebase auth error: ", err);
    throw new Error("Unauthorized: Invalid token");
  }
}
