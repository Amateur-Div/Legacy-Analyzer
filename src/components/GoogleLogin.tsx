"use client";

import { auth, db, googleProvider } from "@/lib/firebase";
import loader from "@/utils/loader";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const GoogleLogin = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          role: "user",
          createdAt: new Date(),
        });
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Google Sign-in Error : ", error);
      toast.error("Error Signing-in...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center">
      <button
        className="w-80 mt-2 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          loader()
        ) : (
          <>
            <p className="text-white text-lg font-semibold">
              Continue with google
            </p>
          </>
        )}
      </button>
    </main>
  );
};
