import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">HappyBaby</h1>
      <p className="text-muted-foreground text-lg">
        Everything caregivers need to know about your baby, in one shared
        place.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/signup">Sign up</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
