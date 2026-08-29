"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Shield, UserCheck, ArrowRight, Mail, KeyRound, CheckCircle2, RotateCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { demoLoginAction, requestOtpAction, verifyOtpAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP workflow states
  const [otpStep, setOtpStep] = useState<"EMAIL" | "CODE">("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes countdown

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError === "account_suspended" || urlError === "membership_inactive") {
        setError("Access Denied: Your account in this workspace has been suspended by an administrator. Please contact your workspace admin.");
      } else if (urlError === "google_cancelled") {
        setError("Google sign-in was cancelled or failed. Please try again.");
      }
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (otpStep === "CODE" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Google OAuth 1-Click
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  // Request 6-digit OTP code
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await requestOtpAction(formData);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    if (res.success && res.email) {
      setEmail(res.email);
      setOtpStep("CODE");
      setCountdown(600);
      setSuccessMsg(`We sent a 6-digit login code to ${res.email}`);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
    }
    setLoading(false);
  };

  // Verify 6-digit OTP code
  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await verifyOtpAction({
      email,
      otp: otpCode,
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    if (res.success) {
      window.location.href = res.returnUrl || "/dashboard";
    }
  };

  // Demo Persona 1-Click Login
  const handleDemo = async (role: "admin" | "researcher") => {
    setError(null);
    setLoading(true);
    const res = await demoLoginAction(role);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-primary/20">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-sky-500/20 blur-3xl -z-10 rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-500/10 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Revlo
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Sign in to Revlo
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Fast, collaborative B2B prospect research and pipeline management
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white/90 dark:bg-[#121218]/90 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-5">
          {/* 1. GOOGLE 1-CLICK SSO */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-11 rounded-2xl font-semibold text-xs flex items-center justify-center gap-3 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-xs"
          >
            <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-bold">Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-[#121218] px-3 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold absolute">
              Or with email code
            </span>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 2. PASSWORDLESS EMAIL OTP FLOW */}
          {otpStep === "EMAIL" ? (
            <form onSubmit={handleSendCode} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="pl-9 h-11 rounded-2xl bg-slate-50/80 dark:bg-zinc-950/80 border-slate-200 dark:border-zinc-800 text-xs"
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 font-bold gap-2 rounded-2xl shadow-md cursor-pointer"
                disabled={loading}
              >
                {loading ? "Sending Magic Code..." : "Send 6-Digit Login Code"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="font-bold text-foreground block">Enter Verification Code</span>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[240px] block">
                    Sent to <strong className="text-foreground">{email}</strong>
                  </span>
                </div>
                <Badge variant="purple" className="text-[10px] font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatCountdown()}</span>
                </Badge>
              </div>

              <div>
                <Input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center font-mono text-2xl font-black tracking-[0.4em] h-12 rounded-2xl bg-slate-50/90 dark:bg-zinc-950/90 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              {devOtpHint && (
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
                  <span>Dev Code: <strong className="font-mono">{devOtpHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devOtpHint)}
                    className="underline text-[11px] font-bold cursor-pointer hover:opacity-80"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 font-bold gap-2 rounded-2xl shadow-md cursor-pointer"
                disabled={loading || otpCode.length < 6}
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
                <CheckCircle2 className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep("EMAIL");
                    setOtpCode("");
                    setDevOtpHint(null);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpCode("");
                    setCountdown(600);
                    // Re-trigger send
                    const formData = new FormData();
                    formData.set("email", email);
                    requestOtpAction(formData).then((res) => {
                      if (res.devOtp) setDevOtpHint(res.devOtp);
                      setSuccessMsg("New 6-digit code sent!");
                    });
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* 3. QUICK 1-CLICK DEMO PERSONAS */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/70 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin-slow" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-muted-foreground">Pre-seeded personas</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemo("admin")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 text-xs rounded-xl border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-foreground cursor-pointer font-semibold"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-500" />
                <span>Admin View</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemo("researcher")}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 text-xs rounded-xl border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/10 text-foreground cursor-pointer font-semibold"
              >
                <UserCheck className="h-3.5 w-3.5 text-sky-500" />
                <span>Researcher</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have a workspace yet?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Create workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
