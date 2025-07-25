import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export const updateUserData = async (uid: string, updates: Partial<any>) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
};
