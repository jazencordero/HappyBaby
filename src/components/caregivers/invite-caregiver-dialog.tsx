"use client";

import { useState, useTransition } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { createInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function InvitationLinkPanel({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input readOnly value={url} className="text-xs" aria-label="Invitation link" />
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy link">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Anyone with this link can join as a caregiver. It expires in 7 days.
      </p>
    </div>
  );
}

export function InviteCaregiverDialog({ babyId }: { babyId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setInviteUrl(null);
      setEmail("");
    }
  }

  function generate() {
    startTransition(async () => {
      const result = await createInvitation({
        babyId,
        invitedEmail: email.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setInviteUrl(result.data.inviteUrl);
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserPlus /> Invite caregiver
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a caregiver</DialogTitle>
            <DialogDescription>
              They&apos;ll see everything you&apos;ve shared and can add care
              notes.
            </DialogDescription>
          </DialogHeader>
          {inviteUrl ? (
            <InvitationLinkPanel url={inviteUrl} />
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">
                  Caregiver&apos;s email (optional)
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="For your own reference"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={generate} disabled={pending}>
                {pending ? "Generating…" : "Generate invite link"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
