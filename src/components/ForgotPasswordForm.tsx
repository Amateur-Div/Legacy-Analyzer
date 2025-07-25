"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Loader2, MailCheck, MailWarning } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const email = watch("email");

  const onSubmit = async (data: ResetFormData) => {
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSent(true);
      setCooldown(60);
      toast.success("Reset email sent! Please check your inbox 📬");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      console.error(err);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      setCooldown(30);
      toast.success("Reset email resent!, Please check your inbox.");
    } catch (err: any) {
      toast.error("Unable to resend.");
      toast.error(err.message || "Unable to resend.");
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md shadow-xl border rounded-2xl">
        <CardHeader className="text-center mt-4">
          <h2 className="text-2xl font-bold">Forgot Password?</h2>
          <p className="text-sm text-gray-500">
            Enter your email to receive a reset link
          </p>
        </CardHeader>

        <CardContent className="space-y-4 px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <MailWarning />
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={sent && cooldown > 0}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || (sent && cooldown > 0)}
            >
              {isSubmitting ? (
                <Button className="w-full mt-2">
                  <span className="flex items-center it justify-center align-middle gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Link...{" "}
                  </span>
                </Button>
              ) : sent ? (
                "Email Sent ✅"
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          {sent && (
            <div className="text-sm text-gray-600 text-center flex flex-col items-center gap-2 mt-2">
              <MailCheck className="text-green-600 w-5 h-5" />
              <p>Didn't receive the email?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Reset Email"}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-center text-sm text-gray-500 flex flex-col gap-1 mb-4">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
