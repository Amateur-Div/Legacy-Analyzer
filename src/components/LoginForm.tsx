"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { GoogleLogin } from "./GoogleLogin";
import { useAuth } from "@/context/AuthContext";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import loader from "@/utils/loader";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const { loading: isLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [sent, isSent] = useState(false);

  useRedirectIfAuthenticated();

  useEffect(() => {
    document?.body.classList.add("bg-gray-100");

    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const setFirebaseError = (errors: any) => {
    switch (errors.message) {
      case "Firebase: Error (auth/invalid-credential).":
        return "Invalid password or email , please re-enter your credentials.";
      default:
        break;
    }
  };

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      if (!userCredential.user.emailVerified) {
        toast.warning("Please verify your email before logging in.");
        setIsVerified(false);
        return;
      }

      toast.success("Logged in successfully!");
      router.replace("/dashboard");
    } catch (err: any) {
      const error = setFirebaseError(err);
      toast.error(error || "Login failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationLink = async () => {
    try {
      const user = auth.currentUser;
      if (user != null) await sendEmailVerification(user);
      setCooldown(60);
      isSent(true);

      toast.success("Verification link sent successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Error sending link.");
    }
  };

  if (isLoading || (auth.currentUser && auth.currentUser.emailVerified))
    return loader();

  return (
    <div className="min-h-screen w-auto flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4 relative">
      {loading && loader()}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white"
      >
        <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 p-10 text-white">
          <h2 className="text-3xl font-bold mb-4">Welcome Back 👋</h2>
          <p className="text-lg text-center opacity-90">
            Log in to access your dashboard and manage your codebase smarter.
          </p>
        </div>

        <Card className="rounded-none border-0">
          <CardHeader className="text-center mt-6">
            <h2 className="text-2xl font-semibold">Login</h2>
            <p className="text-sm text-gray-500">
              Enter your credentials to continue
            </p>
          </CardHeader>

          <CardContent className="space-y-4 px-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Logging In...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            {!isVerified && (
              <div className="text-xs cursor-pointer">
                Didn't receive email ? ,{" "}
                <Button
                  className="text-blue-500 text-xs px-1 hover:underline "
                  onClick={() => handleSendVerificationLink()}
                  disabled={cooldown > 0}
                >
                  click here to send{" "}
                </Button>{" "}
                verification link.{" "}
                <p className="text-sm text-gray-500">
                  {sent && cooldown > 0 && `Resend link in ${cooldown}s`}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="inline-block w-full h-[1px] bg-gray-200"></span>
              <span className="px-2">or</span>
              <span className="inline-block w-full h-[1px] bg-gray-200"></span>
            </div>

            <GoogleLogin />
          </CardContent>

          <CardFooter className="text-center text-sm text-gray-500 flex flex-col gap-1 mb-4">
            <Link href="/signup" className="text-blue-600 hover:underline">
              Don't have an account? Sign up
            </Link>
            <Link href="/reset-password" className="hover:underline">
              Forgot password?
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
