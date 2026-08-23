"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Lock, Mail, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await signupAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-purple-600/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ProspectForge
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Create your workspace</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Get started with collaborative prospect research and sales pipelines
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="name"
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Workspace / Agency Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="workspaceName"
                  type="text"
                  required
                  placeholder="Acme Growth Lab"
                  className="pl-9"
                />
              </div>
            </div>

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
                  placeholder="Minimum 6 characters"
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
              {loading ? "Creating..." : "Launch Workspace"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
