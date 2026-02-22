import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/design-system";

export default function UnauthorizedPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-rose-500/8 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-status-blocked/10 mb-4">
          <ShieldX className="h-7 w-7 text-status-blocked" />
        </div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] tracking-tight">
          Unauthorized
        </h1>
        <p className="text-sm text-muted mt-2">
          You need to sign in to access this page.
        </p>

        <div className="mt-6">
          <Link href="/">
            <Button size="lg" className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
