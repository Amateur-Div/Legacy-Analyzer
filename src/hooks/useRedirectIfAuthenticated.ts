import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useRedirectIfAuthenticated = () => {
  const { loading } = useAuth();
  const router = useRouter();

  const user = auth.currentUser;

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);
};
