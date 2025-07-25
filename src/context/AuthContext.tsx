"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

interface UserWithRole {
  name: string | null;
  uid: string;
  email: string | null;
  bio: string | null;
  photoURL: string | null;
  role: string;
}

interface AuthContextProps {
  user: UserWithRole | null;
  loading: boolean;
  setUser: (user: UserWithRole | null) => void;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  setUser: () => {},
});

let logoutTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        await auth.currentUser?.getIdToken(true);
      } catch (err: any) {
        if (
          err.code === "unavailable" ||
          err.code === "Failed to get document because the client is offline."
        ) {
          toast.error("Network connection failed.", {
            description: "Please check your Internet connection.",
          });
        } else {
          toast.error("Error fetching user details.");
          console.error("Token refresh failed:", err);
        }
      }
    };

    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          const role = userDocSnap.exists() ? userDocSnap.data().role : "user";

          setUser({
            name: userDocSnap.data()?.name || null,
            uid: currentUser.uid,
            email: currentUser.email,
            bio: userDocSnap.data()?.bio || null,
            photoURL: userDocSnap.data()?.photoURL || null,
            role,
          });
        } catch (err) {
          console.error("Error fetching user:", err);
          toast.error("Error loading profile. Using fallback.");
          setUser({
            name: currentUser.displayName,
            uid: currentUser.uid,
            email: currentUser.email,
            bio: "",
            photoURL: currentUser.photoURL || null,
            role: "user",
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
