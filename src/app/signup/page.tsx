import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Set up a shared space for your baby&apos;s care.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignUpForm next={next} />
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link
              className="underline"
              href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
