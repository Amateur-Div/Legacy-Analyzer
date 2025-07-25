"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import axios from "axios";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GoogleLogin } from "./GoogleLogin";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import loader from "@/utils/loader";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 character(s)"),
});

type SignupData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { loading: isLoading } = useAuth();

  useRedirectIfAuthenticated();

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  const [loading, setLoading] = useState(false);

  const setFirebaseError = (errors: any) => {
    switch (errors.message) {
      case "Firebase: Error (auth/network-request-failed).":
        return "Check your internet connection.";
      case "Firebase: Error (auth/email-already-in-use).":
        return "That email is already in use , please use different email.";
      default:
        break;
    }
  };

  const onSubmit = async (data: SignupData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        bio: "",
        photoURL: "",
        createdAt: serverTimestamp(),
        role: "user",
      });

      await axios.post("/api/users", {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        photoURL: "",
      });

      toast.success("Account created! Please verify your email.");
      router.replace("/login");
    } catch (err: any) {
      const error = setFirebaseError(err);
      toast.error(error || "Something went wrong.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || (auth.currentUser && auth.currentUser.emailVerified))
    return loader();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white"
      >
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 p-10 text-white">
          <h2 className="text-3xl font-bold mb-4">Join the Future 🚀</h2>
          <p className="text-lg text-center opacity-90">
            Create your account and experience a smarter way to handle legacy
            codebases.
          </p>
        </div>

        <Card className="rounded-none border-0">
          <CardHeader className="text-center mt-6">
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="text-sm text-gray-500">Let’s get you started</p>
          </CardHeader>

          <CardContent className="space-y-4 px-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Full Name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button className="w-full mt-2 text-base" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="inline-block w-full h-[1px] bg-gray-200"></span>
              <span className="px-2">or</span>
              <span className="inline-block w-full h-[1px] bg-gray-200"></span>
            </div>

            <GoogleLogin />
          </CardContent>

          <CardFooter className="text-center text-sm text-gray-500 flex flex-col gap-1 mb-4">
            <Link href="/login" className="text-blue-600 hover:underline">
              Already have an account? Log in
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
