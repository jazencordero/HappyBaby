import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your HappyBaby account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignInForm next={next} />
          <p className="text-center text-sm">
            <Link className="underline" href="/forgot-password">
              Forgot password?
            </Link>
          </p>
          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link
              className="underline"
              href={
                next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"
              }
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
