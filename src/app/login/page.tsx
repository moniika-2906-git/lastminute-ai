"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/authContext";
import { Brain, Sparkles, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  // Listen to mode param in URL
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Name is required");
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Check your input parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6">
      {/* Background blur */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[80px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[80px] -z-10" />

      <div className="w-full max-w-md glass-panel p-8 flex flex-col gap-6">
        {/* Title logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-1.5 justify-center mb-1">
            <Brain className="w-10 h-10 text-violet-400 animate-pulse" />
            <span className="text-2xl font-bold tracking-tight text-white">LastMinute <span className="text-cyan-400">AI</span></span>
          </Link>
          <p className="text-xs text-slate-400">
            {isSignUp ? "Create your workspace to claim your coaching sessions" : "Log in to track your upcoming deadlines"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert("Simulated: Forgot password link clicked.")}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25"
          >
            {loading ? "Authenticating..." : isSignUp ? "Create Account" : "Log In"}
            {!loading && <ArrowRight className="w-4.5 h-4.5" />}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-white/5" />
          <span className="text-[10px] text-slate-500 font-bold uppercase">Or continue with</span>
          <hr className="flex-1 border-white/5" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            {/* Google Icon SVG */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.24 1 3.2 3.75 1.25 7.78l3.85 2.99C6.01 7.42 8.78 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.93 3.42-8.6z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 10.77c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.25 3.22C.45 4.82 0 6.62 0 8.49s.45 3.67 1.25 5.27l3.85-2.99z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.69-2.87c-1.02.69-2.33 1.1-4.27 1.1-3.22 0-5.99-2.38-6.96-5.73L1.19 15.5C3.12 19.57 7.2 23 12 23z"
              />
            </svg>
            Google
          </button>
          
          <button
            onClick={async () => {
              setLoading(true);
              // Trigger Guest simulated session immediately
              if (typeof window !== "undefined") {
                localStorage.setItem("lastminute_mock_uid", "mock_guest_user");
              }
              // Force window reload or context update
              window.location.href = "/dashboard";
            }}
            disabled={loading}
            className="py-2.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-300 hover:bg-violet-600/20 text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Demo Mode
          </button>
        </div>

        {/* Switch mode */}
        <div className="text-xs text-center text-slate-400 mt-2">
          {isSignUp ? (
            <span>
              Already have an account?{" "}
              <button onClick={() => setIsSignUp(false)} className="text-violet-400 hover:text-violet-300 font-semibold focus:outline-none">
                Log In
              </button>
            </span>
          ) : (
            <span>
              New to LastMinute?{" "}
              <button onClick={() => setIsSignUp(true)} className="text-violet-400 hover:text-violet-300 font-semibold focus:outline-none">
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
