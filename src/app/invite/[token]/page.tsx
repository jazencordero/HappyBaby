import Link from "next/link";

import { getCurrentUser, getInvitationPreview } from "@/lib/db/queries";
import { AcceptInvitationButton } from "@/components/caregivers/accept-invitation-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATE_COPY: Record<string, string> = {
  invalid: "This invitation link isn't valid.",
  expired: "This invitation has expired.",
  revoked: "This invitation was revoked by the parent.",
  accepted: "This invitation has already been used.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await getInvitationPreview(token).catch(() => null);
  const state = preview?.state ?? "invalid";
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="rounded-2xl">
        {state === "valid" && preview ? (
          <>
            <CardHeader>
              <CardTitle>You&apos;ve been invited 💛</CardTitle>
              <CardDescription>
                {preview.inviter_name || "A parent"} invited you to help care
                for <span className="font-medium">{preview.baby_name}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {user ? (
                <AcceptInvitationButton token={token} />
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    Sign in or create an account to accept.
                  </p>
                  <Button asChild className="w-full">
                    <Link
                      href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
                    >
                      Create account
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                    >
                      Sign in
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Invitation no longer valid</CardTitle>
              <CardDescription>{STATE_COPY[state]}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Ask the parent for a new link.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  );
}
