"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { revokeInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";

export function RevokeInvitationButton({
  invitationId,
}: {
  invitationId: string;
}) {
  const [pending, startTransition] = useTransition();

  function onRevoke() {
    startTransition(async () => {
      const result = await revokeInvitation({ invitationId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation revoked");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRevoke}
      disabled={pending}
      aria-label="Revoke invitation"
    >
      <X /> {pending ? "Revoking…" : "Revoke"}
    </Button>
  );
}
