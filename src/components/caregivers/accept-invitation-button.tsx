"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { acceptInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";

export function AcceptInvitationButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await acceptInvitation({ token });
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <Button onClick={accept} disabled={pending} className="w-full">
      {pending ? "Joining…" : "Accept invitation"}
    </Button>
  );
}
