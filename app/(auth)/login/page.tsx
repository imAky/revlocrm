"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Shield, UserCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, demoLoginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-purple-600/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ProspectForge
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to access your team prospecting workspace
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Quick 1-Click Demo Personas */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-muted-foreground">Pre-seeded accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemo("admin")}
                disabled={loading}
                className="flex items-center justify-center gap-2 text-xs border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-foreground"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Admin View</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemo("researcher")}
                disabled={loading}
                className="flex items-center justify-center gap-2 text-xs border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/10 text-foreground"
              >
                <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                <span>Researcher</span>
              </Button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border/60 w-full" />
            <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase tracking-wider absolute">
              Or sign in with email
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  defaultValue="admin@prospectforge.demo"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  defaultValue="admin123"
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full font-semibold gap-2"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In to Workspace"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have a workspace?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Create new workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
