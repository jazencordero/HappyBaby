"use client";

import { useState, useTransition } from "react";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";

import { removeCaregiver } from "@/actions/members";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = { babyId: string; userId: string; name: string };

export function RemoveCaregiverButton({ babyId, userId, name }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onRemove() {
    startTransition(async () => {
      const result = await removeCaregiver({ babyId, userId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name} no longer has access`);
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${name}`}
        onClick={() => setOpen(true)}
      >
        <UserMinus />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll immediately lose access to this profile and every
              record in it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove} disabled={pending}>
              {pending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
