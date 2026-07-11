import Link from "next/link";

import { Button } from "@/components/ui/button";

// One shared screen for both "not found" and "no access" — identical on
// purpose, so URLs never leak whether a baby exists.
export function UnauthorizedState() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold">
        Nothing to see here
      </h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Button asChild variant="outline">
        <Link href="/dashboard">Back to your dashboard</Link>
      </Button>
    </main>
  );
}
