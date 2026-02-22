"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/design-system";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full rounded-full bg-rose-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-amber-600 mb-4">
            <Zap className="h-7 w-7 text-accent-fg" />
          </div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-tight">
            Meetup Manager
          </h1>
          <p className="text-sm text-muted mt-1">
            Sign in to manage your community events
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          {/* Credentials form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-3">
            {error && (
              <p className="text-sm text-status-blocked text-center">{error}</p>
            )}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                required
                className={INPUT_CLASS}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted mt-6">
          By signing in, you agree to help organize amazing meetups.
        </p>
      </div>
    </div>
  );
}
